<template>
  <Card class="co2-card">
    <template #title>CO2 Emissions</template>
    <template #content>
      <div class="co2-data">
        <div class="co2-item">
          <span class="co2-label">Emission Factor:</span>
          <span class="co2-value">{{ emissionFactor }} kg CO2/kWh</span>
        </div>
        <div class="co2-item">
          <span class="co2-label">Total CO2:</span>
          <span class="co2-value co2-highlight">{{ formatCO2(totalCO2) }} kg CO2</span>
        </div>
        <div class="co2-item">
          <span class="co2-label">Daily CO2:</span>
          <span class="co2-value">{{ formatCO2(dailyCO2) }} kg CO2</span>
        </div>
      </div>
    </template>
  </Card>
</template>

<script>
import Card from 'primevue/card'

export default {
  name: 'CO2Card',
  components: {
    Card
  },
  props: {
    emissionFactor: {
      type: Number,
      default: 0.5
    },
    totalCO2: {
      type: Number,
      default: 0
    },
    dailyCO2: {
      type: Number,
      default: 0
    }
  },
  methods: {
    formatCO2(value) {
      return (value || 0).toFixed(3)
    }
  }
}
</script>

<style scoped>
.co2-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #E91E63;
}

.co2-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.co2-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.co2-item:last-child {
  border-bottom: none;
}

.co2-label {
  font-weight: 500;
  color: #666;
  font-size: 0.95rem;
}

.co2-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.co2-highlight {
  color: #E91E63;
  font-weight: 700;
  font-size: 1.2rem;
}
</style>