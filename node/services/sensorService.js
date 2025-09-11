const mysql = require('mysql2/promise');
const { sensorPool } = require('../config/database');

class SensorService {
  constructor() {
    this.connection = null;
  }

  async initialize() {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Initializing sensor service database connection...');
      
      this.connection = sensorPool;
      
      // Test the connection
      const testConnection = await sensorPool.getConnection();
      await testConnection.ping();
      testConnection.release();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Sensor service database connection established in ${duration}ms`);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to initialize sensor service after ${duration}ms:`);
      console.error(`   Connection Error: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
      console.error(`   Database: sensor`);
      
      throw new Error(`Sensor service initialization failed: ${error.message}`);
    }
  }

  async createTableIfNotExists(espId) {
    const startTime = Date.now();
    
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    const tableName = `esp_${espId}`;
    
    try {
      console.log(`🔄 Creating/verifying table for ESP: ${espId}`);
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          Va DECIMAL(10,3) NOT NULL,
          Vb DECIMAL(10,3) NOT NULL,
          Vc DECIMAL(10,3) NOT NULL,
          Ia DECIMAL(10,3) NOT NULL,
          Ib DECIMAL(10,3) NOT NULL,
          Ic DECIMAL(10,3) NOT NULL,
          Pa DECIMAL(10,3) NOT NULL,
          Pb DECIMAL(10,3) NOT NULL,
          Pc DECIMAL(10,3) NOT NULL,
          PFa DECIMAL(5,3) NOT NULL,
          PFb DECIMAL(5,3) NOT NULL,
          PFc DECIMAL(5,3) NOT NULL,
          Eim DECIMAL(15,3) NOT NULL,
          Eex DECIMAL(15,3) NOT NULL,
          Ett DECIMAL(15,3) NOT NULL,
          time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_time (time),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await this.connection.execute(createTableQuery);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Table '${tableName}' created/verified successfully in ${duration}ms`);
      
      return tableName;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to create table '${tableName}' after ${duration}ms:`);
      console.error(`   Table Creation Error: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
      console.error(`   ESP ID: ${espId}`);
      
      throw new Error(`Table creation failed for ESP ${espId}: ${error.message}`);
    }
  }

  async savePowerMeterData(espId, data) {
    const startTime = Date.now();
    
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    try {
      console.log(`🔄 Saving power meter data for ESP: ${espId}`);
      
      // Validate required fields
      const requiredFields = ['Va', 'Vb', 'Vc', 'Ia', 'Ib', 'Ic', 'Pa', 'Pb', 'Pc', 'PFa', 'PFb', 'PFc', 'Eim', 'Eex', 'Ett'];
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Create table if it doesn't exist
      const tableName = await this.createTableIfNotExists(espId);

      // Prepare insert query
      const insertQuery = `
        INSERT INTO \`${tableName}\` 
        (Va, Vb, Vc, Ia, Ib, Ic, Pa, Pb, Pc, PFa, PFb, PFc, Eim, Eex, Ett, time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        parseFloat(data.Va),
        parseFloat(data.Vb),
        parseFloat(data.Vc),
        parseFloat(data.Ia),
        parseFloat(data.Ib),
        parseFloat(data.Ic),
        parseFloat(data.Pa),
        parseFloat(data.Pb),
        parseFloat(data.Pc),
        parseFloat(data.PFa),
        parseFloat(data.PFb),
        parseFloat(data.PFc),
        parseFloat(data.Eim),
        parseFloat(data.Eex),
        parseFloat(data.Ett),
        data.time ? new Date(data.time) : new Date()
      ];

      const [result] = await this.connection.execute(insertQuery, values);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Successfully saved data for ESP ${espId} (ID: ${result.insertId}) in ${duration}ms`);
      
      return {
        success: true,
        insertId: result.insertId,
        tableName: tableName,
        espId,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to save power meter data for ESP ${espId} after ${duration}ms:`);
      console.error(`   Database Error: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
      
      // Log data that failed to save (for debugging)
      console.error(`   Failed Data Sample:`, {
        espId,
        Va: data.Va,
        timestamp: data.time,
        fieldsCount: Object.keys(data).length
      });
      
      throw new Error(`Database operation failed for ESP ${espId}: ${error.message}`);
    }
  }

  async getLatestData(espId, limit = 10) {
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    const tableName = `esp_${espId}`;
    const selectQuery = `
      SELECT * FROM \`${tableName}\`
      ORDER BY created_at DESC
      LIMIT ?
    `;

    try {
      const [rows] = await this.connection.execute(selectQuery, [limit]);
      return rows;
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return [];
      }
      console.error(`SensorService: Failed to get data from '${tableName}':`, error.message);
      throw error;
    }
  }

  async close() {
    // Don't close the shared pool, just reset the reference
    // The pool is managed by the database configuration
    this.connection = null;
    console.log('Sensor service: Connection reference cleared');
  }
}

module.exports = SensorService;