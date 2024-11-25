const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const session = require('express-session');
const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();
require('./migrations');
dotenv.config();

// Convert Firebase private key from base64
const decodedPrivateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY, 'base64').toString('ascii');

// Initialize Firebase Admin with proper PEM key
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: decodedPrivateKey
  })
});

// Initialize Express app
const app = express();

// CORS middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Cross-Origin-Opener-Policy', 'Cross-Origin-Embedder-Policy']
}));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Auth middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected routes
app.options('*', cors());
app.use('/api/save-user', authenticateUser);
app.use('/api/update-user', authenticateUser);
app.use('/api/get-collaborations', authenticateUser);
app.use('/api/transcribe-video', authenticateUser);

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup with authentication
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['my-custom-header']
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

app.use(express.json());

// Initialize Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint to save user data
app.post('/api/save-user', authenticateUser, async (req, res) => {
  try {
    // Placeholder for user saving logic without MongoDB
    res.status(200).json({ message: 'User saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get collaborations for a user
app.get('/api/get-collaborations', authenticateUser, async (req, res) => {
  try {
    // Placeholder for collaborations retrieval without MongoDB
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching collaborations', error: error.message });
  }
});

// Endpoint to update user information
app.post('/api/update-user', authenticateUser, async (req, res) => {
  const { uid, displayName, photoURL } = req.body;

  try {
    // Placeholder for user update logic without MongoDB
    io.emit('user-update', { uid, displayName, photoURL });
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});

// Save complete session data
app.post('/api/save-session', authenticateUser, async (req, res) => {
  const { 
    sessionId, 
    title, 
    userId,
    transcription,
    qaData,
    extractedContent,
    highlights
  } = req.body;

  const db = new sqlite3.Database('./users.db');

  try {
    // Promisify db.run
    const runAsync = (sql, params) => new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    // Start transaction
    await runAsync('BEGIN TRANSACTION');

    // Insert session
    await runAsync(
      'INSERT OR REPLACE INTO sessions (session_id, title, user_id) VALUES (?, ?, ?)',
      [sessionId, title, userId]
    );

    // Insert transcription if exists
    if (transcription) {
      await runAsync(
        'INSERT OR REPLACE INTO transcriptions (session_id, content) VALUES (?, ?)',
        [sessionId, transcription]
      );
    }

    // Insert QA pairs if exist
    if (qaData?.length) {
      for (const qa of qaData) {
        await runAsync(
          'INSERT INTO qa_pairs (session_id, question, answer) VALUES (?, ?, ?)',
          [sessionId, qa.question, qa.answer]
        );
      }
    }

    // Insert extracted content if exists
    if (extractedContent) {
      const types = Object.keys(extractedContent);
      for (const type of types) {
        if (extractedContent[type]) {
          await runAsync(
            'INSERT OR REPLACE INTO extracted_content (session_id, content_type, content) VALUES (?, ?, ?)',
            [sessionId, type, extractedContent[type]]
          );
        }
      }
    }

    // Insert highlights if exist
    if (highlights) {
      await runAsync(
        'INSERT OR REPLACE INTO highlights (session_id, content) VALUES (?, ?)',
        [sessionId, highlights]
      );
    }

    // Commit transaction
    await runAsync('COMMIT');
    
    res.json({ success: true, message: 'Session saved successfully' });

  } catch (error) {
    // Rollback on error
    await new Promise((resolve) => {
      db.run('ROLLBACK', resolve);
    });
    res.status(500).json({ error: 'Failed to save session: ' + error.message });
  } finally {
    db.close();
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
      'Generate a summarized transcript of the audio, limited to 250 words. Ensure it is well-formatted, professional, accurate, and easily understandable for users.',
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

// Q&A feature
app.post('/api/ask-question', async (req, res) => {
  const { transcription, question } = req.body;

  try {
    // Prepare the Groq or GPT prompt
    const messages = [
      {
        role: "system",
        content: "You are an assistant that answers questions based on meeting transcriptions.",
      },
      {
        role: "user",
        content: `Based on the following transcription, answer the question:\n\nTranscription: ${transcription}\n\nQuestion: ${question}`,
      },
    ];

    // Call the Groq or LLM API
    const response = await groq.chat.completions.create({
      messages,
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = response.choices[0]?.message?.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error("Error answering question:", error);
    res.status(500).json({ error: "Failed to process the question." });
  }
});

app.post('/api/generate-title', async (req, res) => {
  const { transcription } = req.body;

  try {
    const messages = [
      {
        role: "system",
        content: "Generate a concise, professional 3-4 word title based on the meeting transcription content. The title should be clear and descriptive."
      },
      {
        role: "user",
        content: `Generate a short professional title based on this transcription: ${transcription}`
      }
    ];

    const response = await groq.chat.completions.create({
      messages,
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 50,
    });

    const title = response.choices[0]?.message?.content.trim();
    res.json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    res.status(500).json({ error: "Failed to generate title." });
  }
});

// ai smart highlighting feature 
app.post('/api/smart-highlights', async (req, res) => {
  const { transcription } = req.body;

  try {
    // Prepare the prompt for AI to generate highlights
    const messages = [
      {
        role: 'system',
        content: 'You are an assistant that highlights important sentences or questions in meeting transcriptions and provides additional context.',
      },
      {
        role: 'user',
        content: `Highlight important parts of the following transcription and provide timestamps and context:\n\n${transcription}`,
      },
    ];

    // Call the Groq or AI API
    const response = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 8192,
    });

    const highlights = response.choices[0]?.message?.content.trim();
    res.json({ highlights });
  } catch (error) {
    console.error('Error generating highlights:', error);
    res.status(500).json({ error: 'Failed to generate highlights.' });
  }
});

app.post('/api/extract-field', async (req, res) => {
  const { transcription, field } = req.body;

  try {
    // Prepare the Groq prompt message
    const messages = [
      {
        role: 'system',
        content: 'You are an assistant that extracts specific information from meeting transcriptions.',
      },
      {
        role: 'user',
        content: `Extract the ${field} from the following meeting transcription: ${transcription}`,
      },
    ];

    // Call Groq's chat completion API
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192', // Specify the model
      temperature: 0.7,
      max_tokens: 8192,
      top_p: 1,
      stop: null,
    });

    // Extract and send the result
    const result = chatCompletion.choices[0]?.message?.content.trim();
    res.json({ result });
  } catch (error) {
    console.error('Error extracting field:', error);
    res.status(500).json({ error: 'Failed to process the request.' });
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');

    // Create the users table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        displayName TEXT,
        photoURL TEXT
      )`,
      (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
      }
    );
  }
});

// Save user data route
app.post('/api/save-user', (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'User UID and email are required' });
  }

  const query = `
    INSERT INTO users (uid, email, displayName, photoURL)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET
      email = excluded.email,
      displayName = excluded.displayName,
      photoURL = excluded.photoURL
  `;

  db.run(query, [uid, email, displayName, photoURL], (err) => {
    if (err) {
      console.error('Error saving user:', err.message);
      return res.status(500).json({ error: 'Failed to save user' });
    }

    console.log('User saved:', { uid, email, displayName, photoURL });
    res.status(200).json({ message: 'User saved successfully' });
  });
});

// Update user data route
app.post('/api/update-user', (req, res) => {
  const { uid, displayName, photoURL } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  const query = `
    UPDATE users
    SET displayName = COALESCE(?, displayName),
        photoURL = COALESCE(?, photoURL)
    WHERE uid = ?
  `;

  db.run(query, [displayName, photoURL, uid], function (err) {
    if (err) {
      console.error('Error updating user:', err.message);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User updated:', { uid, displayName, photoURL });
    res.status(200).json({ message: 'User updated successfully' });
  });
});

app.get('/api/get-user/:uid', (req, res) => {
  const { uid } = req.params;

  const query = `SELECT * FROM users WHERE uid = ?`;

  db.get(query, [uid], (err, row) => {
    if (err) {
      console.error('Error fetching user:', err.message);
      return res.status(500).json({ error: 'Failed to fetch user.' });
    }

    if (!row) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(row);
  });
});

app.get('/api/get-session/:title', async (req, res) => {
  const { title } = req.params;
  const db = new sqlite3.Database('./users.db');
  
  try {
    const session = await db.get('SELECT * FROM sessions WHERE title = ?', [title]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get transcription with null check
    const transcription = await db.get(
      'SELECT content FROM transcriptions WHERE session_id = ?', 
      [session.session_id]
    );

    // Get QA data with empty array fallback
    const qaData = await db.all(
      'SELECT question, answer FROM qa_pairs WHERE session_id = ?',
      [session.session_id]
    ) || [];

    // Get extracted content with proper null handling
    const extractedContent = await db.all(
      'SELECT content_type, content FROM extracted_content WHERE session_id = ?',
      [session.session_id]
    );

    // Get highlights with null check
    const highlights = await db.get(
      'SELECT content FROM highlights WHERE session_id = ?',
      [session.session_id]
    );

    // Process extracted content safely
    let processedExtractedContent = {};
    if (Array.isArray(extractedContent) && extractedContent.length > 0) {
      processedExtractedContent = extractedContent.reduce((acc, item) => {
        if (item && item.content_type && item.content) {
          acc[item.content_type] = item.content;
        }
        return acc;
      }, {});
    }

    // Construct the response object with null checks
    const responseData = {
      ...session,
      transcription: transcription?.content || null,
      qaData: qaData || [],
      extractedContent: processedExtractedContent,
      highlights: highlights?.content || null
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session',
      details: error.message 
    });
  } finally {
    db.close();
  }
});

app.get('/api/get-sessions', async (req, res) => {
  const db = new sqlite3.Database('./users.db');

  try {
    // Fetch all sessions
    const sessions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM sessions', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (!sessions.length) {
      return res.status(404).json({ error: 'No sessions found' });
    }

    // Fetch related data for each session
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const transcription = await new Promise((resolve, reject) => {
          db.get(
            'SELECT content FROM transcriptions WHERE session_id = ?',
            [session.session_id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row ? row.content : null);
            }
          );
        });

        const qaData = await new Promise((resolve, reject) => {
          db.all(
            'SELECT question, answer FROM qa_pairs WHERE session_id = ?',
            [session.session_id],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          );
        });

        const extractedContent = await new Promise((resolve, reject) => {
          db.all(
            'SELECT content_type, content FROM extracted_content WHERE session_id = ?',
            [session.session_id],
            (err, rows) => {
              if (err) reject(err);
              else {
                const contentMap = rows.reduce((acc, item) => {
                  acc[item.content_type] = item.content;
                  return acc;
                }, {});
                resolve(contentMap);
              }
            }
          );
        });

        const highlights = await new Promise((resolve, reject) => {
          db.get(
            'SELECT content FROM highlights WHERE session_id = ?',
            [session.session_id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row ? row.content : null);
            }
          );
        });

        return {
          ...session,
          transcription,
          qaData,
          extractedContent,
          highlights,
        };
      })
    );

    res.json(sessionsWithDetails);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  } finally {
    db.close();
  }
});


// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
