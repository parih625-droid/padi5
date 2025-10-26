-- SQL script to update the admin user password
-- This will set the password to 'Re1317821' (properly hashed with bcrypt)

UPDATE users 
SET password = '$2b$12$wdKObnZYlEXBQEmP3swc5OXb1c1MAX3TlysM2dRqNp/tpj7iW2eom' 
WHERE id = 1;

-- Verify the update
SELECT id, name, email, password FROM users WHERE id = 1;