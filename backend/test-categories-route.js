const Category = require('./models/Category');

async function testCategoriesRoute() {
  try {
    console.log('Testing Category.getWithProductCount() directly...');
    const categories = await Category.getWithProductCount();
    console.log('Success! Categories count:', categories.length);
    console.log('First category:', categories[0]);
  } catch (error) {
    console.error('Error in Category.getWithProductCount():', error);
    console.error('Error stack:', error.stack);
  }
}

testCategoriesRoute();