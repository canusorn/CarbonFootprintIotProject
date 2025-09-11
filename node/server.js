const express = require('express');
const aedes = require('aedes')();
const net = require('net');
const http = require('http');

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mqtt_broker: 'running',
    api_server: 'running'
  });
});

// Get all devices
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

// Register a new device
app.post('/api/devices', (req, res) => {
  const { deviceId, name, type, location } = req.body;
  
  if (!deviceId || !name) {
    return res.status(400).json({ error: 'deviceId and name are required' });
  }
  
  const device = {
    id: deviceId,
    name,
    type: type || 'sensor',
    location: location || 'unknown',
    registeredAt: new Date().toISOString(),
    lastSeen: null
  };
  
  devices.push(device);
  res.status(201).json(device);
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

// Delete device
app.delete('/api/devices/:id', (req, res) => {
  const deviceIndex = devices.findIndex(d => d.id === req.params.id);
  if (deviceIndex === -1) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  devices.splice(deviceIndex, 1);
  res.status(204).send();
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

// Get latest sensor data by topic
app.get('/api/sensor-data/latest/:topic', (req, res) => {
  const topic = req.params.topic;
  const topicData = sensorData.filter(data => data.topic === `sensor/${topic}`);
  
  if (topicData.length === 0) {
    return res.status(404).json({ error: 'No data found for this topic' });
  }
  
  const latest = topicData[topicData.length - 1];
  res.json(latest);
});

// Publish message to MQTT topic (API endpoint to send commands to devices)
app.post('/api/mqtt/publish', (req, res) => {
  const { topic, message, qos = 0, retain = false } = req.body;
  
  if (!topic || !message) {
    return res.status(400).json({ error: 'topic and message are required' });
  }
  
  const packet = {
    topic,
    payload: typeof message === 'string' ? message : JSON.stringify(message),
    qos,
    retain
  };
  
  aedes.publish(packet, (error) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to publish message', details: error.message });
    }
    res.json({ success: true, message: 'Message published successfully' });
  });
});

// Get MQTT broker statistics
app.get('/api/mqtt/stats', (req, res) => {
  res.json({
    connectedClients: Object.keys(aedes.clients).length,
    totalClients: aedes.stats.clients.total,
    totalMessages: aedes.stats.publish.total,
    uptime: process.uptime()
  });
});

// Start HTTP server
const httpServer = http.createServer(app);
httpServer.listen(port, () => {
  console.log(`🚀 API Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📡 API Base URL: http://localhost:${port}/api`);
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

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, aedes };