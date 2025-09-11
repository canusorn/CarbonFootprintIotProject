// Load environment variables
require('dotenv').config();

const express = require('express');
const aedes = require('aedes')();
const net = require('net');
const http = require('http');
const { initializeDatabase } = require('./config/database');

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

// MQTT Broker Events
aedes.on('client', (client) => {
  console.log(`MQTT Client connected: ${client.id}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`MQTT Client disconnected: ${client.id}`);
});

aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`Message from ${client.id} on topic ${packet.topic}: ${packet.payload.toString()}`);
    
    // Store sensor data when published to specific topics
    if (packet.topic.startsWith('sensor/')) {
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
        console.error('Error parsing sensor data:', error);
      }
    }
  }
});

aedes.on('subscribe', (subscriptions, client) => {
  console.log(`Client ${client.id} subscribed to:`, subscriptions.map(s => s.topic));
});

// API Routes
// Get all devices
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

// Get device by ID
app.get('/api/devices/:id', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json(device);
});

// Update device
app.put('/api/devices/:id', (req, res) => {
  const deviceIndex = devices.findIndex(d => d.id === req.params.id);
  if (deviceIndex === -1) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  devices[deviceIndex] = { ...devices[deviceIndex], ...req.body, updatedAt: new Date().toISOString() };
  res.json(devices[deviceIndex]);
});

// Get all sensor data
app.get('/api/sensor-data', (req, res) => {
  const { limit = 50, topic, clientId } = req.query;
  let filteredData = sensorData;
  
  if (topic) {
    filteredData = filteredData.filter(data => data.topic.includes(topic));
  }
  
  if (clientId) {
    filteredData = filteredData.filter(data => data.clientId === clientId);
  }
  
  const limitedData = filteredData.slice(-parseInt(limit));
  res.json(limitedData);
});

// Initialize database and start servers
const startServer = async () => {
  let databaseConnected = false;
  
  try {
    // Try to initialize database
    await initializeDatabase();
    databaseConnected = true;
  } catch (error) {
    console.error('⚠️  Starting server without MySQL database');
    console.error('⚠️  Authentication will not work until MySQL is configured');
    console.error('⚠️  Please follow the setup instructions above to enable database features\n');
  }
  
  try {
    // Start HTTP server
    const httpServer = http.createServer(app);
    httpServer.listen(port, () => {
      console.log(`🚀 API Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📡 API Base URL: http://localhost:${port}/api`);
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