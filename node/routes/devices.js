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
    getDeviceById: async (req, res) => {
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
        const espId = req.params.id;
        
        // Check if device service is available
        if (!deviceService) {
          return res.status(503).json({ error: 'Device service not available. Please check database connection.' });
        }
        
        // Get device by ESP ID
        const device = await deviceService.getDevice(espId);
        
        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }
        
        // Ensure user can only access their own devices
        if (device.username !== userEmail) {
          return res.status(403).json({ error: 'Access denied: You can only view your own devices' });
        }
        
        res.json(device);
      } catch (error) {
        console.error('Error retrieving device:', error.message);
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Failed to retrieve device' });
      }
    },

    // Update device
    updateDevice: async (req, res) => {
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
        const espId = req.params.id;
        const { name } = req.body;
        
        // Validate input
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({ error: 'Device name is required and must be a non-empty string' });
        }
        
        // Check if device service is available
        if (!deviceService) {
          return res.status(503).json({ error: 'Device service not available. Please check database connection.' });
        }
        
        // First, verify the device exists and belongs to the user
        const existingDevice = await deviceService.getDevice(espId);
        
        if (!existingDevice) {
          return res.status(404).json({ error: 'Device not found' });
        }
        
        // Ensure user can only update their own devices
        if (existingDevice.username !== userEmail) {
          return res.status(403).json({ error: 'Access denied: You can only update your own devices' });
        }
        
        // Update device name
        const result = await deviceService.updateDeviceName(espId, name.trim());
        
        res.json(result);
      } catch (error) {
        console.error('Error updating device:', error.message);
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Failed to update device' });
      }
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
        const { days = 30, month } = req.query;
        
        if (!espId) {
          return res.status(400).json({ error: 'ESP ID is required' });
        }
        
        // If month is provided, validate it (YYYY-MM format)
        if (month) {
          const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
          if (!monthRegex.test(month)) {
            return res.status(400).json({ error: 'Month parameter must be in YYYY-MM format' });
          }
        } else {
          // Validate days parameter only if month is not provided
          const daysInt = parseInt(days);
          if (isNaN(daysInt) || daysInt < 1 || daysInt > 365) {
            return res.status(400).json({ error: 'Days parameter must be between 1 and 365' });
          }
        }
        
        // Check if sensor service is available
        if (!sensorService) {
          return res.status(503).json({ error: 'Sensor service not available. Please check database connection.' });
        }
        
        const daysInt = parseInt(days);
        const data = await sensorService.getDailyEnergyData(espId, daysInt, month);
        res.json(data);
      } catch (error) {
        console.error('Error retrieving daily energy data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve daily energy data' });
      }
    },

    // Get today's energy data
    getTodayEnergyData: async (req, res) => {
      try {
        const { espId } = req.params;
        
        if (!espId) {
          return res.status(400).json({ error: 'ESP ID is required' });
        }
        
        // Check if sensor service is available
        if (!sensorService) {
          return res.status(503).json({ error: 'Sensor service not available. Please check database connection.' });
        }
        
        const data = await sensorService.getTodayEnergyData(espId);
        res.json(data);
      } catch (error) {
        console.error('Error retrieving today energy data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve today energy data' });
      }
    },

    // Get today's power data for line chart
    getTodayPowerData: async (req, res) => {
      try {
        const { espId } = req.params;
        
        if (!espId) {
          return res.status(400).json({ error: 'ESP ID is required' });
        }
        
        // Check if sensor service is available
        if (!sensorService) {
          return res.status(503).json({ error: 'Sensor service not available. Please check database connection.' });
        }
        
        const data = await sensorService.getTodayPowerData(espId);
        res.json(data);
      } catch (error) {
        console.error('Error retrieving today power data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve today power data' });
      }
    },

    // Get monthly energy data
    getMonthlyEnergyData: async (req, res) => {
      try {
        const { espId } = req.params;
        const { year } = req.query;
        
        if (!espId) {
          return res.status(400).json({ error: 'ESP ID is required' });
        }
        
        // Validate year parameter if provided
        let yearInt = null;
        if (year) {
          yearInt = parseInt(year);
          if (isNaN(yearInt) || yearInt < 2020 || yearInt > 2030) {
            return res.status(400).json({ error: 'Year parameter must be between 2020 and 2030' });
          }
        }
        
        // Check if sensor service is available
        if (!sensorService) {
          return res.status(503).json({ error: 'Sensor service not available. Please check database connection.' });
        }
        
        const data = await sensorService.getMonthlyEnergyData(espId, yearInt);
        res.json(data);
      } catch (error) {
        console.error('Error retrieving monthly energy data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve monthly energy data' });
      }
    },

    // Control device (turn on/off)
    controlDevice: async (req, res) => {
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
        const espId = req.params.espid;
        const { command } = req.body;
        
        // Validate command
        if (!command || !['ON', 'OFF'].includes(command.toUpperCase())) {
          return res.status(400).json({ error: 'Invalid command. Must be ON or OFF' });
        }
        
        // Check if device service is available
        if (!deviceService) {
          return res.status(503).json({ error: 'Device service not available. Please check database connection.' });
        }
        
        // Get device by ESP ID to verify ownership
        const device = await deviceService.getDevice(espId);
        
        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }
        
        // Ensure user can only control their own devices
        if (device.username !== userEmail) {
          return res.status(403).json({ error: 'Access denied: You can only control your own devices' });
        }
        
        // Publish MQTT command to device
        const aedes = require('../server').aedes;
        const controlTopic = `${espId}/control`;
        const commandMessage = {
          command: command.toUpperCase(),
          timestamp: new Date().toISOString(),
          user: userEmail
        };
        
        // Publish the control command via MQTT
        aedes.publish({
          topic: controlTopic,
          payload: JSON.stringify(commandMessage),
          qos: 1,
          retain: false
        }, (error) => {
          if (error) {
            console.error('Error publishing MQTT control command:', error);
          } else {
            console.log(`✅ Control command sent to ${espId}: ${command}`);
          }
        });
        
        res.json({ 
          success: true, 
          message: `Command ${command} sent to device ${espId}`,
          device: device.name,
          command: command.toUpperCase()
        });
        
      } catch (error) {
        console.error('Error controlling device:', error.message);
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Failed to control device' });
      }
    }
  };
};

module.exports = createDeviceRoutes;