<template>
  <header>
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

.app-title {
  margin: 0;
}

main {
  padding: 20px;
}
</style>
