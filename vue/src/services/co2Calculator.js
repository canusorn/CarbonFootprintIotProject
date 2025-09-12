/**
 * CO2 Emission Calculator Utility
 * Global functions for calculating CO2 emissions from energy consumption
 */

// Standard emission factors (kg CO2 per kWh) by region/source
export const EMISSION_FACTORS = {
  // Global averages
  GLOBAL_AVERAGE: 0.475,
  
  // Regional factors (examples)
  THAILAND: 0.5216, // Thailand's grid emission factor
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
  
  // Default factor used in the application
  DEFAULT: 0.5
}

// CO2 calculation scopes based on GHG Protocol
export const CO2_SCOPES = {
  SCOPE_1: 'Direct emissions from owned/controlled sources',
  SCOPE_2: 'Indirect emissions from purchased energy',
  SCOPE_3: 'All other indirect emissions in value chain'
}

/**
 * Calculate CO2 emissions from energy consumption
 * @param {number} energyKWh - Energy consumption in kWh
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (optional)
 * @returns {number} CO2 emissions in kg
 */
export function calculateCO2Emissions(energyKWh, emissionFactor = EMISSION_FACTORS.DEFAULT) {
  if (typeof energyKWh !== 'number' || energyKWh < 0) {
    console.warn('Invalid energy value provided:', energyKWh)
    return 0
  }
  
  if (typeof emissionFactor !== 'number' || emissionFactor < 0) {
    console.warn('Invalid emission factor provided:', emissionFactor)
    emissionFactor = EMISSION_FACTORS.DEFAULT
  }
  
  return energyKWh * emissionFactor
}

/**
 * Calculate daily CO2 emissions from energy data
 * @param {number} dailyEnergyKWh - Daily energy consumption in kWh
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (optional)
 * @returns {number} Daily CO2 emissions in kg
 */
export function calculateDailyCO2(dailyEnergyKWh, emissionFactor = EMISSION_FACTORS.DEFAULT) {
  return calculateCO2Emissions(dailyEnergyKWh, emissionFactor)
}

/**
 * Calculate monthly CO2 emissions from daily data array
 * @param {Array} dailyDataArray - Array of daily energy data objects
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (optional)
 * @returns {number} Monthly CO2 emissions in kg
 */
export function calculateMonthlyCO2(dailyDataArray, emissionFactor = EMISSION_FACTORS.DEFAULT) {
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
 * @param {Array} monthlyDataArray - Array of monthly energy data objects
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (optional)
 * @returns {number} Yearly CO2 emissions in kg
 */
export function calculateYearlyCO2(monthlyDataArray, emissionFactor = EMISSION_FACTORS.DEFAULT) {
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
 * @param {number} powerKW - Power consumption in kW
 * @param {number} timeHours - Time duration in hours
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (optional)
 * @returns {number} CO2 emissions in kg
 */
export function calculateCO2FromPower(powerKW, timeHours, emissionFactor = EMISSION_FACTORS.DEFAULT) {
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
 * Calculate CO2 emissions for three-phase power system
 * @param {Object} phaseData - Object containing Pa, Pb, Pc in watts
 * @param {number} timeHours - Time duration in hours
 * @param {number} emissionFactor - Emission factor in kg CO2/kWh (optional)
 * @returns {Object} CO2 emissions breakdown by phase and total
 */
export function calculateThreePhaseCO2(phaseData, timeHours, emissionFactor = EMISSION_FACTORS.DEFAULT) {
  const { Pa = 0, Pb = 0, Pc = 0 } = phaseData
  
  // Convert watts to kW
  const phaseAkW = Pa / 1000
  const phaseBkW = Pb / 1000
  const phaseCkW = Pc / 1000
  const totalKW = phaseAkW + phaseBkW + phaseCkW
  
  return {
    phaseA: calculateCO2FromPower(phaseAkW, timeHours, emissionFactor),
    phaseB: calculateCO2FromPower(phaseBkW, timeHours, emissionFactor),
    phaseC: calculateCO2FromPower(phaseCkW, timeHours, emissionFactor),
    total: calculateCO2FromPower(totalKW, timeHours, emissionFactor),
    totalPowerKW: totalKW
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
 * Calculate CO2 equivalent in other units for comparison
 * @param {number} co2Kg - CO2 emissions in kg
 * @returns {Object} CO2 equivalents in various units
 */
export function getCO2Equivalents(co2Kg) {
  if (typeof co2Kg !== 'number' || co2Kg < 0) {
    return {
      trees: 0,
      carMiles: 0,
      carKm: 0,
      flights: 0
    }
  }
  
  return {
    // Trees needed to absorb this CO2 in a year (average tree absorbs ~22kg CO2/year)
    trees: Math.ceil(co2Kg / 22),
    
    // Equivalent car miles (average car emits ~0.404 kg CO2/mile)
    carMiles: Math.round(co2Kg / 0.404),
    
    // Equivalent car kilometers (average car emits ~0.251 kg CO2/km)
    carKm: Math.round(co2Kg / 0.251),
    
    // Equivalent short flights (average domestic flight emits ~250kg CO2)
    flights: (co2Kg / 250).toFixed(2)
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