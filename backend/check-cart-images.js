require('dotenv').config();
const { pool } = require('./config/database');

async function checkCartImages() {
  try {
    console.log('Checking cart images...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_NAME:', process.env.DB_NAME);
    
    // Get cart items with product details
    const [rows] = await pool.execute(`
      SELECT c.*, p.name, p.description, p.price, p.image_url, p.stock_quantity 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE p.is_active = TRUE 
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    
    console.log('Cart items found:', rows.length);
    rows.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log('  Product ID:', item.product_id);
      console.log('  Product Name:', item.name);
      console.log('  Image URL:', item.image_url);
      console.log('  Image URL Type:', typeof item.image_url);
      console.log('  Image URL Length:', item.image_url ? item.image_url.length : 0);
    });
    
    // Also check some products directly
    console.log('\n\nChecking product images...');
    const [products] = await pool.execute(`
      SELECT id, name, image_url 
      FROM products 
      WHERE image_url IS NOT NULL 
      AND image_url != ''
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('Products with images found:', products.length);
    products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log('  Product ID:', product.id);
      console.log('  Product Name:', product.name);
      console.log('  Image URL:', product.image_url);
      console.log('  Image URL Type:', typeof product.image_url);
      console.log('  Image URL Length:', product.image_url ? product.image_url.length : 0);
    });
    
  } catch (error) {
    console.error('Error checking cart images:', error);
  } finally {
    await pool.end();
  }
}

checkCartImages();