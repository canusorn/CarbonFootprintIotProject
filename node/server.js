// Load environment variables
require('dotenv').config();

const express = require('express');
const aedes = require('aedes')();
const net = require('net');
const http = require('http');
const { initializeDatabase } = require('./config/database');
const SensorService = require('./services/sensorService');
const { validatePowerMeterData, validateEspId } = require('./utils/validation');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;
const mqttPort = process.env.MQTT_PORT || 1883;

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

// Use routes
app.use('/api/auth', authRoutes);

// In-memory storage for demo purposes
let devices = [];
let sensorData = [];

// Initialize sensor service
let sensorService = null;

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
            sensorData.push({
              timestamp: new Date().toISOString(),
              topic: packet.topic,
              data: dataValidation.sanitizedData,
              espId,
              fallback: true,
              error: dbError.message
            });
            
            // Keep only last 1000 entries
            if (sensorData.length > 1000) {
              sensorData = sensorData.slice(-1000);
            }
          }
        }else{
          console.log("no sensor service")
        }

        // Also store in memory for immediate access with validated data
        const sensorReading = {
          id: Date.now(),
          clientId: client.id,
          espId: espId,
          topic: packet.topic,
          data: dataValidation.sanitizedData,
          timestamp: new Date().toISOString()
        };
        sensorData.push(sensorReading);

        // Keep only last 1000 readings
        if (sensorData.length > 1000) {
          sensorData = sensorData.slice(-1000);
        }
        
      } catch (error) {
        console.error('❌ Failed to parse /update message:', error.message);
        console.error('❌ Raw message:', packet.payload.toString());
      }
    }
    
    // Store sensor data when published to other sensor topics
    else if (packet.topic.startsWith('sensor/')) {
      try {
        const data = JSON.parse(packet.payload.toString());
        const sensorReading = {
          id: Date.now(),
          clientId: client.id,
          topic: packet.topic,
          data: data,
          timestamp: new Date().toISOString()
        };
        sensorData.push(sensorReading);

        // Keep only last 1000 readings
        if (sensorData.length > 1000) {
          sensorData = sensorData.slice(-1000);
        }
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

// Create device routes with data arrays
const deviceRoutes = createDeviceRoutes(devices, sensorData);

// API Routes
app.get('/api/devices', deviceRoutes.getAllDevices);
app.get('/api/devices/:id', deviceRoutes.getDeviceById);
app.put('/api/devices/:id', deviceRoutes.updateDevice);
app.get('/api/sensor-data', deviceRoutes.getSensorData);

// Initialize database and start servers
const startServer = async () => {
  let databaseConnected = false;

  try {
    // Try to initialize database
    await initializeDatabase();
    databaseConnected = true;
    
    // Initialize sensor service if database is connected
    try {
      sensorService = new SensorService();
      await sensorService.initialize();
      console.log('✅ Sensor service initialized');
    } catch (sensorError) {
      console.error('⚠️  Sensor service initialization failed:', sensorError.message);
      sensorService = null;
    }
    
  } catch (error) {
    console.error('⚠️  Starting server without MySQL database');
    console.error('⚠️  Authentication will not work until MySQL is configured');
    console.error('⚠️  Power meter data will only be stored in memory');
    console.error('⚠️  Please follow the setup instructions above to enable database features\n');
  }

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

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
      mqttServer.close(() => {
        console.log('MQTT server closed');
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