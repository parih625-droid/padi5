const { pool } = require('../config/database');

async function updateOrdersTable() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database');
    
    // Add missing columns to orders table
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0
      `);
      console.log('✅ Added total_amount column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('✅ total_amount column already exists');
      } else {
        console.error('Error adding total_amount column:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN shipping_address TEXT
      `);
      console.log('✅ Added shipping_address column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('✅ shipping_address column already exists');
      } else {
        console.error('Error adding shipping_address column:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN payment_method VARCHAR(50)
      `);
      console.log('✅ Added payment_method column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('✅ payment_method column already exists');
      } else {
        console.error('Error adding payment_method column:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending'
      `);
      console.log('✅ Added payment_status column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('✅ payment_status column already exists');
      } else {
        console.error('Error adding payment_status column:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN transaction_id VARCHAR(255)
      `);
      console.log('✅ Added transaction_id column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('✅ transaction_id column already exists');
      } else {
        console.error('Error adding transaction_id column:', error.message);
      }
    }
    
    // Remove old columns that are no longer needed
    try {
      await connection.execute(`
        ALTER TABLE orders 
        DROP COLUMN customer_name
      `);
      console.log('✅ Removed customer_name column');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('✅ customer_name column already removed');
      } else {
        console.error('Error removing customer_name column:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE orders 
        DROP COLUMN customer_phone
      `);
      console.log('✅ Removed customer_phone column');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('✅ customer_phone column already removed');
      } else {
        console.error('Error removing customer_phone column:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE orders 
        DROP COLUMN customer_address
      `);
      console.log('✅ Removed customer_address column');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('✅ customer_address column already removed');
      } else {
        console.error('Error removing customer_address column:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE orders 
        DROP COLUMN notes
      `);
      console.log('✅ Removed notes column');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('✅ notes column already removed');
      } else {
        console.error('Error removing notes column:', error.message);
      }
    }
    
    // Rename total_price to total_amount
    try {
      // First, copy data from total_price to total_amount
      await connection.execute(`
        UPDATE orders SET total_amount = total_price WHERE total_amount = 0
      `);
      console.log('✅ Copied data from total_price to total_amount');
      
      // Then drop the total_price column
      await connection.execute(`
        ALTER TABLE orders 
        DROP COLUMN total_price
      `);
      console.log('✅ Removed total_price column');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('✅ total_price column already removed');
      } else {
        console.error('Error removing total_price column:', error.message);
      }
    }
    
    connection.release();
    console.log('✅ Database schema updated successfully');
  } catch (error) {
    console.error('Error updating database schema:', error.message);
  }
}

updateOrdersTable();