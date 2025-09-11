// Device and sensor data API routes
const SensorService = require('../services/sensorService');

// Create route handlers
const createDeviceRoutes = () => {
  return {
    // Get all devices
    getAllDevices: (req, res) => {
      res.status(501).json({ error: 'Device management not implemented - data stored in database' });
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
        
        const sensorService = new SensorService();
        await sensorService.initialize();
        
        const data = await sensorService.getLatestData(espId, parseInt(limit));
        res.json(data);
        
        await sensorService.close();
      } catch (error) {
        console.error('Error retrieving sensor data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve sensor data' });
      }
    }
  };
};

module.exports = createDeviceRoutes;