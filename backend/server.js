const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const authRoutes = require('./src/routes/authRoutes');
const candidateRoutes = require('./src/routes/candidateRoutes');
const jobRoutes = require('./src/routes/jobRoutes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);

// Basic route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'HireAI API is running...' });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (data) => {
        let roomId, role;
        if (data && typeof data === 'object') {
            roomId = data.roomId;
            role = data.role;
        } else {
            roomId = data;
        }
        socket.join(roomId);
        socket.roomId = roomId;
        socket.role = role;
        console.log(`Socket ${socket.id} joined room ${roomId} as ${role || 'unknown'}`);
        socket.to(roomId).emit('user-joined', { role });
    });

    socket.on('code-update', ({ roomId, code }) => {
        socket.to(roomId).emit('code-update', code);
    });

    socket.on('language-update', ({ roomId, language }) => {
        socket.to(roomId).emit('language-update', language);
    });

    socket.on('disconnect', () => {
        if (socket.roomId) {
            socket.to(socket.roomId).emit('user-left', { role: socket.role });
        }
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
