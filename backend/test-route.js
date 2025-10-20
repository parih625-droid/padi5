const express = require('express');
const categoriesRouter = require('./routes/categories');

const app = express();
app.use('/api/categories', categoriesRouter);

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
});