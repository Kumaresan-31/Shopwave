const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('✅ Connected to MySQL successfully!');
    
    // Check if shopwave database exists
    const [rows] = await conn.query('SHOW DATABASES LIKE "shopwave"');
    if (rows.length === 0) {
      console.log('⚠️ Database "shopwave" does not exist yet. Please run database.sql');
    } else {
      console.log('✅ Database "shopwave" exists!');
    }
    
    await conn.end();
  } catch (err) {
    console.log('❌ MYSQL ERROR:');
    console.log(err.message);
  }
}

test();
