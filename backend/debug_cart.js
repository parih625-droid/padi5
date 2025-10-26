const { pool } = require('./config/database');
const Cart = require('./models/Cart');

async function debugCart() {
  try {
    console.log('Debugging cart validation...');
    
    // Get all users with cart items
    const [users] = await pool.execute(`
      SELECT DISTINCT c.user_id 
      FROM cart c 
      JOIN users u ON c.user_id = u.id 
      LIMIT 5
    `);
    
    console.log('Users with cart items:', users.length);
    
    // Check each user's cart
    for (const user of users) {
      console.log(`\n=== Checking cart for user ${user.user_id} ===`);
      
      // Get cart items
      const cartItems = await Cart.getByUserId(user.user_id);
      console.log('Cart items:', cartItems.length);
      
      // Validate cart
      const validation = await Cart.validateCartItems(user.user_id);
      console.log('Validation result:', validation);
      
      if (!validation.valid) {
        console.log('ISSUES FOUND:');
        validation.issues.forEach(issue => console.log('  -', issue));
      }
    }
    
    console.log('\n=== Cart debugging completed ===');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error debugging cart:', error.message);
    console.error('Error stack:', error.stack);
  }
}

debugCart();