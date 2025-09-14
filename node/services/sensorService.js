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

    const tableName = `${espId}`;
    
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

    const tableName = `${espId}`;
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

  async getHistoricalData(espId, limit = 20000) {
    // Use the existing getLatestData method with a higher limit for historical data
    return await this.getLatestData(espId, limit);
  }

  async getHistoricalDataByDateRange(espId, startDate, endDate, limit = 50000) {
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    const tableName = `${espId}`;
    
    try {
      console.log(`🔄 Fetching historical data for ESP: ${espId} from ${startDate} to ${endDate}`);
      
      const selectQuery = `
        SELECT * FROM \`${tableName}\`
        WHERE time >= ? AND time <= ?
        ORDER BY time ASC
        LIMIT ?
      `;

      const [rows] = await this.connection.execute(selectQuery, [startDate, endDate, limit]);
      
      console.log(`✅ Retrieved ${rows.length} records for ESP: ${espId}`);
      return rows;
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log(`⚠️ Table '${tableName}' does not exist, returning empty array`);
        return [];
      }
      console.error(`SensorService: Failed to get historical data from '${tableName}':`, error.message);
      throw error;
    }
  }

  async getDailyEnergyData(espId, days = 30) {
    const startTime = Date.now();
    
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    const tableName = `${espId}`;
    
    try {
      console.log(`🔄 Calculating daily energy data for ESP: ${espId} (last ${days} days)`);
      
      // SQL query to calculate daily energy consumption for the last N days
      // Using subqueries instead of CTEs for MySQL compatibility
      const query = `
        SELECT 
          dr.date,
          COALESCE(dd.daily_energy, 0) as daily_energy,
          COALESCE(dd.record_count, 0) as record_count
        FROM (
          SELECT DATE_SUB(CURDATE(), INTERVAL (seq - 1) DAY) as date
          FROM (
            SELECT @row := @row + 1 as seq
            FROM (
              SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
              SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
            ) t1,
            (
              SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
              SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
            ) t2,
            (SELECT @row := 0) r
          ) seq_table
          WHERE seq <= ?
        ) dr
        LEFT JOIN (
          SELECT 
            DATE(time) as date,
            MAX(Ett) - MIN(Ett) as daily_energy,
            COUNT(*) as record_count
          FROM \`${tableName}\`
          WHERE time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND time < CURDATE() + INTERVAL 1 DAY
          GROUP BY DATE(time)
        ) dd ON dr.date = dd.date
        ORDER BY dr.date ASC
      `;

      const [rows] = await this.connection.execute(query, [days, days]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Daily energy calculation completed for ESP ${espId} in ${duration}ms (${rows.length} days)`);
      
      // Format the results
      const result = rows.map(row => {
        const adjustedDate = new Date(row.date);
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        // Handle UTC+7 timezone offset
        const utcTime = adjustedDate.getTime() + (adjustedDate.getTimezoneOffset() * 60000);
        const localTime = new Date(utcTime + (7 * 3600000)); // UTC+7
        return {
          date: localTime.toISOString().split('T')[0],
          energy: Math.max(0, parseFloat(row.daily_energy) || 0),
          recordCount: parseInt(row.record_count) || 0
        };
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log(`⚠️  Table '${tableName}' does not exist for ESP ${espId} - returning empty data`);
        
        // Return empty data for the requested date range
        const result = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          result.push({
            date: date.toISOString().split('T')[0],
            energy: 0,
            recordCount: 0
          });
        }
        
        return result;
      }
      
      console.error(`❌ Failed to calculate daily energy for ESP ${espId} after ${duration}ms:`);
      console.error(`   Database Error: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
      
      throw new Error(`Daily energy calculation failed for ESP ${espId}: ${error.message}`);
    }
  }

  async getTodayEnergyData(espId) {
    const startTime = Date.now();
    
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    const tableName = `${espId}`;
    
    try {
      console.log(`🔄 Fetching today's energy data for ESP: ${espId}`);
      
      // Get first and last Ett values of today to calculate today's energy consumption
      const query = `
        SELECT 
          MIN(Ett) as start_energy,
          MAX(Ett) as end_energy,
          COUNT(*) as record_count,
          MIN(time) as start_time,
          MAX(time) as end_time
        FROM \`${tableName}\`
        WHERE DATE(time) = CURDATE()
      `;

      const [rows] = await this.connection.execute(query);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Today's energy data fetched for ESP ${espId} in ${duration}ms`);
      
      if (rows.length === 0 || rows[0].record_count === 0) {
        return {
          todayEnergy: 0,
          startEnergy: 0,
          endEnergy: 0,
          recordCount: 0,
          startTime: null,
          endTime: null
        };
      }
      
      const result = {
        todayEnergy: Math.max(0, (parseFloat(rows[0].end_energy) || 0) - (parseFloat(rows[0].start_energy) || 0)),
        startEnergy: parseFloat(rows[0].start_energy) || 0,
        endEnergy: parseFloat(rows[0].end_energy) || 0,
        recordCount: parseInt(rows[0].record_count) || 0,
        startTime: rows[0].start_time,
        endTime: rows[0].end_time
      };
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log(`⚠️  Table '${tableName}' does not exist for ESP ${espId} - returning empty data`);
        return {
          todayEnergy: 0,
          startEnergy: 0,
          endEnergy: 0,
          recordCount: 0,
          startTime: null,
          endTime: null
        };
      }
      
      console.error(`❌ Failed to fetch today's energy data for ESP ${espId} after ${duration}ms:`);
      console.error(`   Database Error: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
      
      throw new Error(`Today's energy data fetch failed for ESP ${espId}: ${error.message}`);
    }
  }

  async getTodayPowerData(espId) {
    const startTime = Date.now();
    
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    const tableName = `${espId}`;
    
    try {
      console.log(`🔄 Fetching today's power data for ESP: ${espId}`);
      
      // Get all power and voltage data for today for line chart
      const query = `
        SELECT 
          time,
          Va,
          Vb,
          Vc,
          Pa,
          Pb,
          Pc,
          (Pa + Pb + Pc) as total_power
        FROM \`${tableName}\`
        WHERE DATE(time) = CURDATE()
        ORDER BY time ASC
      `;

      const [rows] = await this.connection.execute(query);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Today's power data fetched for ESP ${espId} in ${duration}ms (${rows.length} records)`);
      
      // Format the results for chart display
      const result = rows.map(row => ({
        time: row.time,
        Va: parseFloat(row.Va) || 0,
        Vb: parseFloat(row.Vb) || 0,
        Vc: parseFloat(row.Vc) || 0,
        Pa: parseFloat(row.Pa) || 0,
        Pb: parseFloat(row.Pb) || 0,
        Pc: parseFloat(row.Pc) || 0,
        totalPower: parseFloat(row.total_power) || 0
      }));
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log(`⚠️  Table '${tableName}' does not exist for ESP ${espId} - returning empty data`);
        return [];
      }
      
      console.error(`❌ Failed to fetch today's power data for ESP ${espId} after ${duration}ms:`);
      console.error(`   Database Error: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
      
      throw new Error(`Today's power data fetch failed for ESP ${espId}: ${error.message}`);
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