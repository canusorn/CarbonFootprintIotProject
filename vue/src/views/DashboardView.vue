<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Carbon Footprint Dashboard</h1>
    </div>
    
    <TabView>
      <TabPanel header="Overview">
        <div class="overview-content">
          <!-- Connection Status -->
          <div class="connection-status">
            <div class="status-card">
              <i :class="connectionStatusIcon" :style="{ color: connectionStatusColor }"></i>
              <span>{{ connectionStatus }}</span>
            </div>
          </div>

          <!-- Real-time Data Cards -->
          <div class="data-cards-grid">
            <!-- Voltage Card -->
            <DataCard
              title="Voltage (V)"
              :phase-a="sensorData.Va"
              :phase-b="sensorData.Vb"
              :phase-c="sensorData.Vc"
              unit="V"
              card-class="voltage-card"
              :precision="1"
            />

            <!-- Current Card -->
            <DataCard
              title="Current (A)"
              :phase-a="sensorData.Ia"
              :phase-b="sensorData.Ib"
              :phase-c="sensorData.Ic"
              unit="A"
              card-class="current-card"
              :precision="2"
            />

            <!-- Power Card -->
            <DataCard
              title="Power (W)"
              :phase-a="sensorData.Pa"
              :phase-b="sensorData.Pb"
              :phase-c="sensorData.Pc"
              unit="W"
              card-class="power-card"
              :precision="1"
              :show-total="true"
            />

            <!-- Power Factor Card -->
            <DataCard
              title="Power Factor"
              :phase-a="sensorData.PFa"
              :phase-b="sensorData.PFb"
              :phase-c="sensorData.PFc"
              unit=""
              card-class="pf-card"
              :precision="2"
            />
          </div>

          <!-- Energy and CO2 Section -->
          <div class="energy-co2-section">
            <EnergyCard
              :energy-import="sensorData.Eim"
              :energy-export="sensorData.Eex"
              :total-energy="sensorData.Ett"
            />

            <CO2Card
              :total-co2="totalCO2"
              :daily-co2="dailyCO2"
              :emission-factor="emissionFactor"
            />
          </div>

          <!-- Daily Energy Chart -->
          <DailyEnergyChart
            :daily-energy-data="dailyEnergyData"
            :emission-factor="emissionFactor"
          />
        </div>
      </TabPanel>
      
      <TabPanel header="History">
        <div class="history-content">
          <p>History tab will be implemented later.</p>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import mqtt from 'mqtt'
import axios from 'axios'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import DataCard from '@/components/DataCard.vue'
import EnergyCard from '@/components/EnergyCard.vue'
import CO2Card from '@/components/CO2Card.vue'
import DailyEnergyChart from '@/components/DailyEnergyChart.vue'

