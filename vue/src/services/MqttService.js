import mqtt from 'mqtt'

export class MqttService {
  constructor() {
    this.client = null
    this.isConnected = false
    this.subscriptions = new Map()
    this.reconnectInterval = 5000
    this.maxReconnectAttempts = 10
    this.reconnectAttempts = 0
    
    // MQTT broker configuration
    this.brokerUrl = process.env.NODE_ENV === 'production' 
      ? 'ws://localhost:1883' 
      : 'ws://localhost:1883'
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // For web browsers, we need to use WebSocket connection
        this.client = mqtt.connect(this.brokerUrl, {
          clientId: 'dashboard_' + Math.random().toString(16).substr(2, 8),
          clean: true,
          connectTimeout: 30000,
          reconnectPeriod: this.reconnectInterval,
          will: {
            topic: 'dashboard/status',
            payload: 'offline',
            qos: 1,
            retain: true
          }
        })

        this.client.on('connect', () => {
          console.log('Connected to MQTT broker')
          this.isConnected = true
          this.reconnectAttempts = 0
          
          // Publish online status
          this.client.publish('dashboard/status', 'online', { qos: 1, retain: true })
          
          resolve()
        })

        this.client.on('error', (error) => {
          console.error('MQTT connection error:', error)
          this.isConnected = false
          reject(error)
        })

        this.client.on('close', () => {
          console.log('MQTT connection closed')
          this.isConnected = false
          this.handleReconnect()
        })

        this.client.on('offline', () => {
          console.log('MQTT client offline')
          this.isConnected = false
        })

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message)
        })

      } catch (error) {
        console.error('Failed to create MQTT client:', error)
        reject(error)
      }
    })
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }, this.reconnectInterval)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  subscribe(topic, callback) {
    if (!this.isConnected) {
      console.warn('MQTT client not connected. Storing subscription for later.')
    }

    this.subscriptions.set(topic, callback)

    if (this.client && this.isConnected) {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error)
        } else {
          console.log(`Subscribed to ${topic}`)
        }
      })
    }
  }

  unsubscribe(topic) {
    if (this.client && this.isConnected) {
      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to unsubscribe from ${topic}:`, error)
        } else {
          console.log(`Unsubscribed from ${topic}`)
        }
      })
    }
    this.subscriptions.delete(topic)
  }

  publish(topic, message, options = {}) {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT client not connected. Cannot publish message.')
      return false
    }

    const payload = typeof message === 'object' ? JSON.stringify(message) : message

    this.client.publish(topic, payload, {
      qos: options.qos || 0,
      retain: options.retain || false
    }, (error) => {
      if (error) {
        console.error(`Failed to publish to ${topic}:`, error)
      } else {
        console.log(`Published to ${topic}:`, payload)
      }
    })

    return true
  }

  handleMessage(topic, message) {
    try {
      const callback = this.subscriptions.get(topic)
      if (callback) {
        let parsedMessage
        try {
          parsedMessage = JSON.parse(message.toString())
        } catch {
          parsedMessage = message.toString()
        }
        callback(parsedMessage)
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error)
    }
  }

  disconnect() {
    if (this.client) {
      // Publish offline status before disconnecting
      if (this.isConnected) {
        this.client.publish('dashboard/status', 'offline', { qos: 1, retain: true })
      }
      
      this.client.end()
      this.isConnected = false
      this.subscriptions.clear()
      console.log('Disconnected from MQTT broker')
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }

  // Convenience methods for common topics
  subscribeToEnergyData(callback) {
    this.subscribe('energy/phases', callback)
    this.subscribe('energy/total', callback)
  }

  subscribeToAlerts(callback) {
    this.subscribe('alerts/threshold', callback)
    this.subscribe('alerts/fault', callback)
  }

  publishEnergyThreshold(threshold) {
    this.publish('alerts/threshold/set', { threshold, timestamp: new Date().toISOString() })
  }
}