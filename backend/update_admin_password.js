const bcrypt = require('bcryptjs');

// Hash a new password
const newPassword = 'Re1317821'; // Make sure this meets the requirements
const saltRounds = 12;

bcrypt.hash(newPassword, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  
  console.log('New hashed password:');
  console.log(hash);
  console.log('\nSQL command to update the admin password:');
  console.log(`UPDATE users SET password = '${hash}' WHERE id = 1;`);
});