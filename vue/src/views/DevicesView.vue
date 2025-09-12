<template>
  <div class="devices-view">
    <div class="devices-header">
      <h1>My Devices</h1>
      <div class="user-info">
        <span>Welcome, {{ user.email }}</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <p>Loading devices...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else class="devices-container">
      <div v-if="devices.length === 0" class="no-devices">
        <p>No devices found for your account.</p>
        <p>Connect your IoT devices to see them here.</p>
      </div>
      
      <div v-else class="devices-grid">
        <div 
          v-for="device in devices" 
          :key="device.id" 
          class="device-card"
        >
          <div class="device-header">
            <h3>{{ device.name }}</h3>
            <span class="device-id">{{ device.espid }}</span>
          </div>
          
          <div class="device-info">
            <div class="info-item">
              <label>ESP ID:</label>
              <span>{{ device.espid }}</span>
            </div>
            <div class="info-item">
              <label>Device Name:</label>
              <span>{{ device.name }}</span>
            </div>
            <div class="info-item">
              <label>Owner:</label>
              <span>{{ device.username }}</span>
            </div>
            <div class="info-item">
              <label>Created:</label>
              <span>{{ formatDate(device.created_at) }}</span>
            </div>
          </div>
          
          <div class="device-actions">
            <button @click="viewSensorData(device.espid)" class="action-btn primary">
              View Sensor Data
            </button>
            <button @click="editDevice(device)" class="action-btn secondary">
              Edit Device
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'DevicesView',
  setup() {
    const router = useRouter()
    const devices = ref([])
    const loading = ref(true)
    const error = ref('')
    
    const user = computed(() => {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : { email: '' }
    })
    
    const isAuthenticated = computed(() => {
      return localStorage.getItem('token') !== null
    })
    
    const fetchDevices = async () => {
      try {
        loading.value = true
        error.value = ''
        
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/')
          return
        }
        
        const response = await axios.get('http://localhost:3000/api/devices', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            username: user.value.email
          }
        })
        
        devices.value = response.data
      } catch (err) {
        console.error('Error fetching devices:', err)
        if (err.response && err.response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/')
        } else {
          error.value = err.response?.data?.error || 'Failed to load devices'
        }
      } finally {
        loading.value = false
      }
    }
    
    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/')
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-GB')
    }
    
    const viewSensorData = (espId) => {
      // TODO: Navigate to sensor data view
      console.log('View sensor data for:', espId)
      alert(`Sensor data view for ${espId} - Feature coming soon!`)
    }
    
    const editDevice = (device) => {
      // TODO: Open edit device modal or navigate to edit page
      console.log('Edit device:', device)
      alert(`Edit device ${device.name} - Feature coming soon!`)
    }
    
    // Check authentication on mount
    onMounted(() => {
      if (!isAuthenticated.value) {
        router.push('/')
        return
      }
      fetchDevices()
    })
    
    return {
      devices,
      loading,
      error,
      user,
      logout,
      formatDate,
      viewSensorData,
      editDevice,
      fetchDevices
    }
  }
}
</script>

<style scoped>
.devices-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.devices-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.devices-header h1 {
  color: #333;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #666;
  font-weight: 500;
}

.logout-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #d32f2f;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-message {
  color: #f44336;
  background-color: #ffebee;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.no-devices {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-devices p {
  margin: 10px 0;
  font-size: 16px;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.device-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.device-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.device-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.device-id {
  background-color: #4CAF50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.device-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 5px 0;
}

.info-item label {
  font-weight: 600;
  color: #555;
  flex: 0 0 120px;
}

.info-item span {
  color: #333;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.device-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.action-btn.primary {
  background-color: #4CAF50;
  color: white;
}

.action-btn.primary:hover {
  background-color: #45a049;
}

.action-btn.secondary {
  background-color: #2196F3;
  color: white;
}

.action-btn.secondary:hover {
  background-color: #1976D2;
}

@media (max-width: 768px) {
  .devices-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .user-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .devices-grid {
    grid-template-columns: 1fr;
  }
  
  .device-actions {
    flex-direction: column;
  }
}
</style>