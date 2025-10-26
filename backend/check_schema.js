const { pool } = require('./config/database');

async function checkSchema() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database');
    
    // Check orders table structure
    const [rows] = await connection.execute('DESCRIBE orders');
    console.log('Orders table structure:');
    console.table(rows);
    
    // Check if total_amount column exists
    const totalAmountColumn = rows.find(row => row.Field === 'total_amount');
    if (totalAmountColumn) {
      console.log('✅ total_amount column exists');
    } else {
      console.log('❌ total_amount column does not exist');
    }
    
    connection.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();