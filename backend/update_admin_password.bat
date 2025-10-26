@echo off
echo Updating admin password...
echo Make sure you're in the backend directory
echo.
node update_admin_password.js
echo.
echo Copy the generated SQL command above and run it in your MySQL client
echo.
pause