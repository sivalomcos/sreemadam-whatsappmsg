const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let qrCodeData = null;
let clientStatus = 'DISCONNECTED';

client.on('qr', (qr) => {
    qrCodeData = qr;
    clientStatus = 'QR_RECEIVED';
    console.log('QR Received');
    io.emit('qr', qr);
});

client.on('ready', () => {
    clientStatus = 'READY';
    qrCodeData = null;
    console.log('Client is ready!');
    io.emit('ready', { message: 'WhatsApp is ready!' });
});

client.on('authenticated', () => {
    clientStatus = 'AUTHENTICATED';
    console.log('Authenticated');
    io.emit('authenticated', { message: 'Authenticated successfully' });
});

client.on('auth_failure', (msg) => {
    clientStatus = 'AUTH_FAILURE';
    console.error('Auth failure', msg);
    io.emit('auth_failure', { message: msg });
});

client.on('disconnected', (reason) => {
    clientStatus = 'DISCONNECTED';
    console.log('Client was logged out', reason);
    io.emit('disconnected', { message: 'Disconnected' });
    client.initialize();
});

// API Endpoints
app.get('/status', (req, res) => {
    res.json({ status: clientStatus, qr: qrCodeData });
});

app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (clientStatus !== 'READY') {
        return res.status(400).json({ success: false, message: 'WhatsApp client not ready' });
    }

    try {
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

client.initialize();

const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
    console.log(`WA Server running on port ${PORT}`);
});
