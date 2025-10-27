const { pool } = require('./config/database');

async function testDashboardStats() {
  try {
    console.log('Testing dashboard stats query...');
    
    // Test individual queries
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    console.log('Total orders:', totalOrders[0].count);
    
    const [totalRevenue] = await pool.execute('SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"');
    console.log('Total revenue:', totalRevenue[0].total || 0);
    
    const [pendingOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');
    console.log('Pending orders:', pendingOrders[0].count);
    
    const [recentOrders] = await pool.execute(`
      SELECT o.*, u.name as user_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `);
    console.log('Recent orders count:', recentOrders.length);
    
    console.log('All queries executed successfully!');
    console.log('Dashboard stats are working correctly.');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error testing dashboard stats:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('Error stack:', error.stack);
  }
}

testDashboardStats();