export class DataSimulator {
  constructor() {
    this.isRunning = false
    this.interval = null
    this.callbacks = []
    
    // Base values for simulation
    this.baseValues = {
      phase1: 286.7,
      phase2: 287.3,
      phase3: 286.0
    }
    
    // Emission factor (gCO2e/kWh) - Thailand electricity grid
    this.emissionFactor = 0.5
  }

  start(intervalMs = 5000) {
    if (this.isRunning) {
      console.warn('Data simulator is already running')
      return
    }

    this.isRunning = true
    console.log('Starting data simulator...')

    this.interval = setInterval(() => {
      this.generateAndBroadcastData()
    }, intervalMs)

    // Generate initial data
    this.generateAndBroadcastData()
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isRunning = false
    console.log('Data simulator stopped')
  }

  addCallback(callback) {
    this.callbacks.push(callback)
  }

  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  generateAndBroadcastData() {
    const data = this.generateRealisticData()
    
    // Broadcast to all registered callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in data callback:', error)
      }
    })
  }

  generateRealisticData() {
    const now = new Date()
    const hour = now.getHours()
    
    // Simulate daily usage patterns
    const demandMultiplier = this.getDemandMultiplier(hour)
    
    // Add some random variation
    const variation = 0.1 // 10% variation
    
    const phases = {
      phase1: this.baseValues.phase1 * demandMultiplier * (1 + (Math.random() - 0.5) * variation),
      phase2: this.baseValues.phase2 * demandMultiplier * (1 + (Math.random() - 0.5) * variation),
      phase3: this.baseValues.phase3 * demandMultiplier * (1 + (Math.random() - 0.5) * variation)
    }

    const totalEnergy = phases.phase1 + phases.phase2 + phases.phase3
    const totalEmission = totalEnergy * this.emissionFactor

    return {
      timestamp: now.toISOString(),
      phases,
      totalEnergy,
      totalEmission: totalEmission / 1000, // Convert to kg
      emissionFactor: this.emissionFactor,
      demand: {
        current: totalEnergy,
        peak: Math.max(totalEnergy * 1.2, 900),
        average: 850
      },
      alerts: this.generateAlerts(phases, totalEmission),
      powerQuality: {
        frequency: 50 + (Math.random() - 0.5) * 0.5, // 49.75 - 50.25 Hz
        voltageImbalance: Math.random() * 2, // 0-2%
        harmonicDistortion: Math.random() * 5 // 0-5%
      }
    }
  }

  getDemandMultiplier(hour) {
    // Simulate typical daily demand pattern
    if (hour >= 6 && hour <= 8) return 1.2  // Morning peak
    if (hour >= 9 && hour <= 11) return 1.0 // Morning work
    if (hour >= 12 && hour <= 13) return 1.1 // Lunch time
    if (hour >= 14 && hour <= 17) return 1.0 // Afternoon work
    if (hour >= 18 && hour <= 21) return 1.3 // Evening peak
    if (hour >= 22 || hour <= 5) return 0.7  // Night time
    return 1.0 // Default
  }

  generateAlerts(phases, totalEmission) {
    const alerts = []
    
    // High emission alert
    if (totalEmission > 450) {
      alerts.push({
        type: 'warning',
        message: 'High CO2 emission detected',
        value: totalEmission,
        threshold: 450
      })
    }

    // Phase imbalance alert
    const phaseValues = Object.values(phases)
    const avgPhase = phaseValues.reduce((a, b) => a + b, 0) / phaseValues.length
    const maxDeviation = Math.max(...phaseValues.map(v => Math.abs(v - avgPhase)))
    
    if (maxDeviation > avgPhase * 0.1) { // More than 10% deviation
      alerts.push({
        type: 'info',
        message: 'Phase imbalance detected',
        deviation: ((maxDeviation / avgPhase) * 100).toFixed(1) + '%'
      })
    }

    return alerts
  }

  // Utility method to generate historical data
  generateHistoricalData(days = 30) {
    const data = []
    const now = new Date()
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Generate 24 hours of data for each day
      for (let hour = 0; hour < 24; hour++) {
        date.setHours(hour, 0, 0, 0)
        
        const demandMultiplier = this.getDemandMultiplier(hour)
        const dailyVariation = 0.8 + Math.random() * 0.4 // 80%-120% daily variation
        
        const phases = {
          phase1: this.baseValues.phase1 * demandMultiplier * dailyVariation,
          phase2: this.baseValues.phase2 * demandMultiplier * dailyVariation,
          phase3: this.baseValues.phase3 * demandMultiplier * dailyVariation
        }
        
        const totalEnergy = phases.phase1 + phases.phase2 + phases.phase3
        
        data.push({
          timestamp: new Date(date).toISOString(),
          phases,
          totalEnergy,
          totalEmission: (totalEnergy * this.emissionFactor) / 1000
        })
      }
    }
    
    return data
  }
}