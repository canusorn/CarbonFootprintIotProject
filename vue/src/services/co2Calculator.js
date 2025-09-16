/**
 * CO2 Emission Calculator Utility
 * Global functions for calculating CO2 emissions from energy consumption
 * Compliant with Carbon Footprint IoT Project Rules
 */

// Standard emission factors (kg CO2 per kWh) by region/source
export const EMISSION_FACTORS = {
  // Global averages
  GLOBAL_AVERAGE: 0.475,
  
  // Regional factors (Thailand as primary focus per project rules)
  THAILAND: 0.5216, // Thailand's grid emission factor (primary)
  USA: 0.386,
  EU: 0.276,
  CHINA: 0.681,
  INDIA: 0.708,
  
  // Energy source specific
  COAL: 0.820,
  NATURAL_GAS: 0.490,
  SOLAR: 0.041,
  WIND: 0.011,
  HYDRO: 0.024,
  NUCLEAR: 0.012,
  
  // Default factor used in the application (Thailand as per project focus)
  DEFAULT: 0.5216
}

// CO2 calculation scopes based on GHG Protocol
export const CO2_SCOPES = {
  SCOPE_1: 'Direct emissions from owned/controlled sources',
  SCOPE_2: 'Indirect emissions from purchased energy',
  SCOPE_3: 'All other indirect emissions in value chain'
}

/**
 * Calculate CO2 emissions from energy consumption
 * Optimized for IoT sensor data processing
 * @param {number} energyKWh - Energy consumption in kWh
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (defaults to Thailand factor)
 * @returns {number} CO2 emissions in kg
 */
export function calculateCO2Emissions(energyKWh, emissionFactor = EMISSION_FACTORS.THAILAND) {
  if (typeof energyKWh !== 'number' || energyKWh < 0) {
    console.warn('Invalid energy value provided:', energyKWh)
    return 0
  }
  
  if (typeof emissionFactor !== 'number' || emissionFactor < 0) {
    console.warn('Invalid emission factor provided:', emissionFactor)
    emissionFactor = EMISSION_FACTORS.THAILAND
  }
  
  return energyKWh * emissionFactor
}

/**
 * Calculate daily CO2 emissions from energy data
 * Optimized for daily energy aggregation in IoT systems
 * @param {number} dailyEnergyKWh - Daily energy consumption in kWh
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (defaults to Thailand factor)
 * @returns {number} Daily CO2 emissions in kg
 */
export function calculateDailyCO2(dailyEnergyKWh, emissionFactor = EMISSION_FACTORS.THAILAND) {
  return calculateCO2Emissions(dailyEnergyKWh, emissionFactor)
}

/**
 * Calculate monthly CO2 emissions from daily data array
 * Optimized for time-series data aggregation from IoT devices
 * @param {Array} dailyDataArray - Array of daily energy data objects
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (defaults to Thailand factor)
 * @returns {number} Monthly CO2 emissions in kg
 */
export function calculateMonthlyCO2(dailyDataArray, emissionFactor = EMISSION_FACTORS.THAILAND) {
  if (!Array.isArray(dailyDataArray)) {
    console.warn('Invalid daily data array provided')
    return 0
  }
  
  return dailyDataArray.reduce((total, dayData) => {
    const energy = dayData.energy || dayData.todayEnergy || 0
    return total + calculateCO2Emissions(energy, emissionFactor)
  }, 0)
}

/**
 * Calculate yearly CO2 emissions from monthly data array
 * Optimized for long-term carbon footprint analysis
 * @param {Array} monthlyDataArray - Array of monthly energy data objects
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (defaults to Thailand factor)
 * @returns {number} Yearly CO2 emissions in kg
 */
export function calculateYearlyCO2(monthlyDataArray, emissionFactor = EMISSION_FACTORS.THAILAND) {
  if (!Array.isArray(monthlyDataArray)) {
    console.warn('Invalid monthly data array provided')
    return 0
  }
  
  return monthlyDataArray.reduce((total, monthData) => {
    const energy = monthData.energy || monthData.totalEnergy || 0
    return total + calculateCO2Emissions(energy, emissionFactor)
  }, 0)
}

/**
 * Calculate CO2 emissions from power consumption over time
 * Optimized for real-time IoT power monitoring
 * @param {number} powerKW - Power consumption in kW
 * @param {number} timeHours - Time duration in hours
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (defaults to Thailand factor)
 * @returns {number} CO2 emissions in kg
 */
export function calculateCO2FromPower(powerKW, timeHours, emissionFactor = EMISSION_FACTORS.THAILAND) {
  if (typeof powerKW !== 'number' || powerKW < 0) {
    console.warn('Invalid power value provided:', powerKW)
    return 0
  }
  
  if (typeof timeHours !== 'number' || timeHours < 0) {
    console.warn('Invalid time value provided:', timeHours)
    return 0
  }
  
  const energyKWh = powerKW * timeHours
  return calculateCO2Emissions(energyKWh, emissionFactor)
}

/**
 * Calculate three-phase CO2 emissions from power data
 * Optimized for three-phase electrical systems in IoT monitoring
 * @param {Object} threePhasePower - Object containing L1, L2, L3 power values in kW
 * @param {number} timeHours - Time duration in hours
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (defaults to Thailand factor)
 * @returns {Object} Object containing total and per-phase CO2 emissions in kg
 */
