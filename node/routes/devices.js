// Device and sensor data API routes

// Create route handlers that accept data arrays
const createDeviceRoutes = (devices, sensorData) => {
  return {
    // Get all devices
    getAllDevices: (req, res) => {
      res.json(devices);
    },

    // Get device by ID
    getDeviceById: (req, res) => {
      const device = devices.find(d => d.id === req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json(device);
    },

    // Update device
    updateDevice: (req, res) => {
      const deviceIndex = devices.findIndex(d => d.id === req.params.id);
      if (deviceIndex === -1) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      devices[deviceIndex] = { ...devices[deviceIndex], ...req.body, updatedAt: new Date().toISOString() };
      res.json(devices[deviceIndex]);
    },

    // Get all sensor data
    getSensorData: (req, res) => {
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
    }
  };
};

module.exports = createDeviceRoutes;