// Debug server to check route matching
const express = require('express');
const app = express();

// Add comprehensive logging middleware
app.use((req, res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Path:', req.path);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);
  console.log('IP:', req.ip);
  console.log('========================\n');
  next();
});

// Add all the routes from your server.js
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'OK', message: 'E-commerce API is running' });
});

// Database connection test endpoint
app.get('/api/test-db', (req, res) => {
  console.log('Database test endpoint hit');
  res.json({ 
    status: 'success', 
    message: 'Database test endpoint working'
  });
});

// Serve a simple frontend page
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>E-commerce API Debug</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>E-commerce Backend API Debug</h1>
            <p>Your backend API debug server is running!</p>
            <p><a href="/api/health">Health Check</a> | <a href="/api/test-db">Database Test</a></p>
        </div>
    </body>
    </html>
  `);
});

// 404 handler - must be the last route
app.use((req, res) => {
  console.log('=== 404 HANDLER HIT ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Full URL:', req.originalUrl);
  res.status(404).json({ message: 'Route not found - Debug Server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});