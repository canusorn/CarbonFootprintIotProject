import axios from 'axios'

export class EnergyService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000/api' 
      : 'http://localhost:3000/api'
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async getCurrentData() {
    try {
      const response = await this.client.get('/energy/current')
      return response.data
    } catch (error) {
      console.error('Error fetching current energy data:', error)
      // Return mock data for development
      return {
        phases: {
          phase1: 286.7 + Math.random() * 10 - 5,
          phase2: 287.3 + Math.random() * 10 - 5,
          phase3: 286.0 + Math.random() * 10 - 5
        },
        timestamp: new Date().toISOString()
      }
    }
  }

  async getHistoricalData(startDate, endDate) {
    try {
      const response = await this.client.get('/energy/historical', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching historical energy data:', error)
      return []
    }
  }

  async getEmissionFactors() {
    try {
      const response = await this.client.get('/emission-factors')
      return response.data
    } catch (error) {
      console.error('Error fetching emission factors:', error)
      // Return default emission factors (gCO2e/kWh)
      return {
        electricity: 0.5, // 500g CO2e per kWh (Thailand average)
        natural_gas: 0.2,
        fuel_oil: 0.27
      }
    }
  }

  calculateCO2Emission(energyConsumption, emissionFactor = 0.5) {
    return energyConsumption * emissionFactor
  }

  async sendAlertThreshold(threshold) {
    try {
      const response = await this.client.post('/alerts/threshold', { threshold })
      return response.data
    } catch (error) {
      console.error('Error setting alert threshold:', error)
      throw error
    }
  }
}