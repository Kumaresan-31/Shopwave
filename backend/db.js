const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let poolConfig;

// Railway provides MYSQL_URL or DATABASE_URL for MySQL service
const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (mysqlUrl && (mysqlUrl.startsWith('mysql://') || mysqlUrl.startsWith('mysql2://'))) {
  // Parse the URL for Railway-style connection
  try {
    const url = new URL(mysqlUrl.replace('mysql2://', 'mysql://'));
    poolConfig = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // remove leading "/"
      port: parseInt(url.port) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.RAILWAY_ENVIRONMENT ? { rejectUnauthorized: false } : undefined
    };
  } catch (e) {
    console.warn('⚠️ Could not parse DATABASE_URL, falling back to individual env vars:', e.message);
  }
}

if (!poolConfig) {
  // Local / individual env vars
  poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopwave',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

const pool = mysql.createPool(poolConfig);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL Database (' + (poolConfig.database || 'shopwave') + ')');
    connection.release();
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.warn('⚠️ MySQL Connected, but database "' + poolConfig.database + '" does not exist yet.');
      console.warn('👉 Hint: Please run your database.sql file in MySQL to create the database!');
    } else if (error.code === 'ECONNREFUSED') {
      console.warn('⚠️ MySQL Connection Refused. Is your MySQL server running on port ' + (poolConfig.port || 3306) + '?');
    } else {
      console.error('❌ MySQL Connection Error:', error.message);
    }
  }
}

testConnection();

module.exports = pool;
