const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection, initializeDatabase, insertSampleData, pool } = require('./config/database');

console.log('=== SERVER.JS STARTING ===');

// Load environment variables
dotenv.config({ path: __dirname + '/.env' });
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'Not loaded');

const app = express();

// Add a very early middleware to log all requests
app.use((req, res, next) => {
  console.log('=== VERY EARLY MIDDLEWARE ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('IP:', req.ip);
  console.log('User Agent:', req.get('User-Agent'));
  
  // Track request start time
  const startTime = Date.now();
  console.log('Request start time:', new Date(startTime).toISOString());
  
  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    console.log('Request end time:', new Date(endTime).toISOString());
    console.log('Request duration:', endTime - startTime, 'ms');
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Updated for Render deployment
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://padidekhoy.ir',
  'https://padidekhoy.ir',
  'https://www.padidekhoy.ir',
  'http://localhost:5174', // Add localhost for development
  'http://localhost:5173', // Add alternative localhost port
  'http://127.0.0.1:5174', // Add 127.0.0.1 for development
  'http://127.0.0.1:5173'  // Add alternative 127.0.0.1 port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development, be more permissive but still log
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  CORS: Allowing unlisted origin in development:', origin);
        callback(null, true);
      } else {
        // Even in production, allow requests without origin for testing
        console.log('⚠️  CORS: Allowing request without origin:', origin);
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}));

// Handle preflight OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    // Add CORS headers to all responses
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging for debugging (always enabled now for debugging)
// if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('=== REQUEST LOGGING MIDDLEWARE ===');
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
    console.log('Full URL:', req.originalUrl);
    console.log('Request headers:', req.headers);
    console.log('IP:', req.ip);
    console.log('User Agent:', req.get('User-Agent'));
    
    // Track request start time
    const startTime = Date.now();
    console.log('Request start time:', new Date(startTime).toISOString());
    
    // Override res.end to log response time
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const endTime = Date.now();
      console.log('Request end time:', new Date(endTime).toISOString());
      console.log('Request duration:', endTime - startTime, 'ms');
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  });
// }

// Static files for uploaded images with CORS headers
app.use('/uploads', (req, res, next) => {
  console.log('=== UPLOADS MIDDLEWARE ===');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Rate limiting - Enabled for production (only for API routes)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 120 * 60 * 1000, // 2 hours (changed from 15 minutes)
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5000, // Use env var or default to 5000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 7200 // 2 hours in seconds (changed from 900)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Log rate limiting checks for debugging
    const shouldSkip = req.method === 'OPTIONS' || 
                      req.url === '/api/health' || 
                      req.url.startsWith('/api/orders/payment') ||
                      (req.url === '/api/orders' && req.method === 'POST') ||
                      req.url.startsWith('/api/orders/?');
    
    console.log('RATE LIMIT CHECK:', {
      method: req.method,
      url: req.url,
      skip: shouldSkip,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    return shouldSkip;
  }
});
// Apply rate limiting only to API routes
app.use('/api', limiter);

// Routes
console.log('Mounting auth routes');
app.use('/api/auth', require('./routes/auth'));
console.log('Auth routes mounted');

console.log('Mounting products routes');
app.use('/api/products', require('./routes/products'));
console.log('Products routes mounted');

console.log('Mounting categories routes');
app.use('/api/categories', require('./routes/categories'));
console.log('Categories routes mounted');

console.log('Mounting orders routes');
app.use('/api/orders', require('./routes/orders'));
console.log('Orders routes mounted');

console.log('Mounting cart routes');
app.use('/api/cart', require('./routes/cart'));
console.log('Cart routes mounted');

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('=== HEALTH ENDPOINT HIT ===');
  res.json({ status: 'OK', message: 'E-commerce API is running' });
});

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Database test endpoint hit');
    
    // Try to get a connection from the pool
    const connection = await pool.getConnection();
    console.log('✅ Database connection established');
    
    // Run a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Simple query executed');
    
    // Release the connection
    connection.release();
    
    res.json({ 
      status: 'success', 
      message: 'Database connection is working properly',
      testResult: rows[0]
    });
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Serve a simple frontend page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>E-commerce API</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>E-commerce Backend API</h1>
            <p>Your backend API is running successfully!</p>
            <p><a href="/api/health">Health Check</a> | <a href="/api/test-db">Database Test</a></p>
            <p>Make sure to set up your database connection in Render environment variables.</p>
        </div>
    </body>
    </html>
  `);
});

// Test endpoint for orders (outside of /api/orders to avoid middleware)
app.get('/api/test-orders', (req, res) => {
  console.log('=== TEST ENDPOINT HIT ===');
  res.json({ message: 'Test endpoint working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
  });
});

// 404 handler - must be the last route
app.use((req, res) => {
  console.log('=== 404 HANDLER HIT ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Full URL:', req.originalUrl);
  console.log('Request headers:', req.headers);
  res.status(404).json({ message: 'Route not found' });
});

// Use Render's PORT or default to 5000
const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting E-commerce Server...');
    
    // Try to connect to database (non-blocking)
    try {
      console.log('📊 Testing database connection...');
      await testConnection();
      
      console.log('🗄️ Initializing database tables...');
      await initializeDatabase();
      
      console.log('📝 Inserting sample data...');
      await insertSampleData();
      
      console.log('✅ Database setup completed successfully!');
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, but server will continue running:');
      console.warn('   - Make sure MySQL server is running');
      console.warn('   - Check database credentials in .env file or Render environment variables');
      console.warn('   - Database features will not work until connected');
      console.warn(`   - Error: ${dbError.message}`);
    }
    
    // Start server regardless of database status
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/api`);
      console.log('='.repeat(50));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n💡 Development Tips:');
        console.log('   - Install and start MySQL server');
        console.log('   - Update database credentials in backend/.env');
        console.log('   - Frontend will run at http://localhost:5173');
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;