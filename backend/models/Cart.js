const { pool } = require('../config/database');

class Cart {
  static async addItem(userId, productId, quantity = 1) {
    try {
      // Check if item already exists in cart
      const [existing] = await pool.execute(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );
      
      if (existing.length > 0) {
        // Update quantity
        const [result] = await pool.execute(
          'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
          [quantity, userId, productId]
        );
        return result.affectedRows > 0;
      } else {
        // Add new item
        const [result] = await pool.execute(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [userId, productId, quantity]
        );
        return result.insertId;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      console.log('=== CART MODEL: getByUserId ===');
      console.log('User ID:', userId);
      
      const query = `
        SELECT 
          c.*, 
          p.name, 
          p.description, 
          p.price, 
          COALESCE(p.image_url, pi.image_url) as image_url, 
          p.stock_quantity 
        FROM cart c 
        JOIN products p ON c.product_id = p.id 
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
        WHERE c.user_id = ? AND p.is_active = TRUE 
        ORDER BY c.created_at DESC
      `;
      
      console.log('Executing cart query...');
      const [rows] = await pool.execute(query, [userId]);
      console.log('Cart items found:', rows.length);
      console.log('Cart items:', rows);
      return rows;
    } catch (error) {
      console.error('=== CART MODEL: getByUserId ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  static async updateQuantity(userId, productId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }
    
    const [result] = await pool.execute(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId]
    );
    return result.affectedRows > 0;
  }

  static async removeItem(userId, productId) {
    const [result] = await pool.execute(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    return result.affectedRows > 0;
  }

  static async clearCart(userId) {
    try {
      console.log('=== CART MODEL: clearCart ===');
      console.log('User ID:', userId);
      
      const [result] = await pool.execute('DELETE FROM cart WHERE user_id = ?', [userId]);
      
      console.log('Cart cleared, affected rows:', result.affectedRows);
      return result.affectedRows;
    } catch (error) {
      console.error('=== CART MODEL: clearCart ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  static async getCartSummary(userId) {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as item_count,
        SUM(c.quantity * p.price) as total_price
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE c.user_id = ? AND p.is_active = TRUE
    `, [userId]);
    return rows[0];
  }

  static async validateCartItems(userId) {
    try {
      console.log('=== CART MODEL: validateCartItems ===');
      console.log('User ID:', userId);
      
      // Check if all cart items are still available and in stock
      const query = `
        SELECT 
          c.*, 
          p.name, 
          p.stock_quantity, 
          p.is_active,
          COALESCE(p.image_url, pi.image_url) as image_url
        FROM cart c 
        JOIN products p ON c.product_id = p.id 
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
        WHERE c.user_id = ?
      `;
      
      console.log('Executing cart validation query...');
      const [rows] = await pool.execute(query, [userId]);
      
      console.log('Cart validation items found:', rows.length);
      
      const issues = [];
      rows.forEach(item => {
        if (!item.is_active) {
          issues.push(`Product "${item.name}" is no longer available for purchase`);
        } else if (item.quantity > item.stock_quantity) {
          issues.push(`Product "${item.name}" - only ${item.stock_quantity} items available in stock, but you have ${item.quantity} in your cart`);
        }
      });
      
      const result = {
        valid: issues.length === 0,
        issues,
        items: rows  // Include the items for debugging
      };
      
      console.log('Cart validation result:', result);
      return result;
    } catch (error) {
      console.error('=== CART MODEL: validateCartItems ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
}

module.exports = Cart;