export default {
  name: 'DashboardView',
  components: {
    TabView,
    TabPanel,
    Card,
    DataTable,
    Column,
    DataCard,
    EnergyCard,
    CO2Card,
    DailyEnergyChart
  },
  setup() {
    const route = useRoute()
    const sensorData = ref({
      Va: 0, Vb: 0, Vc: 0,
      Ia: 0, Ib: 0, Ic: 0,
      Pa: 0, Pb: 0, Pc: 0,
      PFa: 0, PFb: 0, PFc: 0,
      Eim: 0, Eex: 0, Ett: 0
    })
    
    const historicalData = ref([])
    const dailyEnergyData = ref([])
    const mqttClient = ref(null)
    const isConnected = ref(false)
    const emissionFactor = ref(0.5) // kg CO2 per kWh (example factor)
    const espId = ref(route.params.espid || 'ESP001') // Get from route parameter or default
    
    // Computed properties
    const totalPower = computed(() => {
      return (sensorData.value.Pa || 0) + (sensorData.value.Pb || 0) + (sensorData.value.Pc || 0)
    })
    
    const totalCO2 = computed(() => {
      return (sensorData.value.Ett || 0) * emissionFactor.value
    })
    
    const dailyCO2 = computed(() => {
      // Simplified daily calculation - in real app, this would be based on daily energy consumption
      return totalCO2.value * 0.1 // Example: 10% of total for daily
    })
    
    const connectionStatus = computed(() => {
      return isConnected.value ? 'Connected' : 'Disconnected'
    })
    
    const connectionStatusIcon = computed(() => {
      return isConnected.value ? 'pi pi-check-circle' : 'pi pi-times-circle'
    })
    
    const connectionStatusColor = computed(() => {
      return isConnected.value ? '#4CAF50' : '#F44336'
    })
    

    
    // MQTT Connection
    const connectMQTT = () => {
      const timestamp = Date.now()
      const clientId = `WEB${timestamp}_${espId.value}`
      
      try {
        mqttClient.value = mqtt.connect('ws://localhost:8083', {
          clientId: clientId,
          clean: true,
          connectTimeout: 4000,
          reconnectPeriod: 1000,
          username: 'web',
          password: 'pi'
        })
        
        mqttClient.value.on('connect', () => {
          console.log('MQTT Connected')
          isConnected.value = true
          
          // Subscribe to ESP device topics
          mqttClient.value.subscribe(`${espId.value}/#`, (err) => {
            if (err) {
              console.error('Subscribe error:', err)
            } else {
              console.log(`Subscribed to ${espId.value}/#`)
            }
          })
        })
        
        mqttClient.value.on('message', (topic, message) => {
          try {
            if (topic === `${espId.value}/update`) {
              const data = JSON.parse(message.toString())
              sensorData.value = { ...sensorData.value, ...data }
              console.log('Received sensor data:', data)
            }
          } catch (error) {
            console.error('Error parsing MQTT message:', error)
          }
        })
        
        mqttClient.value.on('error', (error) => {
          console.error('MQTT Error:', error)
          isConnected.value = false
        })
        
        mqttClient.value.on('close', () => {
          console.log('MQTT Disconnected')
          isConnected.value = false
        })
        
      } catch (error) {
        console.error('MQTT Connection Error:', error)
        isConnected.value = false
      }
    }
    
    // Disconnect MQTT
    const disconnectMQTT = () => {
      if (mqttClient.value) {
        mqttClient.value.end()
        mqttClient.value = null
        isConnected.value = false
        console.log('MQTT Disconnected')
      }
    }
    
    // Daily energy calculation is now handled by the backend via SQL queries
    // This improves performance for large datasets by offloading computation to the database
    
    // Fetch historical data from backend
    const fetchHistoricalData = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch latest sensor data for dashboard display
        const sensorResponse = await axios.get(`http://localhost:3000/api/sensor-data/${espId.value}?limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        // Validate sensor response data
        if (!sensorResponse.data || !Array.isArray(sensorResponse.data)) {
          console.warn('Invalid sensor response data format:', sensorResponse.data)
          historicalData.value = []
        } else {
          historicalData.value = sensorResponse.data
          console.log('Fetched historical data:', sensorResponse.data.length, 'records')
          
          // Set initial dashboard values from latest historical data
          if (sensorResponse.data && sensorResponse.data.length > 0) {
            try {
              const latestData = sensorResponse.data[sensorResponse.data.length - 1]
              sensorData.value = {
                Va: parseFloat(latestData.Va || 0),
                Vb: parseFloat(latestData.Vb || 0),
                Vc: parseFloat(latestData.Vc || 0),
                Ia: parseFloat(latestData.Ia || 0),
                Ib: parseFloat(latestData.Ib || 0),
                Ic: parseFloat(latestData.Ic || 0),
                Pa: parseFloat(latestData.Pa || 0),
                Pb: parseFloat(latestData.Pb || 0),
                Pc: parseFloat(latestData.Pc || 0),
                PFa: parseFloat(latestData.PFa || 0),
                PFb: parseFloat(latestData.PFb || 0),
                PFc: parseFloat(latestData.PFc || 0),
                Eim: parseFloat(latestData.Eim || 0),
                Eex: parseFloat(latestData.Eex || 0),
                Ett: parseFloat(latestData.Ett || 0)
              }
              console.log('Initial dashboard values set from historical data')
            } catch (dataError) {
              console.error('Error setting initial dashboard values:', dataError)
            }
          }
        }
        
        // Fetch daily energy data from backend (calculated via SQL)
        const dailyResponse = await axios.get(`http://localhost:3000/api/daily-energy/${espId.value}?days=30`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        // Validate daily energy response data
        if (!dailyResponse.data || !Array.isArray(dailyResponse.data)) {
          console.warn('Invalid daily energy response data format:', dailyResponse.data)
          dailyEnergyData.value = []
        } else {
          // Transform backend data to include CO2 calculations
          dailyEnergyData.value = dailyResponse.data.map(item => ({
            date: item.date,
            energy: parseFloat(item.energy || 0),
            co2: parseFloat(item.energy || 0) * emissionFactor.value,
            recordCount: parseInt(item.recordCount || 0)
          }))
          console.log('Fetched daily energy data from backend:', dailyEnergyData.value.length, 'days')
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
        // Set empty arrays to prevent further errors
        historicalData.value = []
        dailyEnergyData.value = []
      }
    }
    
    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }
    
    // Lifecycle hooks
    onMounted(() => {
      connectMQTT()
      fetchHistoricalData()
    })
    
    onUnmounted(() => {
      disconnectMQTT()
    })
    
    return {
      sensorData,
      historicalData,
      dailyEnergyData,
      isConnected,
      emissionFactor,
      totalPower,
      totalCO2,
      dailyCO2,
      connectionStatus,
      connectionStatusIcon,
      connectionStatusColor,
      formatTimestamp
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 20px;
}

.dashboard-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 600;
}

.connection-status {
  margin-bottom: 20px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.status-card i {
  font-size: 1.2rem;
}

.data-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.data-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.voltage-card {
  border-left: 4px solid #4CAF50;
}

.current-card {
  border-left: 4px solid #2196F3;
}

.power-card {
  border-left: 4px solid #FF9800;
}

.pf-card {
  border-left: 4px solid #9C27B0;
}

.phase-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.phase-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.phase-item:last-child {
  border-bottom: none;
}

.phase-label {
  font-weight: 500;
  color: #666;
}

.phase-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.total-power {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid #FF9800;
  text-align: center;
}

.energy-co2-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.energy-card {
  border-left: 4px solid #00BCD4;
}

.co2-card {
  border-left: 4px solid #F44336;
}

.energy-data, .co2-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.energy-item, .co2-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.energy-item:last-child, .co2-item:last-child {
  border-bottom: none;
}

.energy-label, .co2-label {
  font-weight: 500;
  color: #666;
}

.energy-value, .co2-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.co2-highlight {
  color: #F44336;
  font-size: 1.3rem;
  font-weight: 700;
}

.chart-card {
  margin-bottom: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #673AB7;
}

.chart-container {
  height: 400px;
  position: relative;
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
  font-size: 1.1rem;
}

.historical-data-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.overview-content {
  animation: fadeIn 0.5s ease-in;
}

.history-content {
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1.2rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .data-cards-grid {
    grid-template-columns: 1fr;
  }
  
  .energy-co2-section {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
  }
}
</style>