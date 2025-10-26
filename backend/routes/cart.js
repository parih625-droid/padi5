const express = require('express');
const { body, param } = require('express-validator');
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

const updateCartValidation = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('quantity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be between 0 and 100')
];

const paramProductIdValidation = [
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
];

// Routes - all cart routes require authentication
router.get('/', auth.authenticateToken, cartController.getCart);
router.post('/', auth.authenticateToken, addToCartValidation, cartController.addToCart);
router.put('/', auth.authenticateToken, updateCartValidation, cartController.updateCartItem);
router.delete('/clear', auth.authenticateToken, cartController.clearCart);
router.delete('/:product_id', auth.authenticateToken, paramProductIdValidation, cartController.removeFromCart);
router.get('/validate', auth.authenticateToken, cartController.validateCart);

// Debug endpoint - only for development
if (process.env.NODE_ENV === 'development') {
  router.get('/debug', auth.authenticateToken, auth.authorizeAdmin, async (req, res) => {
    try {
      const userId = req.user.id;
      const validation = await Cart.validateCartItems(userId);
      res.json({
        userId,
        validation,
        message: 'Cart debug information'
      });
    } catch (error) {
      console.error('Cart debug error:', error);
      res.status(500).json({ message: 'Failed to debug cart' });
    }
  });
}

module.exports = router;