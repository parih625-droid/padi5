const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');

const getAllProducts = async (req, res) => {
  try {
    // Parse query parameters
    const filters = {
      category_id: req.query.category_id,
      search: req.query.search,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      is_amazing_offer: req.query.is_amazing_offer,
      limit: req.query.limit,
      offset: req.query.offset
    };

    const products = await Product.getAll(filters);
    res.json({ products });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
      
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
      
    res.json({ product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

const createProduct = async (req, res) => {
  try {
    console.log('Create product request received');
    console.log('Request files:', req.files);
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    const { name, description, price, category_id, stock_quantity, is_amazing_offer, discount_percentage } = req.body;
      
    // Validate required fields
    if (!name || !price || !category_id) {
      return res.status(400).json({ 
        message: 'Name, price, and category are required' 
      });
    }

    // Generate absolute URL for VPS deployment
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('Base URL:', baseUrl);
    
    const image_url = req.file ? `${baseUrl}/uploads/${req.file.filename}` : null;
    console.log('Generated primary image URL:', image_url);

    const productData = {
      name,
      description: description || '',
      price: parseFloat(price),
      image_url,
      category_id: parseInt(category_id),
      stock_quantity: parseInt(stock_quantity) || 0,
      is_amazing_offer: is_amazing_offer === 'true' || is_amazing_offer === true,
      discount_percentage: parseInt(discount_percentage) || 0
    };

    const productId = await Product.create(productData);
    console.log('Product created with ID:', productId);
      
    // If there are additional images, add them with absolute URLs
    if (req.files && req.files.length > 0) {
      console.log('Processing additional images:', req.files.length);
      const imageUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
      console.log('Generated additional image URLs:', imageUrls);
      await Product.addImages(productId, imageUrls);
    }
      
    const product = await Product.findById(productId);
    console.log('Final product data:', product);
    res.status(201).json({ 
      message: 'Product created successfully',
      product 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log('Update product request received');
    console.log('Request files:', req.files);
    console.log('Request file:', req.file);
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { id } = req.params;
    const { name, description, price, category_id, stock_quantity, is_amazing_offer, discount_percentage } = req.body;
      
    // Prepare update data
    const updateData = {};
      
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category_id !== undefined) updateData.category_id = parseInt(category_id);
    if (stock_quantity !== undefined) updateData.stock_quantity = parseInt(stock_quantity);
      
    // Convert is_amazing_offer to boolean if present
    if ('is_amazing_offer' in req.body) {
      updateData.is_amazing_offer = req.body.is_amazing_offer === 'true' || req.body.is_amazing_offer === true;
    }
      
    // Convert discount_percentage to integer if present
    if ('discount_percentage' in req.body) {
      updateData.discount_percentage = parseInt(req.body.discount_percentage) || 0;
    }
      
    // Handle image update with absolute URL
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      console.log('Base URL:', baseUrl);
      updateData.image_url = `${baseUrl}/uploads/${req.file.filename}`;
      console.log('Generated primary image URL:', updateData.image_url);
    }
      
    const updated = await Product.update(id, updateData);
      
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
      
    // If there are additional images, add them with absolute URLs
    if (req.files && req.files.length > 0) {
      console.log('Processing additional images:', req.files.length);
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      console.log('Base URL:', baseUrl);
      const imageUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
      console.log('Generated additional image URLs:', imageUrls);
      await Product.addImages(id, imageUrls);
    }
      
    const product = await Product.findById(id);
    console.log('Final product data:', product);
    res.json({ 
      message: 'Product updated successfully',
      product 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Product.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }

    const filters = {
      search: q.trim(),
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const products = await Product.getAll(filters);
    
    res.json({
      products,
      query: q,
      count: products.length
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ message: 'Failed to search products' });
  }
};

const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const products = await Product.getBestSelling(limit, offset);
    
    res.json({ products });
  } catch (error) {
    console.error('Get best selling products error:', error);
    res.status(500).json({ message: 'Failed to fetch best selling products' });
  }
};

const getNewestProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.getNewest(limit);
    
    res.json({ products });
  } catch (error) {
    console.error('Get newest products error:', error);
    res.status(500).json({ message: 'Failed to fetch newest products' });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const products = await Product.getFeatured(limit);
    
    res.json({ products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Failed to fetch featured products' });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const products = await Product.getByCategory(categoryId, limit);
    
    res.json({ products });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Failed to fetch products by category' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getFeaturedProducts,
  getNewestProducts,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getBestSellingProducts
};