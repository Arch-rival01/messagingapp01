import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Message from './dbmessages.js';

dotenv.config();

// app config
const app = express();
const port = process.env.PORT || 9000;

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/<your-database-name>?retryWrites=true&w=majority';

mongoose.connect(connection_url)
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Api endpoints
app.get('/', (req, res) => res.status(200).send('Hello the webdev'));

app.post('/messages', (req, res) => {
    const dbMessage = req.body;

    Message.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

app.get('/messages', (req, res) => {

    Message.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});
     

// listeners
app.listen(port, () => console.log(`Server running on port ${port}`));