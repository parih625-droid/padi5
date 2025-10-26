// Simple script to test cart validation without database connection
const express = require('express');
const app = express();

// Mock the Cart model validation function
const mockCartValidation = (cartItems) => {
  const issues = [];
  
  cartItems.forEach(item => {
    if (!item.is_active) {
      issues.push(`${item.name} is no longer available`);
    } else if (item.quantity > item.stock_quantity) {
      issues.push(`${item.name} - only ${item.stock_quantity} available, you have ${item.quantity} in cart`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
};

// Example cart items that would cause validation to fail
const exampleCartItems = [
  {
    name: "Smartphone",
    is_active: true,
    stock_quantity: 5,
    quantity: 10  // This will fail validation - more in cart than in stock
  },
  {
    name: "Laptop",
    is_active: false,  // This will fail validation - product is inactive
    stock_quantity: 10,
    quantity: 1
  }
];

app.get('/test-cart-validation', (req, res) => {
  console.log('Testing cart validation with example data...');
  
  const validation = mockCartValidation(exampleCartItems);
  
  res.json({
    message: 'Cart validation test',
    validation,
    exampleItems: exampleCartItems
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Cart validation test server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/test-cart-validation to see the validation results`);
});