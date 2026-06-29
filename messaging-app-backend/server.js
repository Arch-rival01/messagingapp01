import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Message from './dbmessages.js';
import User from './dbUsers.js';
import dns from 'dns';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    try {
        serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf-8'));
    } catch (e) {
        console.error("Could not load serviceAccountKey.json. Please ensure it exists.");
    }
}
if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
}

// Security Middleware to verify tokens
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach user info to the request
        next(); // Token is valid, proceed to the API endpoint
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).send('Unauthorized: Invalid token');
    }
};

// Admin Middleware
const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.email === process.env.ADMIN_EMAIL) {
        next();
    } else {
        res.status(403).send('Forbidden: Admin access required');
    }
};

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

    socket.on('typing', ({ roomId, uid }) => {
        socket.broadcast.emit('typing', { roomId, uid });
    });

    socket.on('stopTyping', ({ roomId, uid }) => {
        socket.broadcast.emit('stopTyping', { roomId, uid });
    });
});

// API endpoints
app.get('/', (req, res) => res.status(200).send('Hello the webdev'));

// Register FCM Token for push notifications
app.post('/users/fcm-token', verifyToken, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token required' });
        
        await User.findOneAndUpdate(
            { uid: req.user.uid },
            { $addToSet: { fcmTokens: token } }, // addToSet prevents duplicate tokens
            { returnDocument: 'after' }
        );
        res.status(200).json({ success: true, message: 'FCM token registered' });
    } catch (error) {
        console.error("Error saving FCM token:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/messages', verifyToken, async (req, res) => {
    try {
        // Double check if user is suspended before allowing message
        const user = await User.findOne({ uid: req.user.uid });
        if (user && user.isSuspended) {
            return res.status(403).json({ error: "Your account is suspended." });
        }

        const dbMessage = req.body;
        const data = await Message.create(dbMessage);
        console.log('Message saved to DB:', data);

        // --- FCM PUSH NOTIFICATION LOGIC ---
        try {
            // roomId is typically formatted as uid1_uid2
            const uids = data.roomId.split('_');
            if (uids.length === 2) {
                const recipientUid = uids.find(id => id !== req.user.uid);
                if (recipientUid) {
                    const recipient = await User.findOne({ uid: recipientUid });
                    if (recipient && recipient.fcmTokens && recipient.fcmTokens.length > 0) {
                        const messagePayload = {
                            notification: {
                                title: `New message from ${data.sender}`,
                                body: data.text || (data.mediaUrl ? '📷 Sent a media file' : 'New message')
                            },
                            tokens: recipient.fcmTokens,
                        };
                        
                        // Send multicast message to all of the recipient's devices
                        const response = await getMessaging().sendEachForMulticast(messagePayload);
                        console.log('Successfully sent push notification:', response.successCount, 'messages sent.');
                        
                        // Optionally clean up invalid tokens if response.failureCount > 0
                        if (response.failureCount > 0) {
                            const failedTokens = [];
                            response.responses.forEach((resp, idx) => {
                                if (!resp.success) failedTokens.push(recipient.fcmTokens[idx]);
                            });
                            if (failedTokens.length > 0) {
                                await User.updateOne(
                                    { uid: recipientUid },
                                    { $pullAll: { fcmTokens: failedTokens } }
                                );
                            }
                        }
                    }
                }
            }
        } catch (fcmError) {
            console.error('Error sending FCM push notification:', fcmError);
        }
        // ------------------------------------

        const connectedSockets = [...io.sockets.sockets.keys()];
        console.log('Connected sockets at emit time:', connectedSockets);

        // Emit to ALL connected frontend clients via Socket.io WebSocket
        io.emit('inserted', {
            sender: data.sender,
            text: data.text,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
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

app.get('/cloudinary/signature', verifyToken, (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request(
            { timestamp },
            process.env.CLOUDINARY_API_SECRET
        );
        res.status(200).json({ 
            timestamp, 
            signature, 
            api_key: process.env.CLOUDINARY_API_KEY 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
app.post('/users', verifyToken, async (req, res) => {
    try {
        const { uid, name, email, photoURL } = req.body;
        // Upsert user based on uid
        const user = await User.findOneAndUpdate(
            { uid },
            { uid, name, email, photoURL },
            { new: true, upsert: true }
        );
        
        io.emit('newUser', user);

        res.status(200).send(user);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Analytics Endpoint
app.get('/admin/analytics', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMessages = await Message.countDocuments();
        
        // Messages sent today
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        const messagesToday = await Message.countDocuments({ createdAt: { $gte: startOfToday } });
        
        const onlineNow = onlineUsers.size;

        res.status(200).json({ totalUsers, totalMessages, messagesToday, onlineNow });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Suspend/Unsuspend User
app.post('/admin/users/:uid/suspend', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.isSuspended = !user.isSuspended;
        await user.save();

        io.emit('userSuspended', { uid, isSuspended: user.isSuspended });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User Messages (God Eye)
app.get('/admin/users/:uid/messages', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: "User not found" });

        const messages = await Message.find({ sender: user.name })
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/users', verifyToken, async (req, res) => {
    try {
        const data = await User.find();
        res.status(200).send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.delete('/users/:uid', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { uid } = req.params;
        
        // 1. Delete from MongoDB
        const deletedUser = await User.findOneAndDelete({ uid });
        
        if (!deletedUser) {
            return res.status(404).json({ success: false, error: "User not found in database" });
        }
        
        // 3. Emit to all clients so they remove the user from sidebar
        io.emit('userDeleted', uid);
        
        console.log(`🗑️ Deleted user: ${uid}`);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/messages/:roomId', verifyToken, async (req, res) => {
    try {
        const data = await Message.find({ roomId: req.params.roomId });
        res.status(200).json({ success: true, messages: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/messages/read/:roomId', verifyToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { readerName } = req.body;

        await Message.updateMany(
            { roomId, sender: { $ne: readerName }, read: false },
            { $set: { read: true } }
        );

        io.emit('messagesRead', { roomId, readerName });
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Last Messages for all rooms a user is part of
app.get('/messages/last/:uid', verifyToken, async (req, res) => {
    try {
        const { uid } = req.params;
        const { name } = req.query; // Passed from frontend to know who is reading
        
        // Find messages where the roomId contains the given uid
        const lastMessages = await Message.aggregate([
            { $match: { roomId: { $regex: uid } } },
            { $sort: { createdAt: -1 } },
            { 
                $group: { 
                    _id: "$roomId", 
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: { 
                        $sum: { 
                            $cond: [
                                { $and: [ { $eq: ["$read", false] }, { $ne: ["$sender", name] } ] }, 
                                1, 
                                0
                            ] 
                        } 
                    }
                } 
            }
        ]);
        
        // Convert to a nice map format { "room_id": { lastMessage, unreadCount } }
        const result = {};
        lastMessages.forEach(item => {
            result[item._id] = { lastMessage: item.lastMessage, unreadCount: item.unreadCount };
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/messages/:id', verifyToken, verifyAdmin, async (req, res) => {
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