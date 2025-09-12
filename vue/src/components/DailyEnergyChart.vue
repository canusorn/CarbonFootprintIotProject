<template>
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
    }
  },
  setup(props) {
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
            label: 'Daily Energy Consumption (kWh)',
            backgroundColor: '#42A5F5',
            borderColor: '#1E88E5',
            borderWidth: 1,
            data: props.dailyEnergyData.map(item => item.energy)
          },
          {
            label: 'Daily CO2 Emissions (kg)',
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

    return {
      chartData,
      chartOptions
    }
  }
}
</script>

<style scoped>
.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 30px;
}

.chart-container {
  height: 400px;
  position: relative;
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #666;
  font-style: italic;
}

.no-data-message p {
  margin: 0;
  font-size: 1.1rem;
}
</style>