// Simple script to debug registered routes
const express = require('express');
const app = express();

// Mock the middleware and routes to see what gets registered
console.log('=== ROUTE DEBUGGING ===');

// Simulate route mounting
const routes = [
  '/api/auth',
  '/api/products', 
  '/api/categories',
  '/api/orders',
  '/api/cart',
  '/api/health'
];

console.log('Registered routes:');
routes.forEach(route => {
  console.log('  -', route);
});

console.log('\nTo test health endpoint, try:');
console.log('  GET http://87.107.12.71:5000/api/health');
console.log('\nTo test main API page, try:');
console.log('  GET http://87.107.12.71:5000/api');

console.log('\nIf you are getting "Route not found", check:');
console.log('1. Is the server actually running on port 5000?');
console.log('2. Is there a reverse proxy (nginx, Apache) in front of your app?');
console.log('3. Are you accessing the correct port?');
console.log('4. Is there a firewall blocking the connection?');