# CO2 Calculator Service

A comprehensive utility service for calculating CO2 emissions from energy consumption in the Carbon Footprint IoT Project.

## Overview

The CO2 Calculator service provides a set of global functions for calculating, formatting, and analyzing CO2 emissions based on energy consumption data. It includes emission factors for different regions and energy sources, as well as utility functions for converting CO2 values into meaningful equivalents.

## Installation

The service is already integrated into the project. Simply import the functions you need:

```javascript
import { 
  calculateCO2Emissions, 
  formatCO2, 
  getCO2Equivalents,
  EMISSION_FACTORS 
} from '@/services/co2Calculator.js'
```

## Available Functions

### Core Calculation Functions

#### `calculateCO2Emissions(energyKWh, emissionFactor)`
Calculates CO2 emissions from energy consumption.

**Parameters:**
- `energyKWh` (number): Energy consumption in kWh
- `emissionFactor` (number, optional): Emission factor in kg CO2/kWh (defaults to 0.5)

**Returns:** CO2 emissions in kg

**Example:**
```javascript
const co2 = calculateCO2Emissions(100, 0.5216) // 52.16 kg CO2
```

#### `calculateDailyCO2(dailyEnergyKWh, emissionFactor)`
Calculates daily CO2 emissions (alias for calculateCO2Emissions).

#### `calculateMonthlyCO2(dailyDataArray, emissionFactor)`
Calculates monthly CO2 emissions from an array of daily energy data.

**Parameters:**
- `dailyDataArray` (Array): Array of objects with energy property
- `emissionFactor` (number, optional): Emission factor

**Example:**
```javascript
const dailyData = [
  { energy: 10.5 },
  { energy: 12.3 },
  { energy: 9.8 }
]
const monthlyCO2 = calculateMonthlyCO2(dailyData, EMISSION_FACTORS.THAILAND)
```

#### `calculateThreePhaseCO2(phaseData, timeHours, emissionFactor)`
Calculates CO2 emissions for three-phase power systems.

**Parameters:**
- `phaseData` (Object): Object with Pa, Pb, Pc properties (in watts)
- `timeHours` (number): Time duration in hours
- `emissionFactor` (number, optional): Emission factor

**Returns:** Object with phase-wise and total CO2 emissions

**Example:**
```javascript
const phaseCO2 = calculateThreePhaseCO2(
  { Pa: 1000, Pb: 1200, Pc: 800 }, // watts
  1, // 1 hour
  EMISSION_FACTORS.THAILAND
)
// Returns: { phaseA: 0.52, phaseB: 0.63, phaseC: 0.42, total: 1.57, totalPowerKW: 3 }
```

### Formatting Functions

#### `formatCO2(co2Value, decimals, includeUnit)`
Formats CO2 values for display with appropriate units.

**Parameters:**
- `co2Value` (number): CO2 value in kg
- `decimals` (number, optional): Number of decimal places (default: 3)
- `includeUnit` (boolean, optional): Whether to include unit (default: true)

**Example:**
```javascript
formatCO2(1234.567) // "1.235 tonnes CO2"
formatCO2(0.123, 2) // "0.12 kg CO2"
formatCO2(0.123, 2, false) // "0.12"
```

### Utility Functions

#### `getCO2Equivalents(co2Kg)`
Converts CO2 emissions to environmental equivalents for better understanding.

**Returns:** Object with equivalent values

**Example:**
```javascript
const equivalents = getCO2Equivalents(100) // 100 kg CO2
// Returns:
// {
//   trees: 5,           // Trees needed to absorb this CO2 in a year
//   carMiles: 248,      // Equivalent car miles
//   carKm: 399,         // Equivalent car kilometers
//   flights: "0.40"     // Equivalent short flights
// }
```

#### `calculateCO2Reduction(currentCO2, previousCO2)`
Calculates CO2 reduction percentage and absolute values.

**Example:**
```javascript
const reduction = calculateCO2Reduction(80, 100)
// Returns: { percentage: 20, absolute: 20, isReduction: true }
```

#### `getEmissionFactor(region)`
Gets emission factor by region or country code.

**Example:**
```javascript
const factor = getEmissionFactor('THAILAND') // 0.5216
const defaultFactor = getEmissionFactor('UNKNOWN') // 0.5 (default)
```

#### `calculateRealTimeCO2Rate(currentPowerW, emissionFactor)`
Calculates real-time CO2 emission rate from current power consumption.

**Example:**
```javascript
const co2Rate = calculateRealTimeCO2Rate(3000, EMISSION_FACTORS.THAILAND) // 1.565 kg CO2/hour
```

## Emission Factors

The service includes predefined emission factors for various regions and energy sources:

