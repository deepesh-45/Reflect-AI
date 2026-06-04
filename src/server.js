const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend compatibility
app.use(cors({
  origin: '*', // Allow all origins for dev/testing. Can lock down in prod.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Import Routers
const journalRouter = require('./routes/journal');
const chatRouter = require('./routes/chat');
const communityRouter = require('./routes/community');
const lettersRouter = require('./routes/letters');
const assistantRouter = require('./routes/assistant');
const dashboardRouter = require('./routes/dashboard');

// Bind Routers
app.use('/api/journal', journalRouter);
app.use('/api/chat', chatRouter);
app.use('/api/community', communityRouter);
app.use('/api/letters', lettersRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/dashboard', dashboardRouter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    firebaseReady: require('./config/firebase').isFirebaseReady()
  });
});

// Centralized Error-Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong on the server.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`ReflectAI Backend Server is running on port ${PORT}`);
});
