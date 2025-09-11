<template>
  <header>
    <h1 class="app-title">Realtime Energy Consumption and CO2 Emission</h1>
  </header>
  
  <main>
    <RouterView />
  </main>
</template>

<script>
import { RouterView } from 'vue-router'

export default {
  name: 'App',
  components: {
    RouterView
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

header {
  background-color: #4CAF50;
  color: white;
  text-align: center;
  padding: 1rem;
}

.app-title {
  margin: 0;
}

main {
  padding: 20px;
}
</style>
