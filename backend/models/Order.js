const { pool } = require('../config/database');

class Order {
  static async create(orderData) {
    console.log('=== ORDER MODEL: CREATE START ===');
    const connection = await pool.getConnection();
    
    try {
      console.log('=== ORDER MODEL: GOT CONNECTION ===');
      await connection.beginTransaction();
      console.log('=== ORDER MODEL: TRANSACTION STARTED ===');
      
      const { user_id, customer_name, customer_phone, customer_address, notes, items } = orderData;
      
      console.log('=== ORDER MODEL: CREATE ===');
      console.log('Order data:', orderData);
      
      // Calculate total amount
      let total_amount = 0;
      for (const item of items) {
        total_amount += item.price * item.quantity;
      }
      console.log('Calculated total amount:', total_amount);
      
      // Combine customer info into shipping_address field
      const shipping_address = JSON.stringify({
        customer_name,
        customer_phone,
        customer_address,
        notes: notes || null
      });
      
      // Create order - using the correct database schema
      console.log('Executing order insert query...');
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status) VALUES (?, ?, ?, ?, ?)',
        [user_id, total_amount, shipping_address, 'pending', 'pending']
      );
      
      const orderId = orderResult.insertId;
      console.log('Order created with ID:', orderId);
      
      // Create order items and update product stock
      for (const item of items) {
        console.log('Creating order item:', item);
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price]
        );
        
        // Update product stock
        console.log('Updating product stock for product:', item.product_id, 'quantity:', item.quantity);
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
      
      await connection.commit();
      console.log('Order creation completed successfully');
      return orderId;
    } catch (error) {
      console.error('=== ORDER MODEL: CREATE ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
      console.log('=== ORDER MODEL: CONNECTION RELEASED ===');
    }
  }

  static async findById(id) {
    console.log('=== ORDER MODEL: findById ===');
    console.log('Order ID:', id);
    
    const startTime = Date.now();
    const [rows] = await pool.execute(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.id = ?
    `, [id]);
    
    const endTime = Date.now();
    console.log('Query duration:', endTime - startTime, 'ms');
    console.log('Rows found:', rows.length);
    
    if (rows.length > 0) {
      // Parse shipping_address JSON back to individual fields
      try {
        const shippingInfo = JSON.parse(rows[0].shipping_address);
        rows[0].customer_name = shippingInfo.customer_name;
        rows[0].customer_phone = shippingInfo.customer_phone;
        rows[0].customer_address = shippingInfo.customer_address;
        rows[0].notes = shippingInfo.notes;
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
      return rows[0];
    }
    
    return null;
  }

  static async getOrderItems(orderId) {
    console.log('=== ORDER MODEL: getOrderItems ===');
    console.log('Order ID:', orderId);
    
    const startTime = Date.now();
    const [rows] = await pool.execute(`
      SELECT oi.*, p.name as product_name, p.image_url 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `, [orderId]);
    
    const endTime = Date.now();
    console.log('Query duration:', endTime - startTime, 'ms');
    console.log('Rows found:', rows.length);
    
    return rows;
  }

  static async getByUserId(userId, limit = 20, offset = 0) {
    const [rows] = await pool.execute(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    // Parse shipping_address for all orders
    rows.forEach(order => {
      try {
        const shippingInfo = JSON.parse(order.shipping_address);
        order.customer_name = shippingInfo.customer_name;
        order.customer_phone = shippingInfo.customer_phone;
        order.customer_address = shippingInfo.customer_address;
        order.notes = shippingInfo.notes;
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
    });
    
    return rows;
  }

  static async getAll(limit = 50, offset = 0) {
    try {
      console.log('Executing Order.getAll query with limit:', limit, 'offset:', offset);
      // Convert limit and offset to integers to ensure correct types
      const limitInt = parseInt(limit);
      const offsetInt = parseInt(offset);
      
      // Use string interpolation for LIMIT and OFFSET to avoid parameter binding issues
      const query = `
        SELECT o.*, u.name as user_name, u.email as user_email 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC 
        LIMIT ${limitInt} OFFSET ${offsetInt}
      `;
      
      const [rows] = await pool.execute(query);
      console.log('Query executed successfully, rows found:', rows.length);
      console.log('Sample rows:', rows.slice(0, 2)); // Log first 2 rows for debugging
      
      // Parse shipping_address for all orders
      rows.forEach(order => {
        try {
          const shippingInfo = JSON.parse(order.shipping_address);
          order.customer_name = shippingInfo.customer_name;
          order.customer_phone = shippingInfo.customer_phone;
          order.customer_address = shippingInfo.customer_address;
          order.notes = shippingInfo.notes;
        } catch (e) {
          console.error('Error parsing shipping address:', e);
        }
      });
      
      return rows;
    } catch (error) {
      console.error('=== ORDER MODEL GETALL ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      // Return empty array instead of throwing error to prevent 500
      return [];
    }
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async getOrderWithItems(id) {
    console.log('=== ORDER MODEL: getOrderWithItems ===');
    console.log('Order ID:', id);
    
    const startTime = Date.now();
    const order = await this.findById(id);
    if (order) {
      order.items = await this.getOrderItems(id);
    }
    
    const endTime = Date.now();
    console.log('getOrderWithItems duration:', endTime - startTime, 'ms');
    
    return order;
  }

  static async getDashboardStats() {
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [totalRevenue] = await pool.execute('SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"');
    const [pendingOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');
    const [recentOrders] = await pool.execute(`
      SELECT o.*, u.name as user_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `);

    // Parse shipping_address for recent orders
    recentOrders.forEach(order => {
      try {
        const shippingInfo = JSON.parse(order.shipping_address);
        order.customer_name = shippingInfo.customer_name;
        order.customer_phone = shippingInfo.customer_phone;
        order.customer_address = shippingInfo.customer_address;
        order.notes = shippingInfo.notes;
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
    });

    return {
      totalOrders: totalOrders[0].count,
      totalRevenue: totalRevenue[0].total || 0,
      pendingOrders: pendingOrders[0].count,
      recentOrders
    };
  }

  static async updatePaymentInfo(id, paymentData) {
    console.log('=== ORDER MODEL: updatePaymentInfo ===');
    console.log('Order ID:', id);
    console.log('Payment Data:', paymentData);
    
    const fields = [];
    const values = [];
    
    Object.keys(paymentData).forEach(key => {
      if (paymentData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(paymentData[key]);
      }
    });
    
    if (fields.length === 0) {
      console.log('No fields to update');
      return false;
    }
    
    values.push(id);
    
    const startTime = Date.now();
    const [result] = await pool.execute(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const endTime = Date.now();
    console.log('Query duration:', endTime - startTime, 'ms');
    console.log('Affected rows:', result.affectedRows);
    
    return result.affectedRows > 0;
  }

  // Delete order by ID (only for pending orders)
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // First check if order is pending
      const [orderRows] = await connection.execute(
        'SELECT status FROM orders WHERE id = ?',
        [id]
      );
      
      if (orderRows.length === 0) {
        return false; // Order not found
      }
      
      if (orderRows[0].status !== 'pending') {
        throw new Error('Only pending orders can be deleted');
      }
      
      // Delete order items first (due to foreign key constraints)
      await connection.execute(
        'DELETE FROM order_items WHERE order_id = ?',
        [id]
      );
      
      // Delete the order
      const [result] = await connection.execute(
        'DELETE FROM orders WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Order;