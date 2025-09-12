const mysql = require('mysql2/promise');

// Main database configuration (for users, auth, etc.)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carbon_footprint_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Sensor database configuration (for time series sensor data)
const sensorDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'sensor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Connection pools (will be created when database is available)
let pool = null;
let sensorPool = null;
let isConnected = false;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 10,
  initialDelay: 1000, // 1 second
  maxDelay: 30000,    // 30 seconds
  backoffFactor: 2
};

// Sleep utility function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create connection pools
const createPools = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  if (!sensorPool) {
    sensorPool = mysql.createPool(sensorDbConfig);
  }
};

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    if (!pool) {
      createPools();
    }
    
    // Test connection with a simple query
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
};

// Initialize database with retry logic
const initializeDatabaseWithRetry = async (retryCount = 0) => {
  try {
    console.log('🔄 Initializing MySQL databases...');
    console.log(`📍 Connecting to MySQL at ${dbConfig.host}:3306`);
    console.log(`📊 Main Database: ${dbConfig.database}`);
    console.log(`📊 Sensor Database: ${sensorDbConfig.database}`);
    console.log(`👤 User: ${dbConfig.user}`);
    
    // Create connection pools if not exists
    createPools();
    
    // Create databases if they don't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 10000
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${sensorDbConfig.database}`);
    await connection.end();
    
    // Create users table in main database
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    isConnected = true;
    console.log('✅ Databases initialized successfully');
    return true;
  } catch (error) {
    console.error(`❌ Database initialization failed (attempt ${retryCount + 1}):`, error.message);
    
    if (retryCount < RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, retryCount),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`⏳ Retrying in ${delay / 1000} seconds... (${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
      await sleep(delay);
      return initializeDatabaseWithRetry(retryCount + 1);
    } else {
      console.error('\n📋 MySQL Setup Instructions:');
      console.error('1. Install MySQL Server: https://dev.mysql.com/downloads/mysql/');
      console.error('2. Start MySQL service');
      console.error('3. Create .env file from .env.example');
      console.error('4. Update database credentials in .env file');
      console.error('\n🔧 Current configuration:');
      console.error(`   Host: ${dbConfig.host}`);
      console.error(`   User: ${dbConfig.user}`);
      console.error(`   Main Database: ${dbConfig.database}`);
      console.error(`   Sensor Database: ${sensorDbConfig.database}`);
      console.error(`   Password: ${dbConfig.password ? '[SET]' : '[NOT SET]'}`);
      throw error;
    }
  }
};

// Original initialize function for backward compatibility
const initializeDatabase = async () => {
  return initializeDatabaseWithRetry();
};

// Periodic reconnection function
const startPeriodicReconnection = (onReconnect) => {
  const reconnectInterval = setInterval(async () => {
    if (!isConnected) {
      console.log('🔄 Attempting to reconnect to database...');
      try {
        await initializeDatabaseWithRetry();
        if (isConnected && onReconnect) {
          console.log('🎉 Database reconnected! Reinitializing services...');
          onReconnect();
        }
      } catch (error) {
        // Continue trying in the next interval
      }
    }
  }, 30000); // Check every 30 seconds
  
  return reconnectInterval;
};

// Get connection status
const getDatabaseStatus = () => {
  return {
    isConnected,
    hasPool: !!pool,
    hasSensorPool: !!sensorPool
  };
};

// Get pool instances (create if needed)
const getPool = () => {
  if (!pool) {
    createPools();
  }
  return pool;
};

const getSensorPool = () => {
  if (!sensorPool) {
    createPools();
  }
  return sensorPool;
};

module.exports = {
  get pool() { return getPool(); },
  get sensorPool() { return getSensorPool(); },
  initializeDatabase,
  initializeDatabaseWithRetry,
  checkDatabaseHealth,
  startPeriodicReconnection,
  getDatabaseStatus,
  getPool,
  getSensorPool
};