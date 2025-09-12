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
            <!-- Voltage Cards -->
            <Card class="data-card voltage-card">
              <template #title>Voltage (V)</template>
              <template #content>
                <div class="phase-data">
                  <div class="phase-item">
                    <span class="phase-label">Phase A:</span>
                    <span class="phase-value">{{ sensorData.Va?.toFixed(1) || '0.0' }}V</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase B:</span>
                    <span class="phase-value">{{ sensorData.Vb?.toFixed(1) || '0.0' }}V</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase C:</span>
                    <span class="phase-value">{{ sensorData.Vc?.toFixed(1) || '0.0' }}V</span>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Current Cards -->
            <Card class="data-card current-card">
              <template #title>Current (A)</template>
              <template #content>
                <div class="phase-data">
                  <div class="phase-item">
                    <span class="phase-label">Phase A:</span>
                    <span class="phase-value">{{ sensorData.Ia?.toFixed(2) || '0.00' }}A</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase B:</span>
                    <span class="phase-value">{{ sensorData.Ib?.toFixed(2) || '0.00' }}A</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase C:</span>
                    <span class="phase-value">{{ sensorData.Ic?.toFixed(2) || '0.00' }}A</span>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Power Cards -->
            <Card class="data-card power-card">
              <template #title>Power (W)</template>
              <template #content>
                <div class="phase-data">
                  <div class="phase-item">
                    <span class="phase-label">Phase A:</span>
                    <span class="phase-value">{{ sensorData.Pa?.toFixed(1) || '0.0' }}W</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase B:</span>
                    <span class="phase-value">{{ sensorData.Pb?.toFixed(1) || '0.0' }}W</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase C:</span>
                    <span class="phase-value">{{ sensorData.Pc?.toFixed(1) || '0.0' }}W</span>
                  </div>
                  <div class="total-power">
                    <strong>Total: {{ totalPower.toFixed(1) }}W</strong>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Power Factor Cards -->
            <Card class="data-card pf-card">
              <template #title>Power Factor</template>
              <template #content>
                <div class="phase-data">
                  <div class="phase-item">
                    <span class="phase-label">Phase A:</span>
                    <span class="phase-value">{{ sensorData.PFa?.toFixed(2) || '0.00' }}</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase B:</span>
                    <span class="phase-value">{{ sensorData.PFb?.toFixed(2) || '0.00' }}</span>
                  </div>
                  <div class="phase-item">
                    <span class="phase-label">Phase C:</span>
                    <span class="phase-value">{{ sensorData.PFc?.toFixed(2) || '0.00' }}</span>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <!-- Energy and CO2 Section -->
          <div class="energy-co2-section">
            <Card class="energy-card">
              <template #title>Energy Consumption</template>
              <template #content>
                <div class="energy-data">
                  <div class="energy-item">
                    <span class="energy-label">Import Energy:</span>
                    <span class="energy-value">{{ sensorData.Eim?.toFixed(2) || '0.00' }} kWh</span>
                  </div>
                  <div class="energy-item">
                    <span class="energy-label">Export Energy:</span>
                    <span class="energy-value">{{ sensorData.Eex?.toFixed(2) || '0.00' }} kWh</span>
                  </div>
                  <div class="energy-item">
                    <span class="energy-label">Total Energy:</span>
                    <span class="energy-value">{{ sensorData.Ett?.toFixed(2) || '0.00' }} kWh</span>
                  </div>
                </div>
              </template>
            </Card>

            <Card class="co2-card">
              <template #title>CO2 Emissions</template>
              <template #content>
                <div class="co2-data">
                  <div class="co2-item">
                    <span class="co2-label">Emission Factor:</span>
                    <span class="co2-value">{{ emissionFactor }} kg CO2/kWh</span>
                  </div>
                  <div class="co2-item">
                    <span class="co2-label">Total CO2:</span>
                    <span class="co2-value co2-highlight">{{ totalCO2.toFixed(3) }} kg CO2</span>
                  </div>
                  <div class="co2-item">
                    <span class="co2-label">Daily CO2:</span>
                    <span class="co2-value">{{ dailyCO2.toFixed(3) }} kg CO2</span>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <!-- Daily Energy Chart -->
          <Card class="chart-card">
            <template #title>Daily Energy Consumption & CO2 Emissions</template>
            <template #content>
              <div class="chart-container">
                <Bar v-if="dailyEnergyData.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="no-data-message">
                  <p>No historical data available for chart display.</p>
                </div>
              </div>
            </template>
          </Card>

          <!-- Historical Data Table -->
          <Card class="historical-data-card">
            <template #title>Recent Historical Data</template>
            <template #content>
              <DataTable :value="historicalData" :paginator="true" :rows="10" class="p-datatable-sm">
                <Column field="timestamp" header="Timestamp" :sortable="true">
                  <template #body="slotProps">
                    {{ formatTimestamp(slotProps.data.timestamp) }}
                  </template>
                </Column>
                <Column field="Va" header="Va (V)" :sortable="true">
                  <template #body="slotProps">
                    {{ parseFloat(slotProps.data.Va || 0).toFixed(1) }}
                  </template>
                </Column>
                <Column field="Ia" header="Ia (A)" :sortable="true">
                  <template #body="slotProps">
                    {{ parseFloat(slotProps.data.Ia || 0).toFixed(2) }}
                  </template>
                </Column>
                <Column field="Pa" header="Pa (W)" :sortable="true">
                  <template #body="slotProps">
                    {{ parseFloat(slotProps.data.Pa || 0).toFixed(1) }}
                  </template>
                </Column>
                <Column field="Ett" header="Total Energy (kWh)" :sortable="true">
                  <template #body="slotProps">
                    {{ parseFloat(slotProps.data.Ett || 0).toFixed(2) }}
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>
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
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default {
  name: 'DashboardView',
  components: {
    TabView,
    TabPanel,
    Card,
    DataTable,
    Column,
    Bar
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
    
    // Chart data computation
    const chartData = computed(() => {
      if (!dailyEnergyData.value.length) {
        return {
          labels: [],
          datasets: []
        }
      }
      
      return {
        labels: dailyEnergyData.value.map(item => item.date),
        datasets: [
          {
            label: 'Daily Energy Consumption (kWh)',
            backgroundColor: '#42A5F5',
            borderColor: '#1E88E5',
            borderWidth: 1,
            data: dailyEnergyData.value.map(item => item.energy)
          },
          {
            label: 'Daily CO2 Emissions (kg)',
            backgroundColor: '#FF7043',
            borderColor: '#F4511E',
            borderWidth: 1,
            data: dailyEnergyData.value.map(item => item.co2)
          }
        ]
      }
    })
    
    const chartOptions = computed(() => {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Daily Energy Consumption & CO2 Emissions (Last 30 Days)'
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || ''
                const value = context.parsed.y
                const unit = label.includes('Energy') ? 'kWh' : 'kg CO2'
                return `${label}: ${value.toFixed(2)} ${unit}`
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Energy (kWh) / CO2 (kg)'
            },
            ticks: {
              callback: function(value) {
                return value.toFixed(1)
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            },
            ticks: {
              maxTicksLimit: 10,
              callback: function(value, index) {
                const date = new Date(this.getLabelForValue(value))
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
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
      chartData,
      chartOptions,
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