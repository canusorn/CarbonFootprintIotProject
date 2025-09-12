<template>
  <div class="energy-chart">


    <!-- Chart Section -->
    <div class="chart-section">
      <h4>Daily Energy Consumption & CO2 Emissions</h4>
      <!-- Summary Cards -->
      <div class="summary-row">
        <div class="summary-item">
          <h5>Total Energy</h5>
          <span class="value">{{ totalEnergy.toFixed(2) }} kWh</span>
        </div>
        <div class="summary-item">
          <h5>Total CO2 Emissions</h5>
          <span class="value">{{ totalCO2.toFixed(2) }} kg CO2</span>
        </div>
      </div>
      <div class="chart-container">
        <Bar v-if="dailyEnergyData.length > 0" :data="chartData" :options="chartOptions" />
        <div v-else class="no-data-message">
          <p>No historical data available for chart display.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import Card from 'primevue/card'
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
  name: 'DailyEnergyChart',
  components: {
    Card,
    Bar
  },
  props: {
    dailyEnergyData: {
      type: Array,
      default: () => []
    },
    emissionFactor: {
      type: Number,
      default: 0.5
    }
  },
  setup(props) {
    // Calculate totals
    const totalEnergy = computed(() => {
      return props.dailyEnergyData.reduce((sum, item) => sum + (item.energy || 0), 0)
    })

    const totalCO2 = computed(() => {
      return props.dailyEnergyData.reduce((sum, item) => sum + (item.co2 || item.energy * props.emissionFactor || 0), 0)
    })
    // Chart data computation
    const chartData = computed(() => {
      if (!props.dailyEnergyData.length) {
        return {
          labels: [],
          datasets: []
        }
      }

      return {
        labels: props.dailyEnergyData.map(item => item.date),
        datasets: [
          {
            label: 'Energy Consumption (kWh)',
            backgroundColor: '#42A5F5',
            borderColor: '#1E88E5',
            borderWidth: 1,
            data: props.dailyEnergyData.map(item => item.energy)
          },
          {
            label: 'CO2 Emissions (kg)',
            backgroundColor: '#FF7043',
            borderColor: '#F4511E',
            borderWidth: 1,
            data: props.dailyEnergyData.map(item => item.co2)
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
            // display: true,
            // text: 'Daily Energy Consumption & CO2 Emissions (Last 30 Days)'
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
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
              callback: function (value) {
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
              callback: function (value, index) {
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

    return {
      totalEnergy,
      totalCO2,
      chartData,
      chartOptions
    }
  }
}
</script>

<style scoped>
.energy-chart {
  padding: 1rem;
}

.summary-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: space-between;
}

.summary-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex: 1;
}

.summary-item:first-child {
  background: #42A5F5;
  color: white;
}

.summary-item:last-child {
  background: #FF7043;
  color: white;
}

.summary-item h5 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-weight: 500;
}

.summary-item .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.chart-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-section h4 {
  margin: 0 0 1rem 0;
  text-align: center;
  color: #2c3e50;
}

.chart-container {
  height: 400px;
  position: relative;
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #7f8c8d;
  font-style: italic;
}

@media (max-width: 768px) {
  .summary-row {
    flex-direction: column;
    gap: 1rem;
  }

  .summary-item {
    min-width: auto;
  }

  .chart-container {
    height: 300px;
  }
}
</style>