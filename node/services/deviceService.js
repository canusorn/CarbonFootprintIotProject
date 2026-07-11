const mysql = require('mysql2/promise');
const { pool } = require('../config/database');

class DeviceService {
  constructor() {
    this.connection = null;
  }

  async initialize() {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Initializing device service database connection...');
      
      this.connection = pool;
      
      // Test the connection
      const testConnection = await pool.getConnection();
      await testConnection.ping();
      testConnection.release();
      
      // Create device table if it doesn't exist
      await this.createDeviceTableIfNotExists();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Device service database connection established in ${duration}ms`);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to initialize device service after ${duration}ms:`);
      console.error(`   Connection Error: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
      console.error(`   Database: ${process.env.DB_NAME || 'carbon_footprint_db'}`);
      
      throw new Error(`Device service initialization failed: ${error.message}`);
    }
  }

  async createDeviceTableIfNotExists() {
    try {
      console.log('🔄 Creating device table if not exists...');
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS device (
          id INT AUTO_INCREMENT PRIMARY KEY,
          espid VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL,
          status ENUM('ON', 'OFF') DEFAULT 'OFF',
          last_status_update TIMESTAMP NULL,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_espid (espid),
          INDEX idx_username (username)
        )
      `;
      
      await this.connection.execute(createTableQuery);
      console.log('✅ Device table verified/created successfully');
      
    } catch (error) {
      console.error('❌ Failed to create device table:', error.message);
      throw error;
    }
  }

  async saveDevice(espId, name, username) {
    try {
      console.log(`🔄 Saving device data for ESP ID: ${espId}`);
      
      if (!this.connection) {
        throw new Error('Device service not initialized');
      }
      
      // Atomically insert or update device — handles race between MQTT
      // auth (which saves with email) and /confirm (which may fallback first)
      const insertQuery = `
        INSERT INTO device (espid, name, username, date) 
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          username = VALUES(username),
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const [result] = await this.connection.execute(insertQuery, [espId, name, username]);
      
      if (result.affectedRows === 1) {
        console.log(`✅ Device data saved successfully for ESP ID: ${espId}`);
        console.log(`   Insert ID: ${result.insertId}`);
      } else {
        console.log(`ℹ️ Updated username for existing device ESP ID: ${espId} -> ${username}`);
      }
      
      return {
        success: true,
        espId,
        name,
        username,
        affectedRows: result.affectedRows,
        insertId: result.insertId,
        skipped: result.affectedRows !== 1
      };
      
    } catch (error) {
      console.error(`❌ Failed to save device data for ESP ID: ${espId}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      
      throw error;
    }
  }

  async getDevice(espId) {
    try {
      console.log(`🔄 Retrieving device data for ESP ID: ${espId}`);
      
      if (!this.connection) {
        throw new Error('Device service not initialized');
      }
      
      const selectQuery = 'SELECT * FROM device WHERE espid = ? ORDER BY updated_at DESC LIMIT 1';
      const [rows] = await this.connection.execute(selectQuery, [espId]);
      
      if (rows.length === 0) {
        console.log(`ℹ️ No device found for ESP ID: ${espId}`);
        return null;
      }
      
      console.log(`✅ Device data retrieved for ESP ID: ${espId}`);
      return rows[0];
      
    } catch (error) {
      console.error(`❌ Failed to retrieve device data for ESP ID: ${espId}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      console.log('🔄 Retrieving all devices...');
      
      if (!this.connection) {
        throw new Error('Device service not initialized');
      }
      
      const selectQuery = 'SELECT * FROM device ORDER BY updated_at DESC';
      const [rows] = await this.connection.execute(selectQuery);
      
      console.log(`✅ Retrieved ${rows.length} devices`);
      return rows;
      
    } catch (error) {
      console.error('❌ Failed to retrieve all devices');
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  async getDevicesByUsername(username) {
    try {
      console.log(`🔄 Retrieving devices for username: ${username}`);
      
      if (!this.connection) {
        throw new Error('Device service not initialized');
      }
      
      const selectQuery = 'SELECT * FROM device WHERE username = ? ORDER BY updated_at DESC';
      const [rows] = await this.connection.execute(selectQuery, [username]);
      
      console.log(`✅ Retrieved ${rows.length} devices for username: ${username}`);
      return rows;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve devices for username: ${username}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  async updateDeviceName(espId, newName) {
    try {
      console.log(`🔄 Updating device name for ESP ID: ${espId} to: ${newName}`);
      
      if (!this.connection) {
        throw new Error('Device service not initialized');
      }
      
      // Update only the device name
      const updateQuery = `
        UPDATE device 
        SET name = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE espid = ?
      `;
      
      const [result] = await this.connection.execute(updateQuery, [newName, espId]);
      
      if (result.affectedRows === 0) {
        throw new Error(`Device with ESP ID ${espId} not found`);
      }
      
      console.log(`✅ Device name updated successfully for ESP ID: ${espId}`);
      console.log(`   Affected rows: ${result.affectedRows}`);
      
      return {
        success: true,
        espId,
        name: newName,
        affectedRows: result.affectedRows
      };
      
    } catch (error) {
      console.error(`❌ Failed to update device name for ESP ID: ${espId}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  async updateDeviceStatus(espId, status) {
    try {
      console.log(`🔄 Updating device status for ESP ID: ${espId} to: ${status}`);
      
      if (!this.connection) {
        throw new Error('Device service not initialized');
      }

      // Validate status
      if (!['ON', 'OFF'].includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be ON or OFF`);
      }
      
      // Update device status and timestamp
      const updateQuery = `
        UPDATE device 
        SET status = ?, last_status_update = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE espid = ?
      `;
      
      const [result] = await this.connection.execute(updateQuery, [status, espId]);
      
      if (result.affectedRows === 0) {
        console.log(`⚠️ Device with ESP ID ${espId} not found, creating new device entry`);
        // If device doesn't exist, create it with the status
        await this.saveDevice(espId, espId, 'unknown');
        // Try updating again
        const [retryResult] = await this.connection.execute(updateQuery, [status, espId]);
        console.log(`✅ Device status updated successfully for ESP ID: ${espId} (retry)`);
        return {
          success: true,
          espId,
          status,
          affectedRows: retryResult.affectedRows
        };
      }
      
      console.log(`✅ Device status updated successfully for ESP ID: ${espId}`);
      console.log(`   Affected rows: ${result.affectedRows}`);
      
      return {
        success: true,
        espId,
        status,
        affectedRows: result.affectedRows
      };
      
    } catch (error) {
      console.error(`❌ Failed to update device status for ESP ID: ${espId}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }
  async saveEspDevice(espId, name, username) {
    try {
      console.log(`🔄 Saving ESP device: ${espId}`);

      if (!this.connection) {
        console.log('⚠️ Device service not initialized, skipping device save');
        return { success: false, error: 'Device service not available' };
      }

      const result = await this.saveDevice(espId, name, username);
      console.log(`✅ ESP device saved successfully: ${espId}`);

      return result;
    } catch (error) {
      console.error(`❌ Failed to save ESP device: ${espId}`);
      console.error(`   Error: ${error.message}`);

      return { success: false, error: error.message };
    }
  }

  async close() {
    // Don't close the shared pool, just reset the reference
    // The pool is managed by the database configuration
    this.connection = null;
    console.log('Device service: Connection reference cleared');
  }
}

module.exports = DeviceService;