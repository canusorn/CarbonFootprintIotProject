<template>
  <div class="register-form">
    <h2>Register</h2>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-if="success" class="success-message">
      {{ success }}
    </div>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="register-email">Email</label>
        <input 
          type="email" 
          id="register-email" 
          v-model="email" 
          required 
          placeholder="Enter your email"
        />
      </div>
      
      <div class="form-group">
        <label for="register-password">Password</label>
        <input 
          type="password" 
          id="register-password" 
          v-model="password" 
          required 
          placeholder="Enter your password"
        />
      </div>
      
      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input 
          type="password" 
          id="confirm-password" 
          v-model="confirmPassword" 
          required 
          placeholder="Confirm your password"
        />
      </div>
      
      <button type="submit" :disabled="loading" class="submit-btn">
        {{ loading ? 'Registering...' : 'Register' }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import axios from 'axios'

export default {
  name: 'RegisterForm',
  setup() {
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const error = ref('')
    const success = ref('')
    const loading = ref(false)
    
    const handleSubmit = async () => {
      error.value = ''
      success.value = ''
      
      // Validate passwords match
      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match'
        return
      }
      
      loading.value = true
      
      try {
        const response = await axios.post('http://localhost:3000/api/auth/register', {
          email: email.value,
          password: password.value
        })
        
        // Store token and user data
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Show success message
        success.value = 'Registration successful!'
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (err) {
        if (err.response && err.response.data) {
          error.value = err.response.data.error || 'Registration failed'
        } else {
          error.value = 'Unable to connect to server'
        }
      } finally {
        loading.value = false
      }
    }
    
    return {
      email,
      password,
      confirmPassword,
      error,
      success,
      loading,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.register-form {
  text-align: left;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

.submit-btn:hover {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.success-message {
  color: #4CAF50;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
}
</style>