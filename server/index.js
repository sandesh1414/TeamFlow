const dotenv = require('dotenv');
dotenv.config();

// THEN all other imports below
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const chatHandler = require('./socket/chatHandler');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('❌ MongoDB error:', err));

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Routes — tasks route receives io for real-time notifications
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/tasks', require('./routes/tasks')(io));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => res.json({ message: 'Server is running!' }));

// Initialize all socket event handlers
chatHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
