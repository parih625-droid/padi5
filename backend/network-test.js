// Simple network test script to check if port 3306 is accessible on your VPS
const net = require('net');

const host = '87.107.12.71';
const port = 3306;
const timeout = 5000; // 5 seconds

console.log(`Testing connection to ${host}:${port}`);

const socket = new net.Socket();

socket.setTimeout(timeout);

socket.connect(port, host, () => {
    console.log(`✅ Connection successful to ${host}:${port}`);
    socket.destroy();
});

socket.on('error', (err) => {
    console.log(`❌ Connection failed to ${host}:${port}`);
    console.log(`Error: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
        console.log('The server is not accepting connections on this port');
    } else if (err.code === 'ETIMEDOUT') {
        console.log('Connection timed out - the server may be unreachable');
    } else if (err.code === 'ENETUNREACH') {
        console.log('Network is unreachable');
    }
});

socket.on('timeout', () => {
    console.log(`❌ Connection timed out to ${host}:${port}`);
    socket.destroy();
});