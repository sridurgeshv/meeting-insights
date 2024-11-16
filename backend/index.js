const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const {Groq} = require("groq-sdk");
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose')
dotenv.config();
const app = express();
const groq = new Groq({ apiKey: process.env.Gorq_API_KEY });

// Enable CORS for the Express app
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
const server = http.createServer(app);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  displayName: String,
  photoURL: String,
});

const User = mongoose.model('User', userSchema);

// Define Collaboration schema and model
const collaborationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  userId: String,
  collaboratorId: String,
  projectId: String,
  projectTitle: String,
  createdAt: { type: Date, default: Date.now }
});

const Collaboration = mongoose.model('Collaboration', collaborationSchema);

// Endpoint to save user data
app.post('/api/save-user', async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  try {
    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({ uid, email, displayName, photoURL });
      await user.save();
    }
    res.status(200).json({ message: 'User saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving user', error });
  }
});

// Endpoint to get collaborations for a user
app.get('/api/get-collaborations/:userId', async (req, res) => {
  try {
  const collaborations = await db.all(
  'SELECT DISTINCT collaboratorId, projectId, projectTitle, MAX(createdAt) as createdAt FROM collaborations WHERE userId = ? GROUP BY collaboratorId ORDER BY createdAt DESC LIMIT 5',
  req.params.userId
  );
  
  const collaboratorIds = collaborations.map(c => c.collaboratorId);
  const collaborators = await User.find({ uid: { $in: collaboratorIds } });
  
  const result = collaborations.map(c => {
  const collaborator = collaborators.find(user => user.uid === c.collaboratorId);
  return {
  id: c.projectId,
  projectTitle: c.projectTitle,
  createdAt: c.createdAt,
  collaborator: {
  uid: collaborator.uid,
  displayName: collaborator.displayName,
  photoURL: collaborator.photoURL
  }
  };
  });
  
  res.json(result);
  } catch (error) {
  res.status(500).json({ message: 'Error fetching collaborations', error: error.message });
  }
  });

  // Endpoint to update user information
app.post('/api/update-user', async (req, res) => {
  const { uid, displayName, photoURL } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { uid },
      { displayName, photoURL },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Emit a socket event to notify clients of the user update
    io.emit('user-update', { uid, displayName, photoURL });

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});