export function calculateThreePhaseCO2(threePhasePower, timeHours, emissionFactor = EMISSION_FACTORS.THAILAND) {
  if (!threePhasePower || typeof threePhasePower !== 'object') {
    console.warn('Invalid three-phase power data provided')
    return { total: 0, L1: 0, L2: 0, L3: 0 }
  }
  
  const L1_CO2 = calculateCO2FromPower(threePhasePower.L1 || 0, timeHours, emissionFactor)
  const L2_CO2 = calculateCO2FromPower(threePhasePower.L2 || 0, timeHours, emissionFactor)
  const L3_CO2 = calculateCO2FromPower(threePhasePower.L3 || 0, timeHours, emissionFactor)
  
  return {
    total: L1_CO2 + L2_CO2 + L3_CO2,
    L1: L1_CO2,
    L2: L2_CO2,
    L3: L3_CO2
  }
}

/**
 * Format CO2 value for display with appropriate units
 * @param {number} co2Value - CO2 value in kg
 * @param {number} decimals - Number of decimal places (default: 3)
 * @param {boolean} includeUnit - Whether to include unit (default: true)
 * @returns {string} Formatted CO2 value
 */
export function formatCO2(co2Value, decimals = 3, includeUnit = true) {
  if (typeof co2Value !== 'number' || isNaN(co2Value)) {
    return includeUnit ? '0.000 kg CO2' : '0.000'
  }
  
  let value = co2Value
  let unit = 'kg CO2'
  
  // Convert to appropriate units for better readability
  if (co2Value >= 1000000) {
    value = co2Value / 1000000
    unit = 'tonnes CO2'
    decimals = Math.min(decimals, 2)
  } else if (co2Value >= 1000) {
    value = co2Value / 1000
    unit = 'tonnes CO2'
    decimals = Math.min(decimals, 3)
  }
  
  const formatted = value.toFixed(decimals)
  return includeUnit ? `${formatted} ${unit}` : formatted
}

/**
 * Get CO2 equivalent comparisons for better understanding
 * Provides relatable comparisons for CO2 emissions in IoT dashboards
 * @param {number} co2Kg - CO2 emissions in kg
 * @returns {Object} Object containing various CO2 equivalent comparisons
 */
export function getCO2Equivalents(co2Kg) {
  if (typeof co2Kg !== 'number' || co2Kg < 0) {
    console.warn('Invalid CO2 value provided:', co2Kg)
    return {
      trees: 0,
      cars: 0,
      flights: 0,
      smartphones: 0
    }
  }
  
  // Updated equivalents based on current research (2024)
  // Source: EPA, Carbon Trust, and environmental studies
  return {
    trees: Math.round((co2Kg / 22) * 100) / 100, // Trees needed to absorb CO2 in a year
    cars: Math.round((co2Kg / 4600) * 100) / 100, // Average car emissions per year
    flights: Math.round((co2Kg / 90) * 100) / 100, // Short domestic flights
    smartphones: Math.round((co2Kg / 0.07) * 100) / 100 // Smartphone charging for a year
  }
}

/**
 * Calculate carbon footprint reduction percentage
 * @param {number} currentCO2 - Current CO2 emissions in kg
 * @param {number} previousCO2 - Previous period CO2 emissions in kg
 * @returns {Object} Reduction data with percentage and absolute values
 */
export function calculateCO2Reduction(currentCO2, previousCO2) {
  if (typeof currentCO2 !== 'number' || typeof previousCO2 !== 'number') {
    return {
      percentage: 0,
      absolute: 0,
      isReduction: false
    }
  }
  
  if (previousCO2 === 0) {
    return {
      percentage: currentCO2 > 0 ? 100 : 0,
      absolute: currentCO2,
      isReduction: false
    }
  }
  
  const absolute = previousCO2 - currentCO2
  const percentage = (absolute / previousCO2) * 100
  
  return {
    percentage: Math.abs(percentage),
    absolute: Math.abs(absolute),
    isReduction: absolute > 0
  }
}

/**
 * Get emission factor by region/country
 * @param {string} region - Region or country code
 * @returns {number} Emission factor in kg CO2/kWh
 */
export function getEmissionFactor(region = 'DEFAULT') {
  const upperRegion = region.toUpperCase()
  return EMISSION_FACTORS[upperRegion] || EMISSION_FACTORS.DEFAULT
}

/**
 * Calculate real-time CO2 rate from current power consumption
 * @param {number} currentPowerW - Current power consumption in watts
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (optional)
 * @returns {number} CO2 emission rate in kg CO2/hour
 */
export function calculateRealTimeCO2Rate(currentPowerW, emissionFactor = EMISSION_FACTORS.DEFAULT) {
  if (typeof currentPowerW !== 'number' || currentPowerW < 0) {
    return 0
  }
  
  const powerKW = currentPowerW / 1000
  return powerKW * emissionFactor
}

// Export default object with all functions for convenience
export default {
  EMISSION_FACTORS,
  CO2_SCOPES,
  calculateCO2Emissions,
  calculateDailyCO2,
  calculateMonthlyCO2,
  calculateYearlyCO2,
  calculateCO2FromPower,
  calculateThreePhaseCO2,
  formatCO2,
  getCO2Equivalents,
  calculateCO2Reduction,
  getEmissionFactor,
  calculateRealTimeCO2Rate
}