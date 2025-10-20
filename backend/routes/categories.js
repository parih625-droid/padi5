const express = require('express');
const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

console.log('Categories router initialized');

// Validation rules
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

const paramIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
];

// Controllers
const getAllCategories = async (req, res) => {
  try {
    console.log('getAllCategories called');
    console.log('Query params:', req.query);
    const withProductCount = req.query.with_products === 'true';
    console.log('withProductCount:', withProductCount);
    
    let categories;
    if (withProductCount) {
      console.log('Calling Category.getWithProductCount()');
      categories = await Category.getWithProductCount();
    } else {
      console.log('Calling Category.getAll()');
      categories = await Category.getAll();
    }
    
    console.log('Categories fetched successfully, count:', categories.length);
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Failed to fetch category' });
  }
};

const createCategory = async (req, res) => {
  try {
    console.log('Create category request received');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;
    
    // Generate absolute URL for VPS deployment
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('Base URL:', baseUrl);
    
    const image_url = req.file ? `${baseUrl}/uploads/${req.file.filename}` : null;
    console.log('Generated image URL:', image_url);
    
    const categoryId = await Category.create({ name, description, image_url });
    const category = await Category.findById(categoryId);
    
    console.log('Category created successfully:', category);
    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    console.log('Update category request received');
    console.log('Request file:', req.file);
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description } = req.body;
    
    // Generate absolute URL for VPS deployment
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('Base URL:', baseUrl);
    
    const image_url = req.file ? `${baseUrl}/uploads/${req.file.filename}` : undefined; // undefined means not updating image
    console.log('Generated image URL:', image_url);
    
    // If no image is provided, don't update the image_url field
    const categoryData = { name, description };
    if (image_url !== undefined) {
      categoryData.image_url = image_url;
    }
    
    const updated = await Category.update(id, categoryData);
    if (!updated) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = await Category.findById(id);
    
    console.log('Category updated successfully:', category);
    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Category.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: 'Cannot delete category that has products. Please remove all products first.' 
      });
    }
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};

// Routes
console.log('Registering routes');
router.get('/', (req, res, next) => {
  console.log('Categories GET / route hit');
  next();
}, getAllCategories);

router.get('/:id', (req, res, next) => {
  console.log('Categories GET /:id route hit');
  next();
}, paramIdValidation, getCategoryById);

// Admin routes
router.post('/', (req, res, next) => {
  console.log('Categories POST / route hit');
  next();
}, auth.authenticateToken, auth.authorizeAdmin, upload.single('image'), handleMulterError, categoryValidation, createCategory);

router.put('/:id', (req, res, next) => {
  console.log('Categories PUT /:id route hit');
  next();
}, auth.authenticateToken, auth.authorizeAdmin, paramIdValidation, upload.single('image'), handleMulterError, categoryValidation, updateCategory);

router.delete('/:id', (req, res, next) => {
  console.log('Categories DELETE /:id route hit');
  next();
}, auth.authenticateToken, auth.authorizeAdmin, paramIdValidation, deleteCategory);

console.log('Routes registered');

module.exports = router;