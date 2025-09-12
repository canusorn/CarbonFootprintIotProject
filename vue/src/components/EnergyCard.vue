<template>
  <Card class="energy-card">
    <template #title>Energy Consumption</template>
    <template #content>
      <div class="energy-data">
        <div class="energy-item">
          <span class="energy-label">Import Energy:</span>
          <span class="energy-value">{{ formatEnergy(importEnergy) }} kWh</span>
        </div>
        <div class="energy-item">
          <span class="energy-label">Export Energy:</span>
          <span class="energy-value">{{ formatEnergy(exportEnergy) }} kWh</span>
        </div>
        <div class="energy-item">
          <span class="energy-label">Total Energy:</span>
          <span class="energy-value">{{ formatEnergy(totalEnergy) }} kWh</span>
        </div>
      </div>
    </template>
  </Card>
</template>

<script>
import Card from 'primevue/card'

export default {
  name: 'EnergyCard',
  components: {
    Card
  },
  props: {
    importEnergy: {
      type: Number,
      default: 0
    },
    exportEnergy: {
      type: Number,
      default: 0
    },
    totalEnergy: {
      type: Number,
      default: 0
    }
  },
  methods: {
    formatEnergy(value) {
      return (value || 0).toFixed(2)
    }
  }
}
</script>

<style scoped>
.energy-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #00BCD4;
}

.energy-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.energy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.energy-item:last-child {
  border-bottom: none;
}

.energy-label {
  font-weight: 500;
  color: #666;
  font-size: 0.95rem;
}

.energy-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}
</style>