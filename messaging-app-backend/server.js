import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Message from './dbmessages.js';
import User from './dbUsers.js';
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

// State to track online users
const onlineUsers = new Map(); // socket.id -> uid

// DB config
const connection_url = process.env.MONGO_URI;

// Ensure DNS can resolve Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.connect(connection_url)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Socket.io connection
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Track user online status
    socket.on('setup', (uid) => {
        onlineUsers.set(socket.id, uid);
        io.emit('onlineUsers', Array.from(new Set(onlineUsers.values())));
        console.log(`User ${uid} is online`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
        const uid = onlineUsers.get(socket.id);
        if (uid) {
            onlineUsers.delete(socket.id);
            io.emit('onlineUsers', Array.from(new Set(onlineUsers.values())));
            console.log(`User ${uid} is offline`);
        }
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
            roomId: data.roomId,
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

// User Endpoints
app.post('/users', async (req, res) => {
    try {
        const { uid, name, email, photoURL } = req.body;
        // Upsert user based on uid
        const user = await User.findOneAndUpdate(
            { uid },
            { uid, name, email, photoURL },
            { new: true, upsert: true }
        );
        res.status(200).send(user);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/users', async (req, res) => {
    try {
        const data = await User.find();
        res.status(200).send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/messages/:roomId', async (req, res) => {
    try {
        const data = await Message.find({ roomId: req.params.roomId });
        res.status(200).json({ success: true, messages: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Last Messages for all rooms a user is part of
app.get('/messages/last/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        // Find messages where the roomId contains the given uid
        const lastMessages = await Message.aggregate([
            { $match: { roomId: { $regex: uid } } },
            { $sort: { createdAt: -1 } },
            { 
                $group: { 
                    _id: "$roomId", 
                    lastMessage: { $first: "$$ROOT" } 
                } 
            }
        ]);
        
        // Convert to a nice map format { "room_id": "last message text" }
        const result = {};
        lastMessages.forEach(item => {
            result[item._id] = item.lastMessage;
        });

        res.status(200).json(result);
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