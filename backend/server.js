const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
});

// Simple HTTP server without Express
const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Health check
    if (req.url === '/health' || req.url === '/api/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ 
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }));
        return;
    }

    // API root
    if (req.url === '/' || req.url === '/api') {
        res.writeHead(200);
        res.end(JSON.stringify({ 
            message: 'WAY Esports API is running',
            version: '1.0.0'
        }));
        return;
    }

    // 404 for everything else
    res.writeHead(404);
    res.end(JSON.stringify({
        success: false,
        error: 'Route not found'
    }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port: ${PORT}`);
}); 