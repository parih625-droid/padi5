const { pool } = require('./config/database');

async function testCategories() {
  try {
    console.log('Testing categories query...');
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
    console.log('Categories found:', rows.length);
    console.log('First category:', rows[0]);
  } catch (error) {
    console.error('Error querying categories:', error);
  } finally {
    await pool.end();
  }
}

testCategories();