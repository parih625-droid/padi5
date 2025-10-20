// Detailed MySQL authentication test
require('dotenv').config();
const mysql = require('mysql2/promise');

// Use the same database configuration as your application
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db',
  connectTimeout: 10000, // 10 seconds
};

console.log('Testing MySQL connection with these credentials:');
console.log('- Host:', dbConfig.host);
console.log('- Port:', dbConfig.port);
console.log('- Database:', dbConfig.database);
console.log('- User:', dbConfig.user);
console.log('- Password length:', dbConfig.password ? dbConfig.password.length + ' characters' : 'Not set');

async function testMySQLConnection() {
  console.log('\n🔍 Attempting to connect to MySQL...');
  
  try {
    // Try to establish a connection
    console.log('Creating connection...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      connectTimeout: dbConfig.connectTimeout,
    });
    
    console.log('✅ Connection established successfully!');
    
    // Get MySQL server version
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log('MySQL Server Version:', versionRows[0].version);
    
    // Get current user
    const [userRows] = await connection.execute('SELECT USER() as currentUser, DATABASE() as currentDatabase');
    console.log('Connected as user:', userRows[0].currentUser);
    console.log('Current database:', userRows[0].currentDatabase);
    
    // List available databases
    const [dbRows] = await connection.execute('SHOW DATABASES');
    console.log('Available databases:');
    dbRows.forEach(row => {
      console.log('  -', row.Database);
    });
    
    // Close connection
    await connection.end();
    console.log('\n✅ All tests passed! MySQL connection is working properly.');
    
  } catch (error) {
    console.error('\n❌ MySQL connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('SQL State:', error.sqlState);
    
    // Provide specific troubleshooting tips based on error
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔐 ACCESS DENIED - Authentication issue:');
      console.error('   This usually means the username/password is incorrect');
      console.error('   or the user does not have permission to connect from your IP');
      console.error('   Check that user "ecommerce_user" exists and has proper permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n📁 DATABASE NOT FOUND:');
      console.error('   The database "ecommerce_db" does not exist');
      console.error('   You need to create it first');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔌 CONNECTION REFUSED:');
      console.error('   MySQL server is not accepting connections');
      console.error('   Check if MySQL is running and configured to accept connections');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n⏰ CONNECTION TIMEOUT:');
      console.error('   Connection attempt timed out');
      console.error('   This could be a firewall or network issue');
    }
    
    process.exit(1);
  }
}

// Run the test
testMySQLConnection();