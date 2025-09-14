<template>
  <div class="energy-chart">
    <!-- Chart Section -->
    <div class="chart-section">
      <h4>Monthly Energy Consumption & CO2 Emissions</h4>
      
      <!-- Controls Row -->
      <div class="controls-row">
        <div class="date-picker-container">
          <label for="year-picker">Select Year:</label>
          <input 
            id="year-picker"
            type="number" 
            v-model="selectedYear" 
            class="year-picker"
            :min="2020"
            :max="new Date().getFullYear()"
          />
        </div>
        <button @click="downloadCSV" class="download-btn">
          📥 Download CSV
        </button>
      </div>
      
      <!-- 2-Column Layout -->
      <div class="two-column-layout">
        <!-- First Column: Summary Cards -->
        <div class="summary-column">
          <div class="summary-item">
            <h5>Monthly Energy Consumption</h5>
            <span class="value">{{ totalEnergy.toFixed(2) }} kWh</span>
          </div>
          <div class="summary-item">
            <h5>Monthly CO2 Emissions</h5>
            <span class="value">{{ totalCO2.toFixed(2) }} kg CO2</span>
          </div>
        </div>
        <!-- Second Column: Pie Chart -->
        <div class="pie-chart-column">
          <div class="pie-chart-container">
            <h5>Monthly Energy vs CO2 Emissions</h5>
            <div class="pie-chart">
              <Pie v-if="monthlyEnergyData.length > 0" :data="pieChartData" :options="pieChartOptions" />
              <div v-else class="no-data-message">
                <p>No data for pie chart</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <Bar v-if="monthlyEnergyData.length > 0" :data="chartData" :options="chartOptions" />
        <div v-else class="no-data-message">
          <p>No monthly data available for chart display.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import Card from 'primevue/card'
import { Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { calculateCO2Emissions, formatCO2 } from '@/services/co2Calculator.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default {
  name: 'MonthlyEnergyChart',
  components: {
    Card,
    Bar,
    Pie
  },
  emits: ['year-changed'],
  props: {
    monthlyEnergyData: {
      type: Array,
      default: () => []
    },
    emissionFactor: {
      type: Number,
      default: 0.5
    }
  },
  setup(props, { emit }) {
    // Reactive data
    const selectedYear = ref(new Date().getFullYear()) // Current year
    
    // Watch for year changes and emit event to parent
    watch(selectedYear, (newYear) => {
      emit('year-changed', newYear)
    })
    
    // Calculate totals
    const totalEnergy = computed(() => {
      return props.monthlyEnergyData.reduce((sum, item) => sum + (item.energy || 0), 0)
    })

    const totalCO2 = computed(() => {
      return props.monthlyEnergyData.reduce((sum, item) => {
        const co2 = item.co2 || calculateCO2Emissions(item.energy || 0, props.emissionFactor)
        return sum + co2
      }, 0)
    })
    
    // CSV Download function
    const downloadCSV = () => {
      if (!props.monthlyEnergyData.length) {
        alert('No data available to download')
        return
      }
      
      const headers = ['Month', 'Energy (kWh)', 'CO2 Emissions (kg)']
      const csvContent = [
        headers.join(','),
        ...props.monthlyEnergyData.map(item => [
          item.month,
          item.energy.toFixed(2),
          item.co2.toFixed(2)
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `monthly-energy-data-${selectedYear.value}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // Chart data computation
    const chartData = computed(() => {
      if (!props.monthlyEnergyData.length) {
        return {
          labels: [],
          datasets: []
        }
      }

      return {
        labels: props.monthlyEnergyData.map(item => item.month),
        datasets: [
          {
            label: 'Energy Consumption (kWh)',
            backgroundColor: '#42A5F5',
            borderColor: '#1E88E5',
            borderWidth: 1,
            data: props.monthlyEnergyData.map(item => item.energy)
          },
          {
            label: 'CO2 Emissions (kg)',
            backgroundColor: '#FF7043',
            borderColor: '#F4511E',
            borderWidth: 1,
            data: props.monthlyEnergyData.map(item => item.co2)
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
            // text: 'Monthly Energy Consumption & CO2 Emissions (Year View)'
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
              text: 'Month'
            },
            ticks: {
              maxTicksLimit: 12,
              callback: function (value, index) {
                return this.getLabelForValue(value)
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

    // Pie chart data for Total Energy vs Total CO2 Emissions
    const pieChartData = computed(() => {
      if (!props.monthlyEnergyData.length) {
        return {
          labels: [],
          datasets: []
        }
      }

      return {
        labels: ['Total Energy (kWh)', 'Total CO2 Emissions (kg)'],
        datasets: [
          {
            label: 'Energy vs CO2',
            data: [totalEnergy.value, totalCO2.value],
            backgroundColor: ['#42A5F5', '#FF7043'],
            borderColor: ['#1E88E5', '#F4511E'],
            borderWidth: 2
          }
        ]
      }
    })

    const pieChartOptions = computed(() => {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                const unit = context.label.includes('Energy') ? 'kWh' : 'kg CO2'
                return `${context.label}: ${value.toFixed(2)} ${unit} (${percentage}%)`
              }
            }
          }
        }
      }
    })

    return {
      selectedYear,
      totalEnergy,
      totalCO2,
      chartData,
      chartOptions,
      pieChartData,
      pieChartOptions,
      downloadCSV
    }
  }
}
</script>

<style scoped>
.energy-chart {
  padding: 1rem;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 1rem;
}

.date-picker-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-picker-container label {
  font-weight: 500;
  color: #2c3e50;
}

.year-picker {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 80px;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #42A5F5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.download-btn:hover {
  background: #1E88E5;
}

.two-column-layout {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: stretch;
}

.summary-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.pie-chart-column {
  flex: 1;
  display: flex;
  align-items: center;
}

.summary-item {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex: 1;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-column .summary-item:first-child {
  background: #42A5F5;
  color: white;
}

.summary-column .summary-item:last-child {
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

.pie-chart-container {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.pie-chart-container h5 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-weight: 500;
}

.pie-chart {
  height: 200px;
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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
  .controls-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .date-picker-container {
    justify-content: center;
  }
  
  .download-btn {
    justify-content: center;
  }
  
  .two-column-layout {
    flex-direction: column;
    gap: 1rem;
  }

  .summary-column {
    gap: 0.5rem;
  }

  .summary-item {
    min-width: auto;
  }

  .pie-chart-container {
    min-width: auto;
    min-height: 250px;
  }

  .pie-chart {
    height: 150px;
  }

  .chart-container {
    height: 300px;
  }
}
</style>