### Regional Factors (kg CO2/kWh)
- `THAILAND`: 0.5216
- `GLOBAL_AVERAGE`: 0.475
- `USA`: 0.386
- `EU`: 0.276
- `CHINA`: 0.681
- `INDIA`: 0.708

### Energy Source Factors (kg CO2/kWh)
- `COAL`: 0.820
- `NATURAL_GAS`: 0.490
- `SOLAR`: 0.041
- `WIND`: 0.011
- `HYDRO`: 0.024
- `NUCLEAR`: 0.012

**Example:**
```javascript
import { EMISSION_FACTORS } from '@/services/co2Calculator.js'

const thailandFactor = EMISSION_FACTORS.THAILAND
const solarFactor = EMISSION_FACTORS.SOLAR
```

## Usage Examples

### Basic CO2 Calculation
```javascript
import { calculateCO2Emissions, EMISSION_FACTORS } from '@/services/co2Calculator.js'

// Calculate CO2 from 50 kWh using Thailand's grid factor
const co2 = calculateCO2Emissions(50, EMISSION_FACTORS.THAILAND)
console.log(`CO2 Emissions: ${co2} kg`) // CO2 Emissions: 26.08 kg
```

### Vue Component Integration
```javascript
// In a Vue component
import { ref, computed } from 'vue'
import { calculateCO2Emissions, formatCO2, getCO2Equivalents } from '@/services/co2Calculator.js'

export default {
  setup() {
    const energy = ref(100)
    const emissionFactor = ref(0.5216)
    
    const co2Emissions = computed(() => {
      return calculateCO2Emissions(energy.value, emissionFactor.value)
    })
    
    const formattedCO2 = computed(() => {
      return formatCO2(co2Emissions.value)
    })
    
    const equivalents = computed(() => {
      return getCO2Equivalents(co2Emissions.value)
    })
    
    return {
      energy,
      co2Emissions,
      formattedCO2,
      equivalents
    }
  }
}
```

### Three-Phase Power Monitoring
```javascript
import { calculateThreePhaseCO2, EMISSION_FACTORS } from '@/services/co2Calculator.js'

// Real-time three-phase power data (in watts)
const phaseData = {
  Pa: 1500, // Phase A: 1.5 kW
  Pb: 1200, // Phase B: 1.2 kW
  Pc: 1800  // Phase C: 1.8 kW
}

// Calculate CO2 for 1 hour of operation
const phaseCO2 = calculateThreePhaseCO2(phaseData, 1, EMISSION_FACTORS.THAILAND)

console.log('Phase A CO2:', phaseCO2.phaseA, 'kg')
console.log('Phase B CO2:', phaseCO2.phaseB, 'kg')
console.log('Phase C CO2:', phaseCO2.phaseC, 'kg')
console.log('Total CO2:', phaseCO2.total, 'kg')
console.log('Total Power:', phaseCO2.totalPowerKW, 'kW')
```

### Dashboard Integration
```javascript
// In DashboardView.vue
import { 
  calculateCO2Emissions, 
  calculateThreePhaseCO2, 
  formatCO2, 
  getCO2Equivalents,
  EMISSION_FACTORS 
} from '@/services/co2Calculator.js'

// Use in computed properties
const totalCO2 = computed(() => {
  return calculateCO2Emissions(sensorData.value.Et || 0, EMISSION_FACTORS.THAILAND)
})

const phaseCO2Data = computed(() => {
  return calculateThreePhaseCO2(
    {
      Pa: sensorData.value.Pa || 0,
      Pb: sensorData.value.Pb || 0,
      Pc: sensorData.value.Pc || 0
    },
    1, // 1 hour for rate calculation
    EMISSION_FACTORS.THAILAND
  )
})
```

## Best Practices

1. **Always validate input data** before passing to calculation functions
2. **Use appropriate emission factors** for your region or energy source
3. **Format CO2 values** for display using the `formatCO2` function
4. **Provide context** with CO2 equivalents for better user understanding
5. **Handle edge cases** like zero or negative values appropriately

## Error Handling

All functions include built-in error handling:
- Invalid inputs return 0 or safe default values
- Warning messages are logged to console for debugging
- Functions are designed to be fail-safe and not break the application

## Contributing

To add new emission factors or calculation methods:
1. Update the `EMISSION_FACTORS` object with new values
2. Add new calculation functions following the existing pattern
3. Include proper JSDoc documentation
4. Add examples to this README

## References

- [GHG Protocol](https://ghgprotocol.org/) - Greenhouse Gas Protocol standards
- [IEA Emission Factors](https://www.iea.org/) - International Energy Agency emission factors
- [Thailand Grid Emission Factor](https://www.tgo.or.th/) - Thailand Greenhouse Gas Management Organization