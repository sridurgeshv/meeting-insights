const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const {Groq} = require("groq-sdk");
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose')
dotenv.config();
const app = express();


// Enable CORS for the Express app
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
const server = http.createServer(app);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

// Transcription route for video files
app.post('/api/transcribe-video', upload.single('video'), async (req, res) => {
  try {
    const videoPath = req.file.path;
    const audioPath = `${videoPath}.mp3`;

    // Step 1: Extract audio from the video file using FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Step 2: Initialize the Google File Manager with API key
    const fileManager = new GoogleAIFileManager(process.env.API_KEY);

    // Step 3: Upload the extracted audio file to Google API
    const uploadResult = await fileManager.uploadFile(audioPath, {
      mimeType: 'audio/mp3',
      displayName: 'Extracted Audio',
    });

    // Step 4: Check the file processing status
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      file = await fileManager.getFile(uploadResult.file.name);
    }

    // Step 5: Handle any errors if processing failed
    if (file.state === FileState.FAILED) {
      return res.status(500).json({ error: 'Audio processing failed.' });
    }

    // Step 6: Generate a response using the Generative AI model
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent([
      'Generate a summarized transcript of the audio, limited to 450 words. Ensure it is well-formatted, professional, accurate, and easily understandable for users.',
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    // Step 7: Clean up temporary files (optional)
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);

    // Step 8: Send the transcription result
    res.json({ transcription: result.response.text() });
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).json({ error: 'An error occurred during transcription.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});