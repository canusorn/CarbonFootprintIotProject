<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <!-- <div class="header-left">
        <h1>Carbon Footprint Dashboard</h1>
      </div> -->
      <div class="header-left">
        <div class="device-info-section">
          <div class="device-name-container">
            <i class="pi pi-microchip" style="color: #3498db; margin-right: 8px;"></i>
            <div v-if="!isEditingDeviceName" class="device-name-display">
              <span class="device-name">{{ currentDevice.name || 'Unknown Device' }}</span>
              <span class="device-id">({{ espId }})</span>
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm edit-btn" @click="startEditingDeviceName"
                v-tooltip="'Edit device name'" />
            </div>
            <div v-else class="device-name-edit">
              <InputText v-model="editingDeviceName" class="device-name-input" @keyup.enter="saveDeviceName"
                @keyup.escape="cancelEditingDeviceName" ref="deviceNameInput" />
              <Button icon="pi pi-check" class="p-button-success p-button-sm save-btn" @click="saveDeviceName"
                :loading="isSavingDeviceName" v-tooltip="'Save'" />
              <Button icon="pi pi-times" class="p-button-text p-button-sm cancel-btn" @click="cancelEditingDeviceName"
                v-tooltip="'Cancel'" />
            </div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="account-section">
          <div class="user-info">
            <i class="pi pi-user" style="color: #2c3e50; margin-right: 8px;"></i>
            <span class="user-email">{{ userEmail }}</span>
          </div>
          <Button icon="pi pi-sign-out" class="p-button-text p-button-sm logout-btn" @click="logout"
            v-tooltip="'Logout'" />
        </div>
      </div>
    </div>

    <TabView :activeIndex="0">
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
              <i class="pi pi-flash" :style="{ color: isUsingFallbackData ? '#f39c12' : '#e74c3c' }"></i>
              <h3>{{ isUsingFallbackData ? 'Today\'s Power Consumption (Last Data)' : 'Real-time Power (3-Phase)' }}
              </h3>
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
          <DailyEnergyChart :daily-energy-data="dailyEnergyData" :emission-factor="emissionFactor" />
        </div>
      </TabPanel>

      <TabPanel header="History">
        <div class="history-content">
          <div class="history-controls">
            <div class="date-range-section">
              <h3>Select Date Range</h3>
              <div class="date-controls">
                <div class="preset-dropdown">
                  <label>Quick Select:</label>
                  <Dropdown v-model="selectedPreset" :options="datePresetOptions" optionLabel="label"
                    optionValue="value" placeholder="Select date range" @change="onPresetChange"
                    class="preset-selector" />
                </div>
                <div class="date-pickers">
                  <div class="date-picker-group">
                    <label>Select Date Range:</label>
                    <DatePicker v-model="dateRange" selectionMode="range" dateFormat="yy-mm-dd" showIcon
                      :manualInput="false" placeholder="Select date range" @date-select="onDateRangeChange" />
                  </div>
                </div>
                <div class="action-buttons">
                  <Button label="Fetch Data" icon="pi pi-search" @click="fetchHistoricalData"
                    :loading="isLoadingHistory" :disabled="!dateRange || !dateRange[0] || !dateRange[1]" />
                  <Button label="Download CSV" icon="pi pi-download" @click="downloadCSV"
                    :disabled="!historicalData || historicalData.length === 0" class="p-button-success" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="isLoadingHistory" class="loading-section">
            <div class="loading-content">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
              <p>Loading historical data...</p>
            </div>
          </div>

          <div v-else-if="historicalData && historicalData.length > 0" class="history-results">
            <div class="data-summary">
              <Card>
                <template #title>Data Summary</template>
                <template #content>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <span class="summary-label">Total Records:</span>
                      <span class="summary-value">{{ historicalData.length }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Total Energy:</span>
                      <span class="summary-value">{{ formatEnergy(totalEnergy) }} kWh</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Total CO2 Emissions:</span>
                      <span class="summary-value">{{ formatCO2(historicalTotalCO2) }} kg CO2</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Date Range:</span>
                      <span class="summary-value">{{ formatDateRange() }}</span>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="chart-section">
              <Card>
                <template #title>Power Consumption & CO2 Emissions</template>
                <template #content>
                  <div ref="uplotContainer" class="uplot-container">
                    <div v-if="!uplotChart" class="chart-loading">
                      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #666;"></i>
                      <p>Loading chart...</p>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Comprehensive Sensor Data Chart -->
            <div class="comprehensive-chart-section">
              <Card>
                <template #title>Comprehensive Sensor Data</template>
                <template #content>
                  <div class="chart-controls">
                    <div class="chart-type-dropdown">
                      <label>Chart Type:</label>
                      <Dropdown v-model="comprehensiveChartType" :options="chartTypeOptions" optionLabel="label"
                        optionValue="value" placeholder="Select chart type" @change="onChartTypeChange"
                        class="chart-type-selector" />
                    </div>
                  </div>
                  <div ref="comprehensiveUplotContainer" class="uplot-container comprehensive-chart">
                    <div v-if="!comprehensiveUplotChart" class="chart-loading">
                      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #666;"></i>
                      <p>Loading comprehensive chart...</p>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>

          <div v-else-if="!isLoadingHistory && historicalDataFetched" class="no-data-section">
            <Card>
              <template #content>
                <div class="no-data-content">
                  <i class="pi pi-info-circle" style="font-size: 3rem; color: #6c757d;"></i>
                  <h3>No Data Found</h3>
                  <p>No sensor data found for the selected date range.</p>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mqtt from 'mqtt'
import axios from 'axios'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Dropdown from 'primevue/dropdown'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
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
    DatePicker,
    Button,
    InputText,
    DataCard,
    EnergyCard,
    CO2Card,
    DailyEnergyChart, 
    Dropdown
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
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
    const isUsingFallbackData = ref(false)
    const emissionFactor = ref(EMISSION_FACTORS.THAILAND) // kg CO2 per kWh (Thailand grid factor)
    const espId = ref(route.params.espid || 'ESP001') // Get from route parameter or default

    // Device management
    const currentDevice = ref({ name: '', espid: '' })
    const isEditingDeviceName = ref(false)
    const editingDeviceName = ref('')
    const isSavingDeviceName = ref(false)
    const deviceNameInput = ref(null)

    // User account management
    const userEmail = ref('')

    // Computed properties
    const totalPower = computed(() => {
      const Pa = parseFloat(sensorData.value.Pa) || 0
      const Pb = parseFloat(sensorData.value.Pb) || 0
      const Pc = parseFloat(sensorData.value.Pc) || 0
      return Pa + Pb + Pc
    })

    const totalCO2 = computed(() => {
      const energyValue = parseFloat(sensorData.value.Ett) || 0
      return calculateCO2Emissions(energyValue, emissionFactor.value)
    })

    const dailyCO2 = computed(() => {
      // Calculate daily CO2 from today's energy consumption
      const energyValue = parseFloat(todayEnergyData.value.todayEnergy) || 0
      return calculateCO2Emissions(energyValue, emissionFactor.value)
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

              // Reset fallback flag when new MQTT data is received
              if (isUsingFallbackData.value) {
                isUsingFallbackData.value = false
                console.log('Switched back to real-time MQTT data')
              }

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

              // Keep all data points - no data limiting to preserve historical data

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

    // Device management methods
    const fetchDeviceInfo = async () => {
      try {
        const token = localStorage.getItem('token')
        console.log('Fetching device info for ESP ID:', espId.value)
        console.log('Using token:', token ? 'Token present' : 'No token found')

        if (!token) {
          console.error('No authentication token found')
          currentDevice.value = { name: 'Unknown Device', espid: espId.value }
          return
        }

        const response = await axios.get(`http://localhost:3000/api/devices/${espId.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('Device info response:', response.data)

        if (response.data) {
          currentDevice.value = response.data
          console.log('Device info updated:', currentDevice.value)
        }
      } catch (error) {
        console.error('Error fetching device info:', error)
        console.error('Error details:', error.response?.data || error.message)
        // Set default values if fetch fails
        currentDevice.value = { name: 'Unknown Device', espid: espId.value }
      }
    }

    const startEditingDeviceName = () => {
      editingDeviceName.value = currentDevice.value.name || ''
      isEditingDeviceName.value = true
      nextTick(() => {
        if (deviceNameInput.value) {
          deviceNameInput.value.$el.focus()
        }
      })
    }

    const cancelEditingDeviceName = () => {
      isEditingDeviceName.value = false
      editingDeviceName.value = ''
    }

    const saveDeviceName = async () => {
      if (!editingDeviceName.value.trim()) {
        return
      }

      isSavingDeviceName.value = true

      try {
        const token = localStorage.getItem('token')
        const response = await axios.put(`http://localhost:3000/api/devices/${espId.value}`, {
          name: editingDeviceName.value.trim()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          currentDevice.value.name = editingDeviceName.value.trim()
          isEditingDeviceName.value = false
          editingDeviceName.value = ''
        }
      } catch (error) {
        console.error('Error saving device name:', error)
        // You could add a toast notification here
      } finally {
        isSavingDeviceName.value = false
      }
    }

    // User account management methods
    const getUserEmailFromToken = () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          // Decode JWT token to get user email
          const payload = JSON.parse(atob(token.split('.')[1]))
          userEmail.value = payload.email || 'Unknown User'
        } else {
          userEmail.value = 'Not logged in'
        }
      } catch (error) {
        console.error('Error decoding token:', error)
        userEmail.value = 'Unknown User'
      }
    }

    const logout = () => {
      // Clear authentication token
      localStorage.removeItem('token')
      // Disconnect MQTT if connected
      disconnectMQTT()
      // Redirect to home page
      router.push('/')
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

    // Fetch daily energy data from backend
    const fetchDailyEnergyData = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://localhost:3000/api/daily-energy/${espId.value}`, {
          params: {
            days: 30 // Get last 30 days
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data && Array.isArray(response.data)) {
          dailyEnergyData.value = response.data.map(item => ({
            date: item.date,
            energy: parseFloat(item.energy || 0),
            co2: parseFloat(item.energy || 0) * emissionFactor.value,
            recordCount: parseInt(item.recordCount || 0)
          }))
          console.log('Fetched daily energy data:', dailyEnergyData.value.length, 'records')
        }
      } catch (error) {
        console.error('Error fetching daily energy data:', error)
        dailyEnergyData.value = []
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
            Va: parseFloat(item.Va || 0),
            Vb: parseFloat(item.Vb || 0),
            Vc: parseFloat(item.Vc || 0),
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

      // Check if canvas element exists and is properly mounted
      if (!powerChartCanvas.value) {
        console.warn('Power chart canvas not found')
        return
      }

      // Destroy existing chart if it exists
      if (powerChart.value) {
        try {
          powerChart.value.destroy()
          powerChart.value = null
        } catch (error) {
          console.warn('Error destroying existing chart:', error)
          powerChart.value = null
        }
      }

      // Get canvas context with additional validation
      let ctx
      try {
        ctx = powerChartCanvas.value.getContext('2d')
        if (!ctx) {
          console.warn('Failed to get 2D context from canvas')
          return
        }

        // Ensure canvas has proper dimensions
        if (powerChartCanvas.value.width === 0 || powerChartCanvas.value.height === 0) {
          console.warn('Canvas has invalid dimensions')
          return
        }
      } catch (error) {
        console.error('Error getting canvas context:', error)
        return
      }

      // Prepare chart data from todayPowerData with time series format (no limit)
      const phaseAData = todayPowerData.value.map(item => ({
        x: new Date(item.time),
        y: item.Pa
      }))
      const phaseBData = todayPowerData.value.map(item => ({
        x: new Date(item.time),
        y: item.Pb
      }))
      const phaseCData = todayPowerData.value.map(item => ({
        x: new Date(item.time),
        y: item.Pc
      }))
      const totalPowerData = todayPowerData.value.map(item => ({
        x: new Date(item.time),
        y: item.totalPower
      }))

      try {
        // Add global error handler for Chart.js
        const originalConsoleError = console.error
        console.error = function (...args) {
          const errorMsg = args.join(' ')
          if (errorMsg.includes('clipArea') || errorMsg.includes('Cannot read properties of null')) {
            console.warn('Chart.js clipArea error caught and suppressed:', errorMsg)
            return
          }
          originalConsoleError.apply(console, args)
        }

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
                tension: 0,
                clip: false // Disable clipping to prevent clipArea errors
              },
              {
                label: 'Phase B',
                data: phaseBData,
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0,
                clip: false // Disable clipping to prevent clipArea errors
              },
              {
                label: 'Phase C',
                data: phaseCData,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0,
                clip: false // Disable clipping to prevent clipArea errors
              },
              {
                label: 'Total Power',
                data: totalPowerData,
                borderColor: '#8e44ad',
                backgroundColor: 'rgba(142, 68, 173, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0,
                clip: false // Disable clipping to prevent clipArea errors
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            spanGaps: 60 * 60 * 1000, // 1 Hours
            // Disable clipping globally to prevent clipArea errors
            clip: false,
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
            // Disable clipping to prevent clipArea errors
            layout: {
              padding: 0
            },
            // Add canvas validation before any drawing operations
            onResize: (chart, size) => {
              if (!chart.canvas || !chart.ctx) {
                console.warn('Chart canvas or context is null during resize')
                return false
              }
            },
            events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'], // Explicitly define events
            plugins: {
              // Custom plugin to validate canvas context
              canvasValidator: {
                beforeDraw: (chart) => {
                  if (!chart.ctx || !chart.canvas) {
                    console.warn('Chart context or canvas is null, skipping draw')
                    return false
                  }
                  return true
                }
              },
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
              },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                // Disable tooltip animations to prevent context errors
                animation: false
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
            },
            onHover: null, // Disable hover events to prevent undefined errors
            onClick: null  // Disable click events to prevent undefined errors
          }
        })

        // Restore original console.error
        console.error = originalConsoleError

        // Add window error handler for clipArea errors
        const handleChartError = (event) => {
          if (event.error && event.error.message &&
            (event.error.message.includes('clipArea') ||
              event.error.message.includes('Cannot read properties of null'))) {
            console.warn('Chart.js clipArea error caught by window handler:', event.error.message)
            event.preventDefault()
            return false
          }
        }

        window.addEventListener('error', handleChartError)

        // Store error handler reference for cleanup
        if (powerChart.value) {
          powerChart.value._errorHandler = handleChartError
        }

      } catch (error) {
        console.error('Error creating power chart:', error)
        return
      }
    }

    // Update power chart with new data
    const updatePowerChart = () => {
      // Simply recreate the chart to avoid update errors
      createPowerChart()
    }

    // Simplified real-time update - recreate chart to avoid errors
    let lastUpdateTime = 0
    const UPDATE_THROTTLE = 5000 // 5 seconds between updates

    const updatePowerChartRealtime = (updateVar) => {
      if (!updateVar) return

      const now = Date.now()
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        return // Throttle updates
      }

      lastUpdateTime = now

      // Check if canvas is available before updating
      if (!powerChartCanvas.value) {
        console.warn('Canvas not available for real-time update')
        return
      }

      // Simply recreate the chart with latest data
      try {
        createPowerChart()
      } catch (error) {
        console.warn('Error recreating power chart:', error)
      }
    }



    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }

    // Function to populate sensorData with last available data
    const populateWithLastData = () => {
      if (todayPowerData.value.length > 0) {
        const lastRecord = todayPowerData.value[todayPowerData.value.length - 1]
        console.log('Using last available data for power display:', lastRecord)

        // Set fallback data flag
        isUsingFallbackData.value = true

        // Update sensorData with last known power and voltage values
        sensorData.value = {
          ...sensorData.value,
          Pa: lastRecord.Pa || 0,
          Pb: lastRecord.Pb || 0,
          Pc: lastRecord.Pc || 0,
          // Use real voltage data from database
          Va: lastRecord.Va || 0,
          Vb: lastRecord.Vb || 0,
          Vc: lastRecord.Vc || 0,
          // Calculate current using real voltage data (I = P / V)
          Ia: lastRecord.Va > 0 ? (lastRecord.Pa / lastRecord.Va) : 0,
          Ib: lastRecord.Vb > 0 ? (lastRecord.Pb / lastRecord.Vb) : 0,
          Ic: lastRecord.Vc > 0 ? (lastRecord.Pc / lastRecord.Vc) : 0,
          PFa: sensorData.value.PFa || 0.85,
          PFb: sensorData.value.PFb || 0.85,
          PFc: sensorData.value.PFc || 0.85,
          Ett: todayEnergyData.value.endEnergy || 0
        }
      }
    }

    // Lifecycle hooks
    onMounted(async () => {
      getUserEmailFromToken()
      connectMQTT()
      fetchDeviceInfo()

      // Set default preset to 'Today' when component loads
      setDatePreset('today')

      fetchHistoricalData()
      fetchTodayEnergyData()
      fetchDailyEnergyData()
      await fetchTodayPowerData()

      populateWithLastData();

      // Create power chart after DOM is fully rendered and data is loaded
      await nextTick()

      // Wait for canvas to be properly initialized
      const initChart = () => {
        if (powerChartCanvas.value &&
          powerChartCanvas.value.offsetWidth > 0 &&
          powerChartCanvas.value.offsetHeight > 0) {
          try {
            createPowerChart()
          } catch (error) {
            console.error('Failed to create chart:', error)
          }
        } else {
          console.warn('Canvas not ready, retrying in 500ms...')
          setTimeout(initChart, 500)
        }
      }

      setTimeout(initChart, 300)

      // Add resize event listener for chart responsiveness
      window.addEventListener('resize', handleResize)
    })

    // Handle window resize for chart responsiveness
    const handleResize = () => {
      if (uplotChart.value && uplotContainer.value) {
        const resizeRect = uplotContainer.value.getBoundingClientRect()
        const newWidth = Math.max(resizeRect.width, 400) // Minimum width of 400px
        const newHeight = 400

        try {
          uplotChart.value.setSize({ width: newWidth, height: newHeight })
        } catch (error) {
          console.warn('Error resizing uPlot chart:', error)
        }
      }
    }

    // ResizeObserver for better container size detection
    const resizeObserver = ref(null)

    const setupResizeObserver = () => {
      if (uplotContainer.value && window.ResizeObserver) {
        resizeObserver.value = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === uplotContainer.value) {
              handleResize()
            }
          }
        })
        resizeObserver.value.observe(uplotContainer.value)
      }
    }

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver.value) {
        resizeObserver.value.disconnect()
        resizeObserver.value = null
      }
      disconnectMQTT()
      // Cleanup chart with proper error handling
      if (powerChart.value) {
        try {
          // Remove error handler if it exists
          if (powerChart.value._errorHandler) {
            window.removeEventListener('error', powerChart.value._errorHandler)
          }
          powerChart.value.destroy()
        } catch (error) {
          console.warn('Error destroying chart on unmount:', error)
        } finally {
          powerChart.value = null
        }
      }
      // Cleanup uPlot chart
      if (uplotChart.value) {
        try {
          uplotChart.value.destroy()
        } catch (error) {
          console.warn('Error destroying uPlot chart on unmount:', error)
        } finally {
          uplotChart.value = null
        }
      }
    })

    // History tab functionality
    const startDate = ref(null)
    const endDate = ref(null)
    const dateRange = ref(null)
    const selectedPreset = ref('')
    const isLoadingHistory = ref(false)
    const historicalDataFetched = ref(false)
    const uplotContainer = ref(null)
    const uplotChart = ref(null)

    // Comprehensive sensor data chart
    const comprehensiveUplotContainer = ref(null)
    const comprehensiveUplotChart = ref(null)
    const comprehensiveChartType = ref('all') // voltage, current, power, powerfactor, energy, all

    // Dropdown options
    const datePresetOptions = [
      { label: 'Today', value: 'today' },
      { label: 'Yesterday', value: 'yesterday' },
      { label: 'Last 7 Days', value: 'last7days' },
      { label: 'Last 30 Days', value: 'last30days' }
    ]

    const chartTypeOptions = [
      { label: 'Voltage', value: 'voltage' },
      { label: 'Current', value: 'current' },
      { label: 'Power', value: 'power' },
      { label: 'Power Factor', value: 'powerfactor' },
      { label: 'Energy', value: 'energy' },
      { label: 'All Parameters', value: 'all' }
    ]

    // History computed properties
    const totalEnergy = computed(() => {
      if (!historicalData.value || historicalData.value.length === 0) return 0
      const firstRecord = historicalData.value[0]
      const lastRecord = historicalData.value[historicalData.value.length - 1]
      return Math.max(0, (lastRecord.Ett || 0) - (firstRecord.Ett || 0))
    })

    const historicalTotalCO2 = computed(() => {
      return calculateCO2Emissions(totalEnergy.value, emissionFactor.value)
    })

    // Date preset functions
    const setDatePreset = (preset) => {
      selectedPreset.value = preset
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let start, end

      switch (preset) {
        case 'today':
          start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          end = new Date() // Current time, not end of day
          break
        case 'yesterday':
          start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
          end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
          break
        case 'last7days':
          const last7Days = new Date(today)
          last7Days.setDate(last7Days.getDate() - 7)
          start = new Date(last7Days.getFullYear(), last7Days.getMonth(), last7Days.getDate())
          end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
          break
        case 'last30days':
          const last30Days = new Date(today)
          last30Days.setDate(last30Days.getDate() - 30)
          start = new Date(last30Days.getFullYear(), last30Days.getMonth(), last30Days.getDate())
          end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
          break
      }

      // Update both individual dates and range
      startDate.value = start
      endDate.value = end
      dateRange.value = [start, end]
    }

    const onDateRangeChange = () => {
      selectedPreset.value = '' // Clear preset when manually selecting dates
      if (dateRange.value && dateRange.value.length === 2) {
        startDate.value = dateRange.value[0]
        endDate.value = dateRange.value[1]
        // Ensure end date includes the full day
        if (endDate.value) {
          endDate.value.setHours(23, 59, 59, 999)
        }
      }
    }

    // Fetch historical data from backend
    const fetchHistoricalData = async () => {
      if (!startDate.value || !endDate.value) {
        alert('Please select a date range')
        return
      }

      isLoadingHistory.value = true
      historicalDataFetched.value = false

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        // Format dates in local timezone to avoid UTC conversion issues
        const formatLocalDate = (date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const startDateStr = formatLocalDate(startDate.value) + ' 00:00:00'
        const endDateStr = formatLocalDate(endDate.value) + ' 23:59:59'

        const response = await axios.get(`http://localhost:3000/api/sensor-data/${espId.value}/history`, {
          params: {
            startDate: startDateStr,
            endDate: endDateStr
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        historicalData.value = response.data
        historicalDataFetched.value = true

        // Create uPlot charts after data is loaded
        if (historicalData.value.length > 0) {
          await nextTick()
          // Add small delay to ensure containers are fully rendered
          setTimeout(() => {
            createUPlotChart()
            createComprehensiveUPlotChart()
            // Setup resize observer after charts are created
            setupResizeObserver()
          }, 100)
        }

      } catch (error) {
        console.error('Error fetching historical data:', error)
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        } else {
          alert('Failed to fetch historical data. Please try again.')
        }
      } finally {
        isLoadingHistory.value = false
      }
    }

    // Create uPlot chart for high-performance visualization
    const createUPlotChart = () => {
      if (!uplotContainer.value || !historicalData.value.length) {
        return
      }

      // Ensure container has proper dimensions before creating chart
      const initRect = uplotContainer.value.getBoundingClientRect()
      if (initRect.width === 0 || initRect.height === 0) {
        // Container not properly sized yet, retry after a short delay
        setTimeout(() => {
          createUPlotChart()
        }, 50)
        return
      }

      // Destroy existing chart
      if (uplotChart.value) {
        try {
          uplotChart.value.destroy()
        } catch (e) {
          console.warn('Error destroying existing chart:', e)
        }
        uplotChart.value = null
      }

      // Prepare data for uPlot - 4 series: power, CO2 from power, energy, cumulative CO2 from energy
      const timestamps = []
      const powerData = []
      const co2FromPowerData = []
      const energyData = []
      const cumulativeCO2FromEnergyData = []

      // Sort historical data by time to ensure proper ordering
      const sortedData = [...historicalData.value].sort((a, b) => new Date(a.time) - new Date(b.time))

      let cumulativeCO2 = 0
      const baseEnergy = sortedData.length > 0 ? (parseFloat(sortedData[0].Ett) || 0) : 0

      sortedData.forEach((record, index) => {
        const timestamp = new Date(record.time).getTime() / 1000 // uPlot expects seconds

        // 1. Total Power (W)
        const Pa = parseFloat(record.Pa) || 0
        const Pb = parseFloat(record.Pb) || 0
        const Pc = parseFloat(record.Pc) || 0
        const totalPower = Pa + Pb + Pc

        // 2. CO2 from Power (instantaneous calculation)
        // Convert power to energy (assuming 1-hour intervals for approximation)
        const powerInKW = totalPower / 1000
        const co2FromPower = calculateCO2Emissions(powerInKW, emissionFactor.value)

        // 3. Total Energy (kWh)
        const energyValue = parseFloat(record.Ett) || 0
        const totalEnergy = energyValue - baseEnergy

        // 4. Cumulative CO2 from Energy (kg)
        cumulativeCO2 = calculateCO2Emissions(totalEnergy, emissionFactor.value)

        timestamps.push(timestamp)
        powerData.push(totalPower)
        co2FromPowerData.push(co2FromPower)
        energyData.push(totalEnergy)
        cumulativeCO2FromEnergyData.push(cumulativeCO2)
      })

      const data = [timestamps, powerData, co2FromPowerData, energyData, cumulativeCO2FromEnergyData]

      // Get actual container dimensions
      const chartRect = uplotContainer.value.getBoundingClientRect()
      const containerWidth = Math.max(chartRect.width, 400) // Minimum width of 400px
      const containerHeight = 400

      const opts = {
        title: 'Power, Energy & CO2 Emissions Over Time',
        width: containerWidth,
        height: containerHeight,
        series: [
          {},
          {
            label: 'Total Power (W)',
            stroke: '#3498db',
            width: 2,
            scale: 'power'
          },
          {
            label: 'CO2 from Power (kg)',
            stroke: '#e74c3c',
            width: 2,
            scale: 'co2Power'
          },
          {
            label: 'Total Energy (kWh)',
            stroke: '#2ecc71',
            width: 2,
            scale: 'energy'
          },
          {
            label: 'Cumulative CO2 from Energy (kg)',
            stroke: '#f39c12',
            width: 2,
            scale: 'co2Energy'
          }
        ],
        axes: [
          {
            scale: 'x',
            space: 80,
            incrs: [60, 300, 900, 1800, 3600, 7200, 14400, 28800, 86400, 604800],
            values: (u, vals) => {
              if (!vals || vals.length === 0) return []

              // Calculate the time span of the data
              const minTime = Math.min(...vals)
              const maxTime = Math.max(...vals)
              const timeSpanHours = (maxTime - minTime) / 3600

              return vals.map(v => {
                const date = new Date(v * 1000)

                if (timeSpanHours <= 24) {
                  // Less than 24 hours - show time only
                  return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })
                } else if (timeSpanHours <= 168) {
                  // Less than 7 days - show month/day and time
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  }) + '\n' + date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })
                } else {
                  // More than 7 days - show date only
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit'
                  })
                }
              })
            }
          },
          {
            scale: 'power',
            label: 'Power (W)',
            labelGap: 8,
            side: 3,
            grid: { show: true }
          },
          {
            scale: 'co2Power',
            label: 'CO2 from Power (kg)',
            labelGap: 8,
            side: 1,
            grid: { show: false }
          },
          {
            scale: 'energy',
            label: 'Energy (kWh)',
            labelGap: 8,
            side: 3,
            grid: { show: false }
          },
          {
            scale: 'co2Energy',
            label: 'Cumulative CO2 (kg)',
            labelGap: 8,
            side: 1,
            grid: { show: false }
          }
        ],
        scales: {
          x: {
            time: true,
            auto: true
          },
          power: {
            auto: true
          },
          co2Power: {
            auto: true
          },
          energy: {
            auto: true
          },
          co2Energy: {
            auto: true
          }
        }
      }

      try {
        uplotChart.value = new uPlot(opts, data, uplotContainer.value)
        console.log('uPlot chart created successfully with dimensions:', containerWidth, 'x', containerHeight)
      } catch (error) {
        console.error('Error creating uPlot chart:', error)
        uplotChart.value = null
      }
    }

    // CSV download functionality
    const downloadCSV = () => {
      if (!historicalData.value || historicalData.value.length === 0) {
        alert('No data available to download')
        return
      }

      // Prepare CSV headers
      const headers = [
        'Timestamp',
        'Voltage A (V)', 'Voltage B (V)', 'Voltage C (V)',
        'Current A (A)', 'Current B (A)', 'Current C (A)',
        'Power A (W)', 'Power B (W)', 'Power C (W)',
        'Total Power (W)',
        'Power Factor A', 'Power Factor B', 'Power Factor C',
        'Energy Import (kWh)', 'Energy Export (kWh)', 'Energy Total (kWh)',
        'CO2 Emissions (kg)'
      ]

      // Prepare CSV rows
      const rows = historicalData.value.map(record => {
        const Pa = parseFloat(record.Pa) || 0
        const Pb = parseFloat(record.Pb) || 0
        const Pc = parseFloat(record.Pc) || 0
        const totalPower = Pa + Pb + Pc
        const energyValue = parseFloat(record.Ett) || 0
        const co2 = calculateCO2Emissions(energyValue, emissionFactor.value)

        return [
          new Date(record.time).toLocaleString(),
          record.Va || 0, record.Vb || 0, record.Vc || 0,
          record.Ia || 0, record.Ib || 0, record.Ic || 0,
          record.Pa || 0, record.Pb || 0, record.Pc || 0,
          totalPower,
          record.PFa || 0, record.PFb || 0, record.PFc || 0,
          record.Eim || 0, record.Eex || 0, record.Ett || 0,
          co2.toFixed(4)
        ]
      })

      // Create CSV content
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)

      const dateRange = formatDateRange()
      const filename = `sensor_data_${espId.value}_${dateRange.replace(/\s+/g, '_')}.csv`
      link.setAttribute('download', filename)

      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // Utility functions
    const formatEnergy = (energy) => {
      return energy.toFixed(3)
    }

    const formatDateRange = () => {
      if (!startDate.value || !endDate.value) return ''
      const start = startDate.value.toLocaleDateString()
      const end = endDate.value.toLocaleDateString()
      return `${start} - ${end}`
    }

    // Comprehensive chart functions
    const setComprehensiveChartType = (type) => {
      comprehensiveChartType.value = type
      if (historicalData.value && historicalData.value.length > 0) {
        createComprehensiveUPlotChart()
      }
    }

    // Dropdown change handlers
    const onPresetChange = (event) => {
      setDatePreset(event.value)
    }

    const onChartTypeChange = (event) => {
      setComprehensiveChartType(event.value)
    }

    const createComprehensiveUPlotChart = () => {
      if (!comprehensiveUplotContainer.value || !historicalData.value.length) {
        return
      }

      // Ensure container has proper dimensions
      const initRect = comprehensiveUplotContainer.value.getBoundingClientRect()
      if (initRect.width === 0 || initRect.height === 0) {
        setTimeout(() => {
          createComprehensiveUPlotChart()
        }, 50)
        return
      }

      // Destroy existing chart
      if (comprehensiveUplotChart.value) {
        try {
          comprehensiveUplotChart.value.destroy()
        } catch (e) {
          console.warn('Error destroying existing comprehensive chart:', e)
        }
        comprehensiveUplotChart.value = null
      }

      // Prepare data based on chart type
      const timestamps = []
      const seriesData = []
      const seriesConfig = []
      const scales = { x: { time: true, auto: true } }
      const axes = [{
        scale: 'x',
        space: 80,
        incrs: [60, 300, 900, 1800, 3600, 7200, 14400, 28800, 86400, 604800],
        values: (u, vals) => {
          if (!vals || vals.length === 0) return []

          const minTime = Math.min(...vals)
          const maxTime = Math.max(...vals)
          const timeSpanHours = (maxTime - minTime) / 3600

          return vals.map(v => {
            const date = new Date(v * 1000)

            if (timeSpanHours <= 24) {
              return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            } else if (timeSpanHours <= 168) {
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              }) + '\n' + date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            } else {
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit'
              })
            }
          })
        }
      }]

      // Sort historical data by time
      const sortedData = [...historicalData.value].sort((a, b) => new Date(a.time) - new Date(b.time))

      // Prepare timestamps
      sortedData.forEach(record => {
        timestamps.push(new Date(record.time).getTime() / 1000)
      })

      // Configure series based on chart type
      if (comprehensiveChartType.value === 'voltage') {
        const vaData = [], vbData = [], vcData = []
        sortedData.forEach(record => {
          vaData.push(parseFloat(record.Va) || 0)
          vbData.push(parseFloat(record.Vb) || 0)
          vcData.push(parseFloat(record.Vc) || 0)
        })
        seriesData.push(timestamps, vaData, vbData, vcData)
        seriesConfig.push(
          {},
          { label: 'Voltage A (V)', stroke: '#e74c3c', width: 2, scale: 'voltage' },
          { label: 'Voltage B (V)', stroke: '#f39c12', width: 2, scale: 'voltage' },
          { label: 'Voltage C (V)', stroke: '#3498db', width: 2, scale: 'voltage' }
        )
        scales.voltage = { auto: true }
        axes.push({ scale: 'voltage', label: 'Voltage (V)', labelGap: 8, side: 3, grid: { show: true } })

      } else if (comprehensiveChartType.value === 'current') {
        const iaData = [], ibData = [], icData = []
        sortedData.forEach(record => {
          iaData.push(parseFloat(record.Ia) || 0)
          ibData.push(parseFloat(record.Ib) || 0)
          icData.push(parseFloat(record.Ic) || 0)
        })
        seriesData.push(timestamps, iaData, ibData, icData)
        seriesConfig.push(
          {},
          { label: 'Current A (A)', stroke: '#e74c3c', width: 2, scale: 'current' },
          { label: 'Current B (A)', stroke: '#f39c12', width: 2, scale: 'current' },
          { label: 'Current C (A)', stroke: '#3498db', width: 2, scale: 'current' }
        )
        scales.current = { auto: true }
        axes.push({ scale: 'current', label: 'Current (A)', labelGap: 8, side: 3, grid: { show: true } })

      } else if (comprehensiveChartType.value === 'power') {
        const paData = [], pbData = [], pcData = [], totalPowerData = []
        sortedData.forEach(record => {
          const pa = parseFloat(record.Pa) || 0
          const pb = parseFloat(record.Pb) || 0
          const pc = parseFloat(record.Pc) || 0
          paData.push(pa)
          pbData.push(pb)
          pcData.push(pc)
          totalPowerData.push(pa + pb + pc)
        })
        seriesData.push(timestamps, paData, pbData, pcData, totalPowerData)
        seriesConfig.push(
          {},
          { label: 'Power A (W)', stroke: '#e74c3c', width: 2, scale: 'power' },
          { label: 'Power B (W)', stroke: '#f39c12', width: 2, scale: 'power' },
          { label: 'Power C (W)', stroke: '#3498db', width: 2, scale: 'power' },
          { label: 'Total Power (W)', stroke: '#2ecc71', width: 3, scale: 'power' }
        )
        scales.power = { auto: true }
        axes.push({ scale: 'power', label: 'Power (W)', labelGap: 8, side: 3, grid: { show: true } })

      } else if (comprehensiveChartType.value === 'powerfactor') {
        const pfaData = [], pfbData = [], pfcData = []
        sortedData.forEach(record => {
          pfaData.push(parseFloat(record.PFa) || 0)
          pfbData.push(parseFloat(record.PFb) || 0)
          pfcData.push(parseFloat(record.PFc) || 0)
        })
        seriesData.push(timestamps, pfaData, pfbData, pfcData)
        seriesConfig.push(
          {},
          { label: 'Power Factor A', stroke: '#e74c3c', width: 2, scale: 'pf' },
          { label: 'Power Factor B', stroke: '#f39c12', width: 2, scale: 'pf' },
          { label: 'Power Factor C', stroke: '#3498db', width: 2, scale: 'pf' }
        )
        scales.pf = { auto: true, range: [0, 1] }
        axes.push({ scale: 'pf', label: 'Power Factor', labelGap: 8, side: 3, grid: { show: true } })

      } else if (comprehensiveChartType.value === 'energy') {
        const ettData = []
        sortedData.forEach(record => {
          ettData.push(parseFloat(record.Ett) || 0)
        })
        seriesData.push(timestamps, ettData)
        seriesConfig.push(
          {},
          { label: 'Total Energy (kWh)', stroke: '#9b59b6', width: 3, scale: 'energy' }
        )
        scales.energy = { auto: true }
        axes.push({ scale: 'energy', label: 'Energy (kWh)', labelGap: 8, side: 3, grid: { show: true } })

      } else if (comprehensiveChartType.value === 'all') {
        const vaData = [], vbData = [], vcData = []
        const iaData = [], ibData = [], icData = []
        const paData = [], pbData = [], pcData = []
        const pfaData = [], pfbData = [], pfcData = []
        const ettData = []

        sortedData.forEach(record => {
          // Voltage data
          vaData.push(parseFloat(record.Va) || 0)
          vbData.push(parseFloat(record.Vb) || 0)
          vcData.push(parseFloat(record.Vc) || 0)
          // Current data
          iaData.push(parseFloat(record.Ia) || 0)
          ibData.push(parseFloat(record.Ib) || 0)
          icData.push(parseFloat(record.Ic) || 0)
          // Power data
          paData.push(parseFloat(record.Pa) || 0)
          pbData.push(parseFloat(record.Pb) || 0)
          pcData.push(parseFloat(record.Pc) || 0)
          // Power Factor data
          pfaData.push(parseFloat(record.PFa) || 0)
          pfbData.push(parseFloat(record.PFb) || 0)
          pfcData.push(parseFloat(record.PFc) || 0)
          // Energy Total
          ettData.push(parseFloat(record.Ett) || 0)
        })

        seriesData.push(timestamps, vaData, vbData, vcData, iaData, ibData, icData, paData, pbData, pcData, pfaData, pfbData, pfcData, ettData)
        seriesConfig.push(
          {},
          // Voltage series
          { label: 'Va (V)', stroke: '#e74c3c', width: 2, scale: 'voltage' },
          { label: 'Vb (V)', stroke: '#c0392b', width: 2, scale: 'voltage' },
          { label: 'Vc (V)', stroke: '#a93226', width: 2, scale: 'voltage' },
          // Current series
          { label: 'Ia (A)', stroke: '#f39c12', width: 2, scale: 'current' },
          { label: 'Ib (A)', stroke: '#e67e22', width: 2, scale: 'current' },
          { label: 'Ic (A)', stroke: '#d35400', width: 2, scale: 'current' },
          // Power series
          { label: 'Pa (W)', stroke: '#3498db', width: 2, scale: 'power' },
          { label: 'Pb (W)', stroke: '#2980b9', width: 2, scale: 'power' },
          { label: 'Pc (W)', stroke: '#1f618d', width: 2, scale: 'power' },
          // Power Factor series
          { label: 'PFa', stroke: '#2ecc71', width: 2, scale: 'pf' },
          { label: 'PFb', stroke: '#27ae60', width: 2, scale: 'pf' },
          { label: 'PFc', stroke: '#229954', width: 2, scale: 'pf' },
          // Energy Total
          { label: 'Ett (kWh)', stroke: '#9b59b6', width: 3, scale: 'energy' }
        )

        scales.voltage = { auto: true }
        scales.current = { auto: true }
        scales.power = { auto: true }
        scales.pf = { auto: true, range: [0, 1] }
        scales.energy = { auto: true }

        axes.push(
          { scale: 'voltage', label: 'Voltage (V)', labelGap: 8, side: 3, grid: { show: true } },
          { scale: 'current', label: 'Current (A)', labelGap: 8, side: 1, grid: { show: false } },
          { scale: 'power', label: 'Power (W)', labelGap: 8, side: 3, grid: { show: false } },
          { scale: 'pf', label: 'Power Factor', labelGap: 8, side: 1, grid: { show: false } },
          { scale: 'energy', label: 'Energy (kWh)', labelGap: 8, side: 3, grid: { show: false } }
        )
      }

      // Get container dimensions
      const chartRect = comprehensiveUplotContainer.value.getBoundingClientRect()
      const containerWidth = Math.max(chartRect.width, 400)
      const containerHeight = 400

      const opts = {
        title: `Comprehensive Sensor Data - ${comprehensiveChartType.value.charAt(0).toUpperCase() + comprehensiveChartType.value.slice(1)}`,
        width: containerWidth,
        height: containerHeight,
        series: seriesConfig,
        axes: axes,
        scales: scales
      }

      try {
        comprehensiveUplotChart.value = new uPlot(opts, seriesData, comprehensiveUplotContainer.value)
        console.log('Comprehensive uPlot chart created successfully')
      } catch (error) {
        console.error('Error creating comprehensive uPlot chart:', error)
        comprehensiveUplotChart.value = null
      }
    }

    // Cleanup uPlot charts on unmount
    onUnmounted(() => {
      if (uplotChart.value) {
        uplotChart.value.destroy()
      }
      if (comprehensiveUplotChart.value) {
        comprehensiveUplotChart.value.destroy()
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
      isUsingFallbackData,
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
      EMISSION_FACTORS,
      // Device management
      espId,
      currentDevice,
      isEditingDeviceName,
      editingDeviceName,
      isSavingDeviceName,
      deviceNameInput,
      startEditingDeviceName,
      cancelEditingDeviceName,
      saveDeviceName,
      // User account management
      userEmail,
      logout,
      router,
      // History tab
      startDate,
      endDate,
      dateRange,
      selectedPreset,
      isLoadingHistory,
      historicalDataFetched,
      uplotContainer,
      uplotChart,
      comprehensiveUplotContainer,
      comprehensiveUplotChart,
      comprehensiveChartType,
      totalEnergy,
      historicalTotalCO2,
      setDatePreset,
      onDateRangeChange,
      fetchHistoricalData,
      downloadCSV,
      formatEnergy,
      formatDateRange,
      createUPlotChart,
      setComprehensiveChartType,
      createComprehensiveUPlotChart,
      // Dropdown options and handlers
      datePresetOptions,
      chartTypeOptions,
      onPresetChange,
      onChartTypeChange
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  min-height: 60px;
}

.header-left h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.device-info-section {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.device-name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-name-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.device-id {
  color: #6c757d;
  font-size: 0.9rem;
  font-family: monospace;
}

.device-name-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-name-input {
  min-width: 200px;
}

.edit-btn,
.save-btn,
.cancel-btn {
  padding: 4px 8px !important;
  min-width: auto !important;
}

/* Account section styles */
.account-section {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-email {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}

.logout-btn {
  padding: 4px 8px !important;
  min-width: auto !important;
  color: #dc3545 !important;
}

.logout-btn:hover {
  background-color: #dc3545 !important;
  color: white !important;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-center {
    order: 2;
    width: 100%;
    justify-content: flex-start;
  }

  .header-right {
    order: 1;
    align-self: flex-end;
  }

  .device-info-section {
    width: 100%;
  }

  .device-name-input {
    min-width: 150px;
  }

  .user-email {
    display: none;
  }

  .account-section {
    padding: 6px 8px;
  }
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.energy-data,
.co2-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.energy-item,
.co2-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.energy-item:last-child,
.co2-item:last-child {
  border-bottom: none;
}

.energy-label,
.co2-label {
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

.energy-value,
.co2-value {
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-content {
  animation: fadeIn 0.5s ease-in;
}

.history-content {
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 100vh;
}

.history-controls {
  margin-bottom: 32px;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.date-range-section h3 {
  margin-bottom: 24px;
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-range-section h3::before {
  content: '📅';
  font-size: 1.2rem;
}

.date-controls {
  display: flex;
  flex-direction: row;
  gap: 24px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.preset-dropdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  flex: 0 0 auto;
}

.preset-dropdown label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.preset-selector {
  min-width: 200px;
}

.chart-type-dropdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 20px;
}

.chart-type-dropdown label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.chart-type-selector {
  min-width: 250px;
}

.date-pickers {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  flex: 1 1 auto;
}

.date-picker-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 300px;
  max-width: 400px;
  width: 100%;
}

.date-picker-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-picker-group label::before {
  content: '🗓️';
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  flex: 0 0 auto;
}

.action-buttons .p-button {
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
}

.action-buttons .p-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.action-buttons .p-button-success {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  border: none;
}

.action-buttons .p-button:not(.p-button-success) {
  background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%);
  border: none;
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
}

.loading-content {
  text-align: center;
  color: #666;
}

.loading-content .pi-spinner {
  color: #2196f3;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}

.loading-content p {
  margin-top: 16px;
  font-size: 1.2rem;
  font-weight: 500;
  color: #2c3e50;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.history-results {
  margin-top: 32px;
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.data-summary {
  margin-bottom: 32px;
}

.data-summary .p-card {
  border-radius: 16px;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.data-summary .p-card-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: -1.25rem -1.25rem 1.25rem -1.25rem;
  padding: 20px 24px;
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.data-summary .p-card-title::before {
  content: '📊';
  font-size: 1.4rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border-left: 4px solid #2196f3;
  transition: all 0.3s ease;
}

.summary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-left-color: #1976d2;
}

.summary-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label::before {
  content: '▶';
  color: #2196f3;
  font-size: 0.8rem;
}

.summary-value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.2rem;
  text-align: right;
}

.chart-section {
  margin-bottom: 32px;
}

.chart-section .p-card {
  border-radius: 16px;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.chart-section .p-card-title {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  margin: -1.25rem -1.25rem 1.25rem -1.25rem;
  padding: 20px 24px;
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-section .p-card-title::before {
  content: '📈';
  font-size: 1.4rem;
}

.uplot-container {
  width: 100%;
  height: 450px;
  margin: 20px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.chart-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}

.chart-loading p {
  margin-top: 10px;
  font-size: 14px;
}

.no-data-section {
  margin-top: 32px;
}

.no-data-section .p-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px dashed #dee2e6;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.no-data-content {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.no-data-content .pi-info-circle {
  color: #17a2b8 !important;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-10px);
  }

  60% {
    transform: translateY(-5px);
  }
}

.no-data-content h3 {
  margin: 20px 0 16px 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.no-data-content p {
  font-size: 1.1rem;
  margin: 0;
  color: #6c757d;
  line-height: 1.6;
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

  /* History tab mobile optimizations */
  .history-content {
    padding: 16px;
  }

  .history-controls {
    padding: 20px;
    margin-bottom: 24px;
  }

  .date-range-section h3 {
    font-size: 1.2rem;
    text-align: center;
  }

  .preset-dropdown {
    padding: 12px;
  }

  .preset-selector {
    min-width: 100%;
  }

  .chart-type-dropdown {
    padding: 12px;
  }

  .chart-type-selector {
    min-width: 100%;
  }

  .date-pickers {
    padding: 16px;
  }

  .date-picker-group {
    min-width: 100%;
    max-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons .p-button {
    width: 100%;
    justify-content: center;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .summary-item {
    padding: 12px 16px;
  }

  .summary-label {
    font-size: 0.9rem;
  }

  .summary-value {
    font-size: 1.1rem;
  }

  .uplot-container {
    height: 300px;
  }

  .data-summary .p-card-title,
  .chart-section .p-card-title {
    font-size: 1.1rem;
    padding: 16px 20px;
  }

  .loading-section {
    padding: 40px 16px;
  }

  .no-data-content {
    padding: 40px 16px;
  }
}

@media (max-width: 480px) {
  .history-content {
    padding: 12px;
  }

  .history-controls {
    padding: 16px;
  }

  .date-range-section h3 {
    font-size: 1.1rem;
  }

  .preset-selector,
  .chart-type-selector {
    font-size: 0.9rem;
  }

  .summary-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .summary-value {
    text-align: center;
  }

  .uplot-container {
    height: 250px;
  }
}



/* Input field styling */
:deep(.p-inputtext) {
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

:deep(.p-inputtext:focus) {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  outline: none;
}

:deep(.p-inputtext:hover) {
  border-color: #90caf9;
}

/* Icon styling */
:deep(.p-datepicker-trigger) {
  color: #6c757d;
  margin-left: 8px;
  transition: color 0.3s ease;
}

:deep(.p-datepicker-trigger:hover) {
  color: #2196f3;
}
</style>