const { pool } = require('./config/database');

async function checkCategories() {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    console.log('Total categories in database:', rows[0].count);
    
    const [categories] = await pool.execute('SELECT * FROM categories');
    console.log('All categories:');
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategories();