require('dotenv').config();

console.log('Environment Variables Test:');
console.log('==========================');
console.log('BASE_URL:', process.env.BASE_URL || 'Not set');
console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');

// Test the URL generation logic
const req = {
  protocol: 'http',
  get: (header) => {
    if (header === 'host') return 'localhost:5000';
    return null;
  }
};

const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
console.log('\nURL Generation Test:');
console.log('====================');
console.log('Generated base URL:', baseUrl);
console.log('Generated image URL:', `${baseUrl}/uploads/test-image.jpg`);