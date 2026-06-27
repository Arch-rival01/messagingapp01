import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Message from './dbmessages.js';
import dns from 'dns';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

// App config
const app = express();
const port = process.env.PORT || 9000;

// Create HTTP server and attach Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'], // Support both
});

// Middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = process.env.MONGO_URI;

// Ensure DNS can resolve Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.connect(connection_url)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// API endpoints
app.get('/', (req, res) => res.status(200).send('Hello the webdev'));

app.post('/messages', async (req, res) => {
    const dbMessage = req.body;

    try {
        const data = await Message.create(dbMessage);
        console.log('Message saved to DB:', data);

        const connectedSockets = [...io.sockets.sockets.keys()];
        console.log('Connected sockets at emit time:', connectedSockets);

        // Emit to ALL connected frontend clients via Socket.io WebSocket
        io.emit('inserted', {
            sender: data.sender,
            text: data.text,
            createdAt: data.createdAt,
            _id: data._id,
        });
        console.log('✅ Socket.io event emitted to all clients');

        res.status(201).send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Debug endpoint — call from browser console: fetch('http://localhost:9000/test-emit').then(r=>r.json()).then(console.log)
app.get('/test-emit', (req, res) => {
    const connectedSockets = [...io.sockets.sockets.keys()];
    console.log('🔍 Connected sockets:', connectedSockets);
    io.emit('inserted', { sender: 'Test', text: 'Test message from server!', createdAt: new Date(), _id: 'test-id' });
    res.json({ connectedSockets });
});

app.get('/messages/sync', async (req, res) => {
    try {
        const data = await Message.find();
        res.status(200).json({ success: true, messages: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMessage = await Message.findByIdAndDelete(id);
        
        if (!deletedMessage) {
            return res.status(404).json({ success: false, error: "Message not found" });
        }

        // Broadcast to all connected clients that this message was deleted
        io.emit('deleted', id);
        
        console.log(`🗑️ Deleted message: ${id}`);
        res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Use httpServer (not app) so Socket.io WebSocket works
httpServer.listen(port, () => console.log(`Server running on port ${port}`));