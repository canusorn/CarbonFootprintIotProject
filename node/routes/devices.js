// Device and sensor data API routes
const SensorService = require('../services/sensorService');
const DeviceService = require('../services/deviceService');
const { auth } = require('../middleware/auth');

// Create route handlers
const createDeviceRoutes = (deviceService, sensorService) => {
  return {
    // Get all devices for authenticated user
    getAllDevices: async (req, res) => {
      try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ error: 'No token, authorization denied' });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const userEmail = decoded.email;
        const requestedUsername = req.query.username;
        
        // Ensure user can only access their own devices
        if (requestedUsername && requestedUsername !== userEmail) {
          return res.status(403).json({ error: 'Access denied: You can only view your own devices' });
        }
        
        // Check if device service is available
        if (!deviceService) {
          return res.status(503).json({ error: 'Device service not available. Please check database connection.' });
        }
        
        // Get devices filtered by username (email)
        const devices = await deviceService.getDevicesByUsername(userEmail);
        
        res.json(devices);
      } catch (error) {
        console.error('Error retrieving devices:', error.message);
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Failed to retrieve devices' });
      }
    },

    // Get device by ID
    getDeviceById: (req, res) => {
      res.status(501).json({ error: 'Device management not implemented - data stored in database' });
    },

    // Update device
    updateDevice: (req, res) => {
      res.status(501).json({ error: 'Device management not implemented - data stored in database' });
    },

    // Get all sensor data
    getSensorData: async (req, res) => {
      try {
        const { limit = 50, espId } = req.query;
        
        if (!espId) {
          return res.status(400).json({ error: 'ESP ID is required' });
        }
        
        // Check if sensor service is available
        if (!sensorService) {
          return res.status(503).json({ error: 'Sensor service not available. Please check database connection.' });
        }
        
        const data = await sensorService.getLatestData(espId, parseInt(limit));
        res.json(data);
      } catch (error) {
        console.error('Error retrieving sensor data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve sensor data' });
      }
    },

    // Get daily energy data
    getDailyEnergyData: async (req, res) => {
      try {
        const { espId } = req.params;
        const { days = 30 } = req.query;
        
        if (!espId) {
          return res.status(400).json({ error: 'ESP ID is required' });
        }
        
        // Validate days parameter
        const daysInt = parseInt(days);
        if (isNaN(daysInt) || daysInt < 1 || daysInt > 365) {
          return res.status(400).json({ error: 'Days parameter must be between 1 and 365' });
        }
        
        // Check if sensor service is available
        if (!sensorService) {
          return res.status(503).json({ error: 'Sensor service not available. Please check database connection.' });
        }
        
        const data = await sensorService.getDailyEnergyData(espId, daysInt);
        res.json(data);
      } catch (error) {
        console.error('Error retrieving daily energy data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve daily energy data' });
      }
    }
  };
};

module.exports = createDeviceRoutes;