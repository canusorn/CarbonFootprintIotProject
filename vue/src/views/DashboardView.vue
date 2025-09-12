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

          <!-- Today Energy Card -->
          <div class="today-energy-card">
            <div class="energy-card-header">
              <i class="pi pi-bolt" style="color: #f39c12;"></i>
              <h3>Today's Energy</h3>
            </div>
            <div class="energy-card-content">
              <div class="energy-values-row">
                <div class="energy-value">
                  <span class="value">{{ todayEnergyData.todayEnergy.toFixed(2) }}</span>
                  <span class="unit">kWh</span>
                </div>
                <div class="energy-value co2-emission">
                  <span class="value">{{ formatCO2(dailyCO2, 2) }}</span>
                  <span class="unit">kgCO2e</span>
                </div>
              </div>
              <div class="energy-details">
                <div class="detail-item">
                  <span class="label">Start:</span>
                  <span class="value">{{ todayEnergyData.startEnergy.toFixed(2) }} kWh</span>
                </div>
                <div class="detail-item">
                  <span class="label">Current:</span>
                  <span class="value">{{ todayEnergyData.endEnergy.toFixed(2) }} kWh</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Real-time Power Display -->
          <div class="realtime-power-section">
            <div class="power-section-header">
              <i class="pi pi-flash" style="color: #e74c3c;"></i>
              <h3>Real-time Power (3-Phase)</h3>
            </div>
            <div class="power-phases-grid">
              <div class="phase-card phase-a">
                <div class="phase-header">
                  <span class="phase-label">Phase A</span>
                  <i class="pi pi-circle-fill phase-indicator"></i>
                </div>
                <div class="phase-value">
                  <span class="value">{{ sensorData.Pa.toFixed(2) }}</span>
                  <span class="unit">W</span>
                </div>
                <div class="phase-details">
                  <div class="detail">
                    <span class="label">Voltage:</span>
                    <span class="value">{{ sensorData.Va.toFixed(1) }}V</span>
                  </div>
                  <div class="detail">
                    <span class="label">Current:</span>
                    <span class="value">{{ sensorData.Ia.toFixed(2) }}A</span>
                  </div>
                  <div class="detail">
                    <span class="label">PF:</span>
                    <span class="value">{{ sensorData.PFa.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="phase-card phase-b">
                <div class="phase-header">
                  <span class="phase-label">Phase B</span>
                  <i class="pi pi-circle-fill phase-indicator"></i>
                </div>
                <div class="phase-value">
                  <span class="value">{{ sensorData.Pb.toFixed(2) }}</span>
                  <span class="unit">W</span>
                </div>
                <div class="phase-details">
                  <div class="detail">
                    <span class="label">Voltage:</span>
                    <span class="value">{{ sensorData.Vb.toFixed(1) }}V</span>
                  </div>
                  <div class="detail">
                    <span class="label">Current:</span>
                    <span class="value">{{ sensorData.Ib.toFixed(2) }}A</span>
                  </div>
                  <div class="detail">
                    <span class="label">PF:</span>
                    <span class="value">{{ sensorData.PFb.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="phase-card phase-c">
                <div class="phase-header">
                  <span class="phase-label">Phase C</span>
                  <i class="pi pi-circle-fill phase-indicator"></i>
                </div>
                <div class="phase-value">
                  <span class="value">{{ sensorData.Pc.toFixed(2) }}</span>
                  <span class="unit">W</span>
                </div>
                <div class="phase-details">
                  <div class="detail">
                    <span class="label">Voltage:</span>
                    <span class="value">{{ sensorData.Vc.toFixed(1) }}V</span>
                  </div>
                  <div class="detail">
                    <span class="label">Current:</span>
                    <span class="value">{{ sensorData.Ic.toFixed(2) }}A</span>
                  </div>
                  <div class="detail">
                    <span class="label">PF:</span>
                    <span class="value">{{ sensorData.PFc.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="phase-card total-power">
                <div class="phase-header">
                  <span class="phase-label">Total Power</span>
                  <i class="pi pi-bolt phase-indicator"></i>
                </div>
                <div class="phase-value total">
                  <span class="value">{{ totalPower.toFixed(2) }}</span>
                  <span class="unit">W</span>
                </div>
                <div class="phase-details">
                  <div class="detail">
                    <span class="label">Energy Total:</span>
                    <span class="value">{{ sensorData.Ett.toFixed(2) }} kWh</span>
                  </div>
                  <div class="detail">
                    <span class="label">CO2 Impact:</span>
                    <span class="value">{{ formatCO2(totalCO2, 2) }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">Daily CO2:</span>
                    <span class="value">{{ formatCO2(dailyCO2, 2) }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">≈ Trees Needed:</span>
                    <span class="value">{{ co2Equivalents.trees }} trees/year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's Power Line Chart -->
          <div class="power-chart-section">
            <div class="chart-header">
              <i class="pi pi-chart-line" style="color: #3498db;"></i>
              <h3>Today's Power Consumption</h3>
            </div>
            <div class="power-chart-container">
              <canvas ref="powerChartCanvas" id="powerChart"></canvas>
            </div>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import mqtt from 'mqtt'
import axios from 'axios'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import DataCard from '@/components/DataCard.vue'
import EnergyCard from '@/components/EnergyCard.vue'
import CO2Card from '@/components/CO2Card.vue'
import DailyEnergyChart from '@/components/DailyEnergyChart.vue'
import { 
  calculateCO2Emissions, 
  calculateThreePhaseCO2, 
  formatCO2, 
  getCO2Equivalents,
  EMISSION_FACTORS 
} from '@/services/co2Calculator.js'

// Register Chart.js components
Chart.register(...registerables)

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
    const todayEnergyData = ref({
      todayEnergy: 0,
      startEnergy: 0,
      endEnergy: 0,
      recordCount: 0,
      startTime: null,
      endTime: null
    })
    const todayPowerData = ref([])
    const powerChartCanvas = ref(null)
    const powerChart = ref(null)
    const mqttClient = ref(null)
    const isConnected = ref(false)
    const emissionFactor = ref(EMISSION_FACTORS.THAILAND) // kg CO2 per kWh (Thailand grid factor)
    const espId = ref(route.params.espid || 'ESP001') // Get from route parameter or default
    
    // Computed properties
    const totalPower = computed(() => {
      return (sensorData.value.Pa || 0) + (sensorData.value.Pb || 0) + (sensorData.value.Pc || 0)
    })
    
    const totalCO2 = computed(() => {
      return calculateCO2Emissions(sensorData.value.Ett || 0, emissionFactor.value)
    })
    
    const dailyCO2 = computed(() => {
      // Calculate daily CO2 from today's energy consumption
      return calculateCO2Emissions(todayEnergyData.value.todayEnergy || 0, emissionFactor.value)
    })
    
    // Real-time three-phase CO2 calculations
    const phaseCO2Data = computed(() => {
      return calculateThreePhaseCO2(
        {
          Pa: sensorData.value.Pa || 0,
          Pb: sensorData.value.Pb || 0,
          Pc: sensorData.value.Pc || 0
        },
        1, // 1 hour for rate calculation
        emissionFactor.value
      )
    })
    
    // CO2 equivalents for better understanding
    const co2Equivalents = computed(() => {
      return getCO2Equivalents(totalCO2.value)
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
              
              // Update today's energy calculation when new MQTT data arrives
              if (data.Ett !== undefined && todayEnergyData.value.startEnergy > 0) {
                const currentEnergy = parseFloat(data.Ett)
                const calculatedTodayEnergy = currentEnergy - todayEnergyData.value.startEnergy
                
                // Update today's energy data
                todayEnergyData.value = {
                  ...todayEnergyData.value,
                  todayEnergy: Math.max(0, calculatedTodayEnergy), // Ensure non-negative
                  endEnergy: currentEnergy
                }
                
                // Update DailyEnergyChart with today's real-time data
                const todayDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
                const todayEnergy = Math.max(0, calculatedTodayEnergy)
                const todayCO2 = todayEnergy * emissionFactor.value
                
                // Find today's entry in dailyEnergyData or create new one
                const todayIndex = dailyEnergyData.value.findIndex(item => item.date === todayDate)
                
                if (todayIndex >= 0) {
                  // Update existing today's entry
                  dailyEnergyData.value[todayIndex] = {
                    ...dailyEnergyData.value[todayIndex],
                    energy: todayEnergy,
                    co2: todayCO2
                  }
                } else {
                  // Add new entry for today
                  dailyEnergyData.value.push({
                    date: todayDate,
                    energy: todayEnergy,
                    co2: todayCO2,
                    recordCount: 1
                  })
                  
                  // Keep only last 30 days
                  if (dailyEnergyData.value.length > 30) {
                    dailyEnergyData.value = dailyEnergyData.value.slice(-30)
                  }
                }
              }
              
              // Add new data point to todayPowerData for synchronization
              const currentTime = new Date().toISOString()
              
              // Use direct push to avoid spread operator overhead
              todayPowerData.value.push({
                time: currentTime,
                Pa: parseFloat(data.Pa || 0),
                Pb: parseFloat(data.Pb || 0),
                Pc: parseFloat(data.Pc || 0),
                totalPower: parseFloat(data.Pa || 0) + parseFloat(data.Pb || 0) + parseFloat(data.Pc || 0)
              })
              
              // Limit data points to prevent memory issues (keep last 100 points)
              const maxDataPoints = 100
              if (todayPowerData.value.length > maxDataPoints) {
                todayPowerData.value.splice(0, todayPowerData.value.length - maxDataPoints)
              }
              
              // Update power chart with new real-time data
              updatePowerChartRealtime(data)
              
              console.log('Received sensor data:', data)
              console.log('Updated today energy:', todayEnergyData.value.todayEnergy)
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
        const sensorResponse = await axios.get(`http://localhost:3000/api/sensor-data/${espId.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        console.log('Fetched sensor data:', sensorResponse.data)
        
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
        console.log('Fetched daily energy data:', dailyResponse.data)
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
    
    // Fetch today's energy data from backend
    const fetchTodayEnergyData = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://localhost:3000/api/today-energy/${espId.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.data) {
          todayEnergyData.value = {
            todayEnergy: parseFloat(response.data.todayEnergy || 0),
            startEnergy: parseFloat(response.data.startEnergy || 0),
            endEnergy: parseFloat(response.data.endEnergy || 0),
            recordCount: parseInt(response.data.recordCount || 0),
            startTime: response.data.startTime,
            endTime: response.data.endTime
          }
          console.log('Fetched today\'s energy data:', todayEnergyData.value)
        }
      } catch (error) {
        console.error('Error fetching today\'s energy data:', error)
        // Keep default values on error
      }
    }
    
    // Fetch today's power data from backend
    const fetchTodayPowerData = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://localhost:3000/api/today-power/${espId.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.data && Array.isArray(response.data)) {
          todayPowerData.value = response.data.map(item => ({
            time: item.time,
            Pa: parseFloat(item.Pa || 0),
            Pb: parseFloat(item.Pb || 0),
            Pc: parseFloat(item.Pc || 0),
            totalPower: parseFloat(item.totalPower || 0)
          }))
          console.log('Fetched today\'s power data:', todayPowerData.value.length, 'records')
        }
      } catch (error) {
        console.error('Error fetching today\'s power data:', error)
        todayPowerData.value = []
      }
    }
    
    // Create power line chart
    const createPowerChart = async () => {
      await nextTick()
      
      if (!powerChartCanvas.value) {
        console.error('Power chart canvas not found')
        return
      }
      
      // Destroy existing chart if it exists
      if (powerChart.value) {
        powerChart.value.destroy()
      }
      
      const ctx = powerChartCanvas.value.getContext('2d')
      
      // Limit initial data to prevent memory issues
      const maxInitialPoints = 50
      const limitedData = todayPowerData.value.slice(-maxInitialPoints)
      
      // Prepare chart data from todayPowerData with time series format
      const phaseAData = limitedData.map(item => ({
        x: new Date(item.time),
        y: item.Pa
      }))
      const phaseBData = limitedData.map(item => ({
        x: new Date(item.time),
        y: item.Pb
      }))
      const phaseCData = limitedData.map(item => ({
        x: new Date(item.time),
        y: item.Pc
      }))
      const totalPowerData = limitedData.map(item => ({
        x: new Date(item.time),
        y: item.totalPower
      }))
      
      powerChart.value = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Phase A',
              data: phaseAData,
              borderColor: '#e74c3c',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              borderWidth: 2,
              fill: false,
              tension: 0
            },
            {
              label: 'Phase B',
              data: phaseBData,
              borderColor: '#f39c12',
              backgroundColor: 'rgba(243, 156, 18, 0.1)',
              borderWidth: 2,
              fill: false,
              tension: 0
            },
            {
              label: 'Phase C',
              data: phaseCData,
              borderColor: '#27ae60',
              backgroundColor: 'rgba(39, 174, 96, 0.1)',
              borderWidth: 2,
              fill: false,
              tension: 0
            },
            {
              label: 'Total Power',
              data: totalPowerData,
              borderColor: '#8e44ad',
              backgroundColor: 'rgba(142, 68, 173, 0.1)',
              borderWidth: 3,
              fill: false,
              tension: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          spanGaps: 60*60*1000, // 1 Hours
          animation: {
            duration: 0 // Disable all animations
          },
          transitions: {
            active: {
              animation: {
                duration: 0 // Disable active transitions
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Today\'s Power Consumption by Phase',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            x: {
              type: 'time',
              display: true,
              title: {
                display: true,
                text: 'Time'
              },
              time: {
                displayFormats: {
                  minute: 'HH:mm',
                  hour: 'HH:mm'
                },
                tooltipFormat: 'MMM dd, HH:mm:ss'
              },
              ticks: {
                maxTicksLimit: 10,
                source: 'auto'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Power (W)'
              },
              beginAtZero: true
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      })
    }
    
    // Update power chart with new data
    const updatePowerChart = () => {
      if (powerChart.value && todayPowerData.value.length > 0) {
        // Limit data to prevent memory issues
        const maxPoints = 50
        const limitedData = todayPowerData.value.slice(-maxPoints)
        
        // Update datasets with time series format (x,y coordinates)
        powerChart.value.data.datasets[0].data = limitedData.map(item => ({
          x: new Date(item.time),
          y: item.Pa
        }))
        powerChart.value.data.datasets[1].data = limitedData.map(item => ({
          x: new Date(item.time),
          y: item.Pb
        }))
        powerChart.value.data.datasets[2].data = limitedData.map(item => ({
          x: new Date(item.time),
          y: item.Pc
        }))
        powerChart.value.data.datasets[3].data = limitedData.map(item => ({
          x: new Date(item.time),
          y: item.totalPower
        }))
        
        try {
          powerChart.value.update('none')
        } catch (error) {
          console.warn('Error updating power chart:', error)
        }
      }
    }
    
    // Prevent stack overflow with very conservative updates
    let updateQueue = []
    let isUpdating = false
    const MAX_QUEUE_SIZE = 5
    const UPDATE_DELAY = 2000 // 2 seconds between updates
    
    // Update power chart with real-time MQTT data - ultra conservative approach
    const updatePowerChartRealtime = (updateVar) => {
      if (!powerChart.value || !updateVar) return
      
      // Add to queue if not full
      if (updateQueue.length < MAX_QUEUE_SIZE) {
        updateQueue.push({
          Pa: parseFloat(updateVar.Pa || 0),
          Pb: parseFloat(updateVar.Pb || 0),
          Pc: parseFloat(updateVar.Pc || 0),
          time: new Date()
        })
      }
      
      // Process queue if not already processing
      if (!isUpdating && updateQueue.length > 0) {
        processUpdateQueue()
      }
    }
    
    const processUpdateQueue = () => {
      if (updateQueue.length === 0) {
        isUpdating = false
        return
      }
      
      isUpdating = true
      
      try {
        const datasets = powerChart.value.data.datasets
        if (!datasets || datasets.length < 4) {
          isUpdating = false
          return
        }
        
        // Process one update at a time
        const update = updateQueue.shift()
        const totalPower = update.Pa + update.Pb + update.Pc
        
        // Check for valid data
        if (isNaN(update.Pa) || isNaN(update.Pb) || isNaN(update.Pc) || isNaN(totalPower)) {
          isUpdating = false
          setTimeout(processUpdateQueue, UPDATE_DELAY)
          return
        }
        
        const maxPoints = 10 // Very small dataset
        
        // Use direct array manipulation to avoid Chart.js internal issues
        for (let i = 0; i < 4; i++) {
          const data = datasets[i].data
          
          // Ensure data array exists
          if (!Array.isArray(data)) {
            datasets[i].data = []
          }
          
          // Add new point
          const point = {
            x: update.time,
            y: i === 0 ? update.Pa : i === 1 ? update.Pb : i === 2 ? update.Pc : totalPower
          }
          
          datasets[i].data.push(point)
          
          // Limit size very aggressively
          if (datasets[i].data.length > maxPoints) {
            datasets[i].data = datasets[i].data.slice(-maxPoints)
          }
        }
        
        // Use try-catch for update with fallback
        try {
          powerChart.value.update('none')
        } catch (chartError) {
          console.warn('Chart update failed, recreating chart:', chartError)
          setTimeout(() => {
            createPowerChart()
          }, 1000)
        }
        
      } catch (error) {
        console.error('Critical error in chart update:', error)
      }
      
      // Schedule next update
      setTimeout(() => {
        isUpdating = false
        if (updateQueue.length > 0) {
          processUpdateQueue()
        }
      }, UPDATE_DELAY)
    }
    
    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }
    
    // Lifecycle hooks
    onMounted(async () => {
      connectMQTT()
      fetchHistoricalData()
      fetchTodayEnergyData()
      await fetchTodayPowerData()
      // Create power chart after data is loaded
      setTimeout(() => {
        createPowerChart()
      }, 500)
    })
    
    onUnmounted(() => {
      disconnectMQTT()
      // Cleanup chart
      if (powerChart.value) {
        powerChart.value.destroy()
      }
    })
    
    return {
      sensorData,
      historicalData,
      dailyEnergyData,
      todayEnergyData,
      todayPowerData,
      powerChartCanvas,
      isConnected,
      emissionFactor,
      totalPower,
      totalCO2,
      dailyCO2,
      phaseCO2Data,
      co2Equivalents,
      connectionStatus,
      connectionStatusIcon,
      connectionStatusColor,
      formatTimestamp,
      formatCO2,
      calculateCO2Emissions,
      EMISSION_FACTORS
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

/* Today Energy Card Styles */
.today-energy-card {
  background: linear-gradient(135deg, #2d661f 0%, #3b860f 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  color: white;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.today-energy-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.energy-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.energy-card-header i {
  font-size: 24px;
}

.energy-card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.energy-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.energy-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.energy-value .value {
  font-size: 36px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.energy-value .unit {
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.energy-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  min-width: 180px;
}

.detail-item .label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.detail-item .value {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

@media (max-width: 768px) {
  .energy-card-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .energy-details {
    width: 100%;
  }
}

/* Real-time Power Display Styles */
.realtime-power-section {
  margin-bottom: 24px;
}

.power-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px 0;
}

.power-section-header i {
  font-size: 24px;
}

.power-section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.power-phases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.phase-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3498db;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.phase-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.phase-card.phase-a {
  border-left-color: #e74c3c;
}

.phase-card.phase-b {
  border-left-color: #f39c12;
}

.phase-card.phase-c {
  border-left-color: #27ae60;
}

.phase-card.total-power {
  border-left-color: #8e44ad;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.phase-label {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.phase-indicator {
  font-size: 12px;
}

.phase-card.phase-a .phase-indicator {
  color: #e74c3c;
}

.phase-card.phase-b .phase-indicator {
  color: #f39c12;
}

.phase-card.phase-c .phase-indicator {
  color: #27ae60;
}

.phase-card.total-power .phase-indicator {
  color: #8e44ad;
}

.phase-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.phase-value .value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.phase-value.total .value {
  font-size: 32px;
  color: #8e44ad;
}

.phase-value .unit {
  font-size: 16px;
  font-weight: 500;
  color: #7f8c8d;
}

.phase-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail .label {
  font-size: 13px;
  font-weight: 500;
  color: #7f8c8d;
}

.detail .value {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .power-phases-grid {
    grid-template-columns: 1fr;
  }
  
  .phase-card {
    padding: 16px;
  }
  
  .phase-value .value {
    font-size: 24px;
  }
  
  .phase-value.total .value {
    font-size: 28px;
  }
}

/* Power Chart Styles */
.power-chart-section {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3498db;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.chart-header i {
  font-size: 24px;
}

.chart-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.power-chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

.power-chart-container canvas {
  max-width: 100%;
  max-height: 100%;
}

@media (max-width: 768px) {
  .power-chart-container {
    height: 300px;
  }
  
  .power-chart-section {
    padding: 16px;
  }
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