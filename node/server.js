// Load environment variables
require('dotenv').config();

const express = require('express');
const aedes = require('aedes')();
const net = require('net');
const http = require('http');
const WebSocket = require('ws');
const { 
  initializeDatabase, 
  startPeriodicReconnection, 
  getDatabaseStatus,
  checkDatabaseHealth 
} = require('./config/database');
const SensorService = require('./services/sensorService');
const DeviceService = require('./services/deviceService');
const { validatePowerMeterData, validateEspId } = require('./utils/validation');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;
const mqttPort = process.env.MQTT_PORT || 1883;
const wsPort = process.env.WS_PORT || 8083;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const { auth } = require('./middleware/auth');

// Use routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    const isHealthy = await checkDatabaseHealth();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.isConnected,
        healthy: isHealthy,
        hasPool: dbStatus.hasPool,
        hasSensorPool: dbStatus.hasSensorPool
      },
      services: {
        sensorService: !!sensorService,
        deviceService: !!deviceService,
        deviceRoutes: !!deviceRoutes
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false,
        healthy: false
      }
    });
  }
});

// Device and sensor data now stored in MySQL database
// Sensor data is now stored in MySQL database

// Initialize services
let sensorService = null;
let deviceService = null;

// MQTT Broker Events
aedes.on('client', (client) => {
  console.log(`MQTT Client connected: ${client.id}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`MQTT Client disconnected: ${client.id}`);
});

aedes.authenticate = (client, username, password, callback) => {
  if (!client) {
    console.error('❌ MQTT Authentication error: No client provided');
    callback(new Error('Client error for authenticating'), false);
    return;
  }

  // Normalize username
  if (username) {
    username = username.toLowerCase();
  }

  try {
    // Check if password is provided and handle different types
    if (password === undefined || password === null) {
      console.error(`❌ MQTT Authentication failed for client ${client.id}: No password provided`);
      callback(new Error('Authentication failed: No password provided'), false);
      return;
    }

    // Handle different password formats
    let decodedPassword;

    if (Buffer.isBuffer(password)) {
      // Password is a Buffer, convert to string
      try {
        decodedPassword = password.toString('utf8');
      } catch (bufferError) {
        console.error(`❌ MQTT Authentication failed for client ${client.id}: Buffer conversion error`);
        callback(new Error('Authentication failed: Invalid password buffer'), false);
        return;
      }
    } else if (typeof password === 'string') {
      // Password is already a string
      decodedPassword = password;
    } else {
      console.error(`❌ MQTT Authentication failed for client ${client.id}: Invalid password type (${typeof password})`);
      callback(new Error('Authentication failed: Invalid password format'), false);
      return;
    }

    console.log(`🔐 MQTT Authentication attempt - Client ID: ${client.id}, Username: ${username || 'none'}`);

    // Check if MQTT_PASSWORD is configured
    if (!process.env.MQTT_PASSWORD) {
      console.error('❌ MQTT_PASSWORD not configured in environment variables');
      callback(new Error('Server configuration error'), false);
      return;
    }

    // Verify credentials
    if (decodedPassword === process.env.MQTT_PASSWORD) {
      console.log(`✅ MQTT Authentication successful for client ${client.id}`);
      
      // Save ESP device information to database
      if (deviceService && !client.id.startsWith("WEB")) {
        deviceService.saveEspDevice(client.id, client.id, username).catch(error => {
          console.error('Failed to save ESP device during authentication:', error.message);
        });
      }
      
      callback(null, true);
    } else {
      console.log(`❌ MQTT Authentication failed for client ${client.id}: Invalid credentials`);
      callback(new Error('Authentication failed: Invalid credentials'), false);
    }

  } catch (error) {
    console.error(`❌ Error during MQTT authentication for client ${client.id}:`, error.message);
    console.error(`   Error stack:`, error.stack);
    callback(new Error('Authentication error: ' + error.message), false);
  }
};

aedes.on('publish', async (packet, client) => {
  if (client) {
    console.log(`Message from ${client.id} on topic ${packet.topic}: ${packet.payload.toString()}`);

    // Handle /update topic for ESP device power meter data
    if (packet.topic.endsWith('/update')) {
      try {
        const data = JSON.parse(packet.payload.toString());

        // Extract ESP ID from client ID or data
        const espId = data.espid || client.id;

        // Validate ESP ID
        const espIdValidation = validateEspId(espId);
        if (!espIdValidation.isValid) {
          console.error(`❌ Invalid ESP ID in /update message: ${espIdValidation.error}`);
          return;
        }

        // Validate power meter data
        const dataValidation = validatePowerMeterData(data);
        if (!dataValidation.isValid) {
          console.error(`❌ Invalid power meter data for ESP ${espId}:`);
          dataValidation.errors.forEach(error => console.error(`   - ${error}`));
          return;
        }

        // Save to database if sensor service is available
        if (sensorService) {
          try {
            const result = await sensorService.savePowerMeterData(espId, dataValidation.sanitizedData);
            console.log(`💾 Database save successful for ESP ${espId} (Insert ID: ${result.insertId})`);
          } catch (dbError) {
            console.error(`❌ Database save failed for ESP ${espId}:`, dbError.message);
            console.error(`⚠️  Falling back to in-memory storage for this data`);

            // Fallback to in-memory storage when database fails
            // Data is now saved to MySQL database, no in-memory fallback needed
          }
        } else {
          console.log("no sensor service")
        }

        // Sensor data is now stored in MySQL database via SensorService

      } catch (error) {
        console.error('❌ Failed to parse /update message:', error.message);
        console.error('❌ Raw message:', packet.payload.toString());
      }
    }

    // Store sensor data when published to other sensor topics
    else if (packet.topic.startsWith('sensor/')) {
      try {
        const data = JSON.parse(packet.payload.toString());
        // General sensor data logging (not stored in database)
      } catch (error) {
        console.error('MQTT: Error parsing sensor data:', error.message);
      }
    }
  }
});

aedes.on('subscribe', (subscriptions, client) => {
  console.log(`Client ${client.id} subscribed to:`, subscriptions.map(s => s.topic));
});

// Import device routes factory
const createDeviceRoutes = require('./routes/devices');

// Create device routes (will be initialized after services are ready)
let deviceRoutes = null;

// Device routes - these will be set up after services are initialized
app.get('/api/devices', (req, res) => {
  if (deviceRoutes && deviceRoutes.getAllDevices) {
    return deviceRoutes.getAllDevices(req, res);
  }
  res.status(503).json({ error: 'Device service not available' });
});
app.get('/api/devices/:id', (req, res) => {
  if (deviceRoutes && deviceRoutes.getDeviceById) {
    return deviceRoutes.getDeviceById(req, res);
  }
  res.status(503).json({ error: 'Device service not available' });
});
app.put('/api/devices/:id', (req, res) => {
  if (deviceRoutes && deviceRoutes.updateDevice) {
    return deviceRoutes.updateDevice(req, res);
  }
  res.status(503).json({ error: 'Device service not available' });
});
app.get('/api/sensor-data', (req, res) => {
  if (deviceRoutes && deviceRoutes.getSensorData) {
    return deviceRoutes.getSensorData(req, res);
  }
  res.status(503).json({ error: 'Sensor service not available' });
});

// Get sensor data by ESP ID
app.get('/api/sensor-data/:espId', auth, async (req, res) => {
  try {
    const { espId } = req.params;
    const limit = req.query.limit || 100;
    
    if (!sensorService) {
      return res.status(503).json({ error: 'Sensor service not available' });
    }
    
    const data = await sensorService.getHistoricalData(espId, limit);
    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// Get daily energy data by ESP ID
app.get('/api/daily-energy/:espId', auth, async (req, res) => {
  if (deviceRoutes && deviceRoutes.getDailyEnergyData) {
    return deviceRoutes.getDailyEnergyData(req, res);
  }
  res.status(503).json({ error: 'Daily energy service not available' });
});

// Get today's energy data by ESP ID
app.get('/api/today-energy/:espId', auth, async (req, res) => {
  if (deviceRoutes && deviceRoutes.getTodayEnergyData) {
    return deviceRoutes.getTodayEnergyData(req, res);
  }
  res.status(503).json({ error: 'Today energy service not available' });
});

// Get today's power data by ESP ID
app.get('/api/today-power/:espId', auth, async (req, res) => {
  if (deviceRoutes && deviceRoutes.getTodayPowerData) {
    return deviceRoutes.getTodayPowerData(req, res);
  }
  res.status(503).json({ error: 'Today power service not available' });
});

// Initialize database and start servers
// Function to initialize services
const initializeServices = async () => {
  try {
    // Initialize sensor service
    if (!sensorService) {
      sensorService = new SensorService();
    }
    await sensorService.initialize();
    console.log('✅ Sensor service initialized');
  } catch (sensorError) {
    console.error('⚠️  Sensor service initialization failed:', sensorError.message);
    sensorService = null;
  }

  try {
    // Initialize device service
    if (!deviceService) {
      deviceService = new DeviceService();
    }
    await deviceService.initialize();
    console.log('✅ Device service initialized');
  } catch (deviceError) {
    console.error('⚠️  Device service initialization failed:', deviceError.message);
    deviceService = null;
  }

  // Initialize device routes with the service instances
  deviceRoutes = createDeviceRoutes(deviceService, sensorService);
  console.log('✅ Device routes initialized with service instances');
};

// Reconnection callback function
const onDatabaseReconnect = async () => {
  try {
    await initializeServices();
    console.log('🎉 All services reinitialized after database reconnection');
  } catch (error) {
    console.error('❌ Failed to reinitialize services after database reconnection:', error.message);
  }
};

const startServer = async () => {
  let databaseConnected = false;

  try {
    // Try to initialize database
    await initializeDatabase();
    databaseConnected = true;

    // Initialize services if database is connected
    await initializeServices();

  } catch (error) {
    console.error('⚠️  Starting server without MySQL database');
    console.error('⚠️  Authentication will not work until MySQL is configured');
    console.error('⚠️  Power meter data will only be stored in memory');
    console.error('⚠️  Database reconnection will be attempted automatically');
    console.error('⚠️  Please follow the setup instructions above to enable database features\n');
  }

  // Start periodic reconnection attempts
  const reconnectInterval = startPeriodicReconnection(onDatabaseReconnect);
  console.log('🔄 Automatic database reconnection enabled (checking every 30 seconds)');

  try {
    // Start HTTP server
    const httpServer = http.createServer(app);
    httpServer.listen(port, () => {
      console.log(`🚀 API Server running on port ${port}`);
      if (databaseConnected) {
        console.log(`✅ MySQL database connected and ready`);
      } else {
        console.log(`⚠️  MySQL database not connected - authentication disabled`);
      }
    });

    // Start MQTT broker
    const mqttServer = net.createServer(aedes.handle);
    mqttServer.listen(mqttPort, () => {
      console.log(`🔌 MQTT Broker running on port ${mqttPort}`);
      console.log(`📱 MQTT Connection: mqtt://localhost:${mqttPort}`);
    });

    // Start WebSocket server for MQTT over WebSocket
    const wsServer = new WebSocket.Server({ 
      port: wsPort,
      perMessageDeflate: false
    });
    
    wsServer.on('connection', (ws, req) => {
      const stream = WebSocket.createWebSocketStream(ws);
      aedes.handle(stream);
    });
    
    wsServer.on('listening', () => {
      console.log(`🌐 MQTT WebSocket server running on port ${wsPort}`);
      console.log(`📱 WebSocket MQTT Connection: ws://localhost:${wsPort}/mqtt`);
    });
    
    wsServer.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      
      // Clear reconnection interval
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        console.log('Database reconnection stopped');
      }
      
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
      mqttServer.close(() => {
        console.log('MQTT server closed');
      });
      wsServer.close(() => {
        console.log('WebSocket server closed');
      });
      aedes.close(() => {
        console.log('Aedes broker closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();



// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, aedes };