<template>
  <Card :class="`data-card ${cardClass}`">
    <template #title>{{ title }}</template>
    <template #content>
      <div class="phase-data">
        <div class="phase-item">
          <span class="phase-label">Phase A:</span>
          <span class="phase-value">{{ formatValue(phaseA) }}{{ unit }}</span>
        </div>
        <div class="phase-item">
          <span class="phase-label">Phase B:</span>
          <span class="phase-value">{{ formatValue(phaseB) }}{{ unit }}</span>
        </div>
        <div class="phase-item">
          <span class="phase-label">Phase C:</span>
          <span class="phase-value">{{ formatValue(phaseC) }}{{ unit }}</span>
        </div>
        <div v-if="showTotal" class="total-power">
          <strong>Total: {{ formatValue(totalValue) }}{{ unit }}</strong>
        </div>
      </div>
    </template>
  </Card>
</template>

<script>
import Card from 'primevue/card'

export default {
  name: 'DataCard',
  components: {
    Card
  },
  props: {
    title: {
      type: String,
      required: true
    },
    phaseA: {
      type: Number,
      default: 0
    },
    phaseB: {
      type: Number,
      default: 0
    },
    phaseC: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: ''
    },
    cardClass: {
      type: String,
      default: ''
    },
    precision: {
      type: Number,
      default: 1
    },
    showTotal: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    totalValue() {
      return (this.phaseA || 0) + (this.phaseB || 0) + (this.phaseC || 0)
    }
  },
  methods: {
    formatValue(value) {
      return (value || 0).toFixed(this.precision)
    }
  }
}
</script>

<style scoped>
.data-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.voltage-card {
  border-left: 4px solid #4CAF50;
}

.current-card {
  border-left: 4px solid #2196F3;
}

.power-card {
  border-left: 4px solid #FF9800;
}

.pf-card {
  border-left: 4px solid #9C27B0;
}

.phase-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.phase-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.phase-item:last-child {
  border-bottom: none;
}

.phase-label {
  font-weight: 500;
  color: #666;
}

.phase-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.total-power {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid #e0e0e0;
  text-align: center;
  font-size: 1.2rem;
  color: #2c3e50;
}
</style>