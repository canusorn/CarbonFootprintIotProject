<template>
  <div class="home">
    <h1>Carbon Footprint IoT Project</h1>
    <div v-if="!isAuthenticated" class="auth-container">
      <div class="auth-tabs">
        <button 
          :class="{ active: activeTab === 'login' }" 
          @click="activeTab = 'login'"
        >
          Login
        </button>
        <button 
          :class="{ active: activeTab === 'register' }" 
          @click="activeTab = 'register'"
        >
          Register
        </button>
      </div>
      
      <div class="auth-content">
        <LoginForm v-if="activeTab === 'login'" />
        <RegisterForm v-else />
      </div>
    </div>
    
    <div v-else class="dashboard">
      <h2>Welcome, {{ user.email }}</h2>
      <p>You are now logged in to the Carbon Footprint IoT Dashboard.</p>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import RegisterForm from '../components/RegisterForm.vue'

export default {
  name: 'HomeView',
  components: {
    LoginForm,
    RegisterForm
  },
  setup() {
    const router = useRouter()
    const activeTab = ref('login')
    
    // In a real app, this would come from a store
    const isAuthenticated = computed(() => {
      return localStorage.getItem('token') !== null
    })
    
    const user = computed(() => {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : { email: '' }
    })
    
    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.go(0) // Refresh the page
    }
    
    return {
      activeTab,
      isAuthenticated,
      user,
      logout
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.auth-container {
  max-width: 400px;
  margin: 40px auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.auth-tabs {
  display: flex;
}

.auth-tabs button {
  flex: 1;
  padding: 15px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.auth-tabs button.active {
  background: #4CAF50;
  color: white;
}

.auth-content {
  padding: 20px;
}

.dashboard {
  margin-top: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.logout-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.logout-btn:hover {
  background-color: #d32f2f;
}
</style>