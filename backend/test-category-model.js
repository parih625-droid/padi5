const Category = require('./models/Category');

async function testCategoryModel() {
  try {
    console.log('Testing Category.getAll()...');
    const allCategories = await Category.getAll();
    console.log('All categories count:', allCategories.length);
    
    console.log('Testing Category.getWithProductCount()...');
    const categoriesWithCount = await Category.getWithProductCount();
    console.log('Categories with product count:', categoriesWithCount.length);
    console.log('First category with count:', categoriesWithCount[0]);
  } catch (error) {
    console.error('Error testing Category model:', error);
  }
}

testCategoryModel();