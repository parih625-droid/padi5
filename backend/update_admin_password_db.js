const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  connectTimeout: 60000,
};

// New password to set
const newPasswordHash = '$2b$12$wdKObnZYlEXBQEmP3swc5OXb1c1MAX3TlysM2dRqNp/tpj7iW2eom'; // bcrypt hash for 'Re1317821'

async function updateAdminPassword() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
    
    console.log('Updating admin password...');
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [newPasswordHash, 'admin@padidekhoy.ir']
    );
    
    console.log(`✅ Password updated for ${result.affectedRows} user(s)`);
    
    // Verify the update
    console.log('Verifying update...');
    const [rows] = await connection.execute(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      ['admin@padidekhoy.ir']
    );
    
    if (rows.length > 0) {
      console.log('✅ User found:');
      console.log('  ID:', rows[0].id);
      console.log('  Name:', rows[0].name);
      console.log('  Email:', rows[0].email);
      // Don't print the password hash for security reasons
      console.log('  Password hash: [REDACTED]');
    } else {
      console.log('❌ User not found');
    }
    
    await connection.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

updateAdminPassword();