#!/usr/bin/env node

/**
 * Test script to demonstrate database reconnection functionality
 * 
 * This script simulates starting the Node.js server before MySQL is available
 * and shows how the automatic reconnection works.
 * 
 * Usage:
 * 1. Stop MySQL service
 * 2. Run: node test-reconnection.js
 * 3. Start MySQL service while the script is running
 * 4. Observe automatic reconnection
 */

require('dotenv').config();

const { 
  initializeDatabase, 
  startPeriodicReconnection, 
  getDatabaseStatus,
  checkDatabaseHealth 
} = require('./config/database');

console.log('🧪 Testing Database Reconnection Functionality');
console.log('=' .repeat(50));

let reconnectInterval;

const testReconnection = async () => {
  console.log('\n📋 Test Steps:');
  console.log('1. Ensure MySQL is stopped before running this test');
  console.log('2. Start MySQL service during the test');
  console.log('3. Observe automatic reconnection\n');

  // Try initial connection
  console.log('🔄 Attempting initial database connection...');
  try {
    await initializeDatabase();
    console.log('✅ Database connected successfully on first attempt');
  } catch (error) {
    console.log('❌ Initial connection failed (expected if MySQL is not running)');
    console.log('⏳ Starting automatic reconnection attempts...');
  }

  // Start periodic reconnection
  reconnectInterval = startPeriodicReconnection(async () => {
    console.log('🎉 Database reconnected! Services would be reinitialized here.');
    
    // Show current status
    const status = getDatabaseStatus();
    console.log('📊 Current Status:', status);
    
    // Test health check
    const isHealthy = await checkDatabaseHealth();
    console.log('💚 Health Check:', isHealthy ? 'PASSED' : 'FAILED');
    
    console.log('\n✅ Reconnection test completed successfully!');
    console.log('🛑 Stopping test...');
    
    // Clean up and exit
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
    }
    process.exit(0);
  });

  console.log('🔄 Reconnection monitoring started (checking every 30 seconds)');
  console.log('💡 Start your MySQL service now to see automatic reconnection');
  console.log('⏹️  Press Ctrl+C to stop the test\n');
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
  }
  process.exit(0);
});

// Start the test
testReconnection().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});