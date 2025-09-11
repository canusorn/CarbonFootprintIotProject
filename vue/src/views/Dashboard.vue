<template>
  <div class="dashboard-container">
    <!-- Header -->
    <div class="header p-3 bg-white shadow-1 mb-3">
      <div class="flex align-items-center justify-content-between">
        <div class="flex align-items-center">
          <i class="pi pi-bolt text-2xl text-green-500 mr-2"></i>
          <h1 class="text-2xl font-bold text-900 m-0">Carbon Footprint Dashboard</h1>
        </div>
        <div class="flex align-items-center gap-3">
          <Tag :value="connectionStatus" :severity="connectionSeverity" />
          <span class="text-sm text-600">{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="grid p-3">
      <!-- Total Emission Card -->
      <div class="col-12 md:col-3">
        <Card class="h-full">
          <template #content>
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600 mb-2">{{ totalEmission.toFixed(1) }}K</div>
              <div class="text-sm text-600 mb-2">Total Emission (gCO2e)</div>
              <div class="flex align-items-center justify-content-center gap-2">
                <Tag value="0%" severity="success" class="text-xs" />
                <span class="text-xs text-600">vs Prev</span>
              </div>
              <Divider class="my-3" />
              <div class="grid">
                <div class="col-4 text-center">
                  <div class="text-lg font-bold text-700">{{ phases.phase1.toFixed(0) }}</div>
                  <div class="text-xs text-600">Phase 1</div>
                </div>
                <div class="col-4 text-center">
                  <div class="text-lg font-bold text-700">{{ phases.phase2.toFixed(0) }}</div>
                  <div class="text-xs text-600">Phase 2</div>
                </div>
                <div class="col-4 text-center">
                  <div class="text-lg font-bold text-700">{{ phases.phase3.toFixed(0) }}</div>
                  <div class="text-xs text-600">Phase 3</div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Scope 1 Emissions -->
      <div class="col-12 md:col-3">
        <Card class="h-full bg-blue-50">
          <template #content>
            <div class="text-center">
              <div class="text-600 text-sm mb-1">Scope 1 Emissions</div>
              <div class="text-3xl font-bold text-blue-600 mb-2">{{ scope1Emissions.toFixed(1) }}K</div>
              <div class="text-sm text-600 mb-2">of Tons</div>
              <div class="flex align-items-center justify-content-center gap-2">
                <Tag value="0%" severity="info" class="text-xs" />
                <span class="text-xs text-600">vs Prev</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Scope 2 Emissions -->
      <div class="col-12 md:col-3">
        <Card class="h-full bg-orange-50">
          <template #content>
            <div class="text-center">
              <div class="text-600 text-sm mb-1">Scope 2 Emissions</div>
              <div class="text-3xl font-bold text-orange-600 mb-2">{{ scope2Emissions.toFixed(1) }}K</div>
              <div class="text-sm text-600 mb-2">of Tons</div>
              <div class="flex align-items-center justify-content-center gap-2">
                <Tag value="0%" severity="warning" class="text-xs" />
                <span class="text-xs text-600">vs Prev</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Scope 3 Emissions -->
      <div class="col-12 md:col-3">
        <Card class="h-full bg-green-50">
          <template #content>
            <div class="text-center">
              <div class="text-600 text-sm mb-1">Scope 3 Emissions</div>
              <div class="text-3xl font-bold text-green-600 mb-2">{{ scope3Emissions.toFixed(1) }}K</div>
              <div class="text-sm text-600 mb-2">of Tons</div>
              <div class="flex align-items-center justify-content-center gap-2">
                <Tag value="0%" severity="success" class="text-xs" />
                <span class="text-xs text-600">vs Prev</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid p-3">
      <!-- Emission by Source Pie Chart -->
      <div class="col-12 md:col-4">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Top Carbon Emission by Source</span>
              <i class="pi pi-chart-pie text-500"></i>
            </div>
          </template>
          <template #content>
            <Chart type="doughnut" :data="pieChartData" :options="pieChartOptions" class="w-full h-20rem" />
          </template>
        </Card>
      </div>

      <!-- Real-time Energy Consumption -->
      <div class="col-12 md:col-8">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Real-time Energy Consumption</span>
              <i class="pi pi-chart-line text-500"></i>
            </div>
          </template>
          <template #content>
            <Chart type="line" :data="lineChartData" :options="lineChartOptions" class="w-full h-20rem" />
          </template>
        </Card>
      </div>
    </div>

    <!-- Additional Charts -->
    <div class="grid p-3">
      <!-- Carbon Emission by Branch -->
      <div class="col-12 md:col-6">
        <Card>
          <template #title>Top Carbon Emission by Branch</template>
          <template #content>
            <Chart type="bar" :data="branchChartData" :options="branchChartOptions" class="w-full h-20rem" />
          </template>
        </Card>
      </div>

      <!-- Carbon Emission by Activity -->
      <div class="col-12 md:col-6">
        <Card>
          <template #title>Top Carbon Emission by Activity</template>
          <template #content>
            <Chart type="bar" :data="activityChartData" :options="activityChartOptions" class="w-full h-20rem" />
          </template>
        </Card>
      </div>
    </div>

    <!-- Historical Data -->
    <div class="grid p-3">
      <div class="col-12">
        <Card>
          <template #title>CO2 Emission Trend</template>
          <template #content>
            <Chart type="bar" :data="historicalChartData" :options="historicalChartOptions" class="w-full h-25rem" />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { EnergyService } from '../services/EnergyService'
import { MqttService } from '../services/MqttService'

export default {
  name: 'Dashboard',
  setup() {
    // Reactive data
    const totalEmission = ref(860)
    const scope1Emissions = ref(35.4)
    const scope2Emissions = ref(449.6)
    const scope3Emissions = ref(409.2)
    const connectionStatus = ref('Connected')
    const connectionSeverity = ref('success')
    const currentTime = ref(new Date().toLocaleString())

    const phases = ref({
      phase1: 286.7,
      phase2: 287.3,
      phase3: 286.0
    })

    // Chart data
    const pieChartData = ref({
      labels: ['Scope 1', 'Scope 2', 'Scope 3'],
      datasets: [{
        data: [35.4, 449.6, 409.2],
        backgroundColor: ['#4ade80', '#60a5fa', '#f59e0b'],
        borderWidth: 0
      }]
    })

    const pieChartOptions = ref({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    })

    const lineChartData = ref({
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      datasets: [{
        label: 'Phase 1',
        data: [285, 275, 290, 286, 288, 283, 287],
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        tension: 0.4
      }, {
        label: 'Phase 2',
        data: [287, 277, 292, 288, 290, 285, 289],
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        tension: 0.4
      }, {
        label: 'Phase 3',
        data: [286, 276, 291, 287, 289, 284, 288],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }]
    })

    const lineChartOptions = ref({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Energy (kWh)'
          }
        }
      }
    })

    const branchChartData = ref({
      labels: ['Bangkok', 'Chiang Mai', 'Phuket', 'Khon Kaen', 'Rayong'],
      datasets: [{
        label: 'CO2 Emission (tons)',
        data: [450, 380, 290, 250, 180],
        backgroundColor: ['#4ade80', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    })

    const branchChartOptions = ref({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    })

    const activityChartData = ref({
      labels: ['Electricity use', 'Fuel used & travelling', 'Full use for vehicles', 'Upstream & packaging of products & services', 'Waste disposal treatment'],
      datasets: [{
        label: 'CO2 Emission (tons)',
        data: [800, 600, 400, 300, 200],
        backgroundColor: '#4ade80'
      }]
    })

    const activityChartOptions = ref({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    })

    const historicalChartData = ref({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Scope 1',
        data: [120, 150, 180, 200, 180, 160, 140, 130, 150, 170, 190, 200],
        backgroundColor: '#4ade80'
      }, {
        label: 'Scope 2',
        data: [200, 250, 300, 350, 300, 280, 260, 240, 280, 320, 340, 360],
        backgroundColor: '#60a5fa'
      }, {
        label: 'Scope 3',
        data: [180, 220, 260, 300, 280, 250, 230, 210, 240, 270, 290, 310],
        backgroundColor: '#f59e0b'
      }]
    })

    const historicalChartOptions = ref({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'CO2 Emission (tons)'
          }
        }
      }
    })

    // Services
    const energyService = new EnergyService()
    const mqttService = new MqttService()

    let timeInterval

    // Methods
    const updateTime = () => {
      currentTime.value = new Date().toLocaleString()
    }

    const updateRealTimeData = (data) => {
      if (data.phases) {
        phases.value = { ...data.phases } // Create new object to avoid mutation
        const total = data.phases.phase1 + data.phases.phase2 + data.phases.phase3
        totalEmission.value = total * 0.5 // Emission factor
        
        // Update scope emissions based on energy consumption
        scope1Emissions.value = total * 0.04 // 4% of total
        scope2Emissions.value = total * 0.52 // 52% of total (grid electricity)
        scope3Emissions.value = total * 0.44 // 44% of total (upstream)
      }
    }

    // Lifecycle
    onMounted(async () => {
      // Start time updates
      timeInterval = setInterval(updateTime, 1000)

      // Initialize MQTT connection with demo data fallback
      try {
        await mqttService.connect()
        mqttService.subscribe('energy/phases', updateRealTimeData)
        connectionStatus.value = 'Connected'
        connectionSeverity.value = 'success'
      } catch (error) {
        console.warn('MQTT connection failed, using static demo data:', error)
        connectionStatus.value = 'Demo Mode'
        connectionSeverity.value = 'info'
      }

      // Load initial demo data
      const demoData = {
        phases: {
          phase1: 286.7,
          phase2: 287.3,
          phase3: 286.0
        }
      }
      updateRealTimeData(demoData)
    })

    onUnmounted(() => {
      if (timeInterval) {
        clearInterval(timeInterval)
      }
      mqttService.disconnect()
    })

    return {
      totalEmission,
      scope1Emissions,
      scope2Emissions,
      scope3Emissions,
      phases,
      connectionStatus,
      connectionSeverity,
      currentTime,
      pieChartData,
      pieChartOptions,
      lineChartData,
      lineChartOptions,
      branchChartData,
      branchChartOptions,
      activityChartData,
      activityChartOptions,
      historicalChartData,
      historicalChartOptions
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.p-card {
  height: 100%;
}

.p-card .p-card-content {
  padding: 1rem;
}

.shadow-1 {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>