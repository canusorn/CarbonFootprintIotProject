const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carbon_footprint_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and create tables
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing MySQL database...');
    console.log(`📍 Connecting to MySQL at ${dbConfig.host}:3306`);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`👤 User: ${dbConfig.user}`);
    
    // Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();
    
    // Create users table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('\n📋 MySQL Setup Instructions:');
    console.error('1. Install MySQL Server: https://dev.mysql.com/downloads/mysql/');
    console.error('2. Start MySQL service');
    console.error('3. Create .env file from .env.example');
    console.error('4. Update database credentials in .env file');
    console.error('\n🔧 Current configuration:');
    console.error(`   Host: ${dbConfig.host}`);
    console.error(`   User: ${dbConfig.user}`);
    console.error(`   Database: ${dbConfig.database}`);
    console.error(`   Password: ${dbConfig.password ? '[SET]' : '[NOT SET]'}`);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};