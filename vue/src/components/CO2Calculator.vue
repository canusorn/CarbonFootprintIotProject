<template>
  <Card class="co2-calculator-card">
    <template #title>
      <div class="calculator-header">
        <i class="pi pi-calculator" style="color: #27ae60;"></i>
        <span>CO2 Calculator</span>
      </div>
    </template>
    <template #content>
      <div class="calculator-content">
        <!-- Input Section -->
        <div class="input-section">
          <div class="input-group">
            <label for="energy-input">Energy Consumption (kWh):</label>
            <InputNumber 
              id="energy-input"
              v-model="energyInput" 
              :min="0" 
              :max-fraction-digits="3"
              placeholder="Enter energy in kWh"
            />
          </div>
          
          <div class="input-group">
            <label for="region-select">Region/Country:</label>
            <Dropdown 
              id="region-select"
              v-model="selectedRegion" 
              :options="regionOptions" 
              option-label="label" 
              option-value="value"
              placeholder="Select region"
            />
          </div>
        </div>

        <!-- Results Section -->
        <div class="results-section" v-if="energyInput > 0">
          <h4>CO2 Emission Results</h4>
          
          <div class="result-grid">
            <div class="result-item">
              <span class="result-label">CO2 Emissions:</span>
              <span class="result-value primary">{{ formatCO2(calculatedCO2) }}</span>
            </div>
            
            <div class="result-item">
              <span class="result-label">Emission Factor:</span>
              <span class="result-value">{{ currentEmissionFactor }} kg CO2/kWh</span>
            </div>
          </div>

          <!-- CO2 Equivalents -->
          <div class="equivalents-section">
            <h5>Environmental Impact Equivalents</h5>
            <div class="equivalents-grid">
              <div class="equivalent-item">
                <i class="pi pi-sun" style="color: #27ae60;"></i>
                <span class="equiv-label">Trees needed (1 year):</span>
                <span class="equiv-value">{{ equivalents.trees }} trees</span>
              </div>
              
              <div class="equivalent-item">
                <i class="pi pi-car" style="color: #e74c3c;"></i>
                <span class="equiv-label">Car driving distance:</span>
                <span class="equiv-value">{{ equivalents.carKm }} km</span>
              </div>
              
              <div class="equivalent-item">
                <i class="pi pi-send" style="color: #3498db;"></i>
                <span class="equiv-label">Flight equivalent:</span>
                <span class="equiv-value">{{ equivalents.flights }} flights</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Calculation Buttons -->
        <div class="quick-calc-section">
          <h5>Quick Calculations</h5>
          <div class="quick-buttons">
            <Button 
              @click="calculateQuick(1)" 
              size="small" 
              outlined
              label="1 kWh"
            />
            <Button 
              @click="calculateQuick(10)" 
              size="small" 
              outlined
              label="10 kWh"
            />
            <Button 
              @click="calculateQuick(100)" 
              size="small" 
              outlined
              label="100 kWh"
            />
            <Button 
              @click="calculateQuick(1000)" 
              size="small" 
              outlined
              label="1000 kWh"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script>
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { 
  calculateCO2Emissions, 
  formatCO2, 
  getCO2Equivalents,
  getEmissionFactor,
  EMISSION_FACTORS 
} from '@/services/co2Calculator.js'

export default {
  name: 'CO2Calculator',
  components: {
    Card,
    InputNumber,
    Dropdown,
    Button
  },
  setup() {
    const energyInput = ref(0)
    const selectedRegion = ref('THAILAND')
    
    // Region options for dropdown
    const regionOptions = ref([
      { label: 'Thailand', value: 'THAILAND' },
      { label: 'Global Average', value: 'GLOBAL_AVERAGE' },
      { label: 'United States', value: 'USA' },
      { label: 'European Union', value: 'EU' },
      { label: 'China', value: 'CHINA' },
      { label: 'India', value: 'INDIA' },
      { label: 'Coal Power', value: 'COAL' },
      { label: 'Natural Gas', value: 'NATURAL_GAS' },
      { label: 'Solar Power', value: 'SOLAR' },
      { label: 'Wind Power', value: 'WIND' },
      { label: 'Hydro Power', value: 'HYDRO' },
      { label: 'Nuclear Power', value: 'NUCLEAR' }
    ])
    
    // Computed properties
    const currentEmissionFactor = computed(() => {
      return getEmissionFactor(selectedRegion.value)
    })
    
    const calculatedCO2 = computed(() => {
      return calculateCO2Emissions(energyInput.value, currentEmissionFactor.value)
    })
    
    const equivalents = computed(() => {
      return getCO2Equivalents(calculatedCO2.value)
    })
    
    // Methods
    const calculateQuick = (energy) => {
      energyInput.value = energy
    }
    
    return {
      energyInput,
      selectedRegion,
      regionOptions,
      currentEmissionFactor,
      calculatedCO2,
      equivalents,
      calculateQuick,
      formatCO2,
      EMISSION_FACTORS
    }
  }
}
</script>

<style scoped>
.co2-calculator-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-left: 4px solid #27ae60;
}

.calculator-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #2c3e50;
}

.calculator-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.results-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
}

.results-section h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.result-label {
  font-weight: 500;
  color: #666;
}

.result-value {
  font-weight: 600;
  color: #2c3e50;
}

.result-value.primary {
  color: #27ae60;
  font-size: 1.1rem;
}

.equivalents-section {
  margin-top: 20px;
}

.equivalents-section h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 1rem;
}

.equivalents-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.equivalent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 0.9rem;
}

.equiv-label {
  flex: 1;
  color: #666;
}

.equiv-value {
  font-weight: 600;
  color: #2c3e50;
}

.quick-calc-section h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 1rem;
}

.quick-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .input-section {
    flex-direction: row;
    gap: 20px;
  }
  
  .input-group {
    flex: 1;
  }
  
  .result-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .equivalents-grid {
    grid-template-columns: 1fr;
  }
}
</style>