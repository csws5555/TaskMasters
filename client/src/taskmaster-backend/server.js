const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 10000;
require('dotenv').config();

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

const allowedOrigins = [
  'http://localhost:3000',
  'https://taskmastersss.netlify.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow Postman / curl (no Origin header)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      // reflect SAME origin back
      return callback(null, origin);   // <<< key line
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());

// Ensure all responses are JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Connect to database
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

// Verify database
db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) console.error(err);
  else console.log('Tables:', tables);
});

// Add this early in server.js
db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  console.log('Database tables:', tables);
});

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

// Create tasks table
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  name TEXT,
  date TEXT,
  time TEXT,
  priority TEXT,
  workload TEXT,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY(userId) REFERENCES users(id)
)`);

// Create friendships table with proper constraints
db.run(`CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  action_user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user1_id) REFERENCES users(id),
  FOREIGN KEY(user2_id) REFERENCES users(id),
  CHECK (user1_id != user2_id),
  UNIQUE (user1_id, user2_id)
)`);

// chat function
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read INTEGER DEFAULT 0,
  FOREIGN KEY(sender_id) REFERENCES users(id),
  FOREIGN KEY(receiver_id) REFERENCES users(id)
)`);

// Add this to your CREATE TABLE statements
db.run(`CREATE TABLE IF NOT EXISTS shared_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  shared_with_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(owner_id) REFERENCES users(id),
  FOREIGN KEY(shared_with_id) REFERENCES users(id),
  UNIQUE (task_id, shared_with_id)
)`);

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`, 
    [username, password], 
    function(err) {
      if (err) {
        console.error('Registration error:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Registration failed', details: err.message });
      }
      res.status(201).json({ 
        id: this.lastID,
        username: username
      });
    }
  );
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err || !row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: row.id, username: row.username });
  });
});

// Tasks endpoints
app.get('/tasks/:userId', (req, res) => {
  db.all('SELECT * FROM tasks WHERE userId = ?', [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Share task endpoint
// Share task endpoint - CORRECTED VERSION
app.post('/tasks/share', (req, res) => {
  const { taskId, ownerId, sharedWithIds } = req.body;
  console.log('Received share request:', req.body);

  // Validate sharing-specific fields (NOT task creation fields)
  const errors = [];
  if (!taskId || typeof taskId !== 'number') errors.push('taskId is required and must be a number');
  if (!ownerId || typeof ownerId !== 'number') errors.push('ownerId is required and must be a number');
  if (!sharedWithIds || !Array.isArray(sharedWithIds)) errors.push('sharedWithIds is required and must be an array');
  if (sharedWithIds && Array.isArray(sharedWithIds) && sharedWithIds.length === 0) errors.push('sharedWithIds cannot be empty');
  if (sharedWithIds && Array.isArray(sharedWithIds) && sharedWithIds.some(id => typeof id !== 'number')) errors.push('sharedWithIds must contain numbers only');

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Invalid sharing request',
      details: errors,
      received: req.body
    });
  }

  // Verify all sharedWithIds are friends with owner
  const placeholders = sharedWithIds.map(() => '?').join(',');
  const query = `
    SELECT COUNT(*) as count FROM friendships 
    WHERE ((user1_id = ? AND user2_id IN (${placeholders})) 
    OR (user1_id IN (${placeholders}) AND user2_id = ?))
    AND status = 'accepted'
  `;
  
  const params = [ownerId, ...sharedWithIds, ...sharedWithIds, ownerId];
  console.log('Friendship check query:', query, params);

  db.get(query, params, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('Friendship check result:', result);
    
    if (result.count !== sharedWithIds.length) {
      console.log('Not all users are friends');
      return res.status(400).json({ 
        error: 'Cannot share with non-friends',
        details: `Found ${result.count} friendships but need ${sharedWithIds.length}`
      });
    }

    // Insert shared task records
    const statements = sharedWithIds.map(sharedWithId => 
      `INSERT INTO shared_tasks (task_id, owner_id, shared_with_id) VALUES (?, ?, ?)`
    );
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completed = 0;
      let hasError = false;
      
      statements.forEach((stmt, i) => {
        db.run(stmt, [taskId, ownerId, sharedWithIds[i]], function(err) {
          if (err && !hasError) {
            hasError = true;
            console.error('Error sharing task:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to share task', details: err.message });
          }
          
          completed++;
          if (completed === statements.length && !hasError) {
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Commit error:', err);
                return res.status(500).json({ error: 'Failed to share task' });
              }
              console.log('Task shared successfully');
              res.json({ success: true });
            });
          }
        });
      });
    });
  });
});

// Get shared tasks endpoint
app.get('/tasks/shared/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all(`
    SELECT 
      t.*, 
      u.username as owner_username,
      st.id as shared_task_id
    FROM shared_tasks st
    JOIN tasks t ON st.task_id = t.id
    JOIN users u ON st.owner_id = u.id
    WHERE st.shared_with_id = ?
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete shared task endpoint
app.delete('/tasks/shared/:taskId', (req, res) => {
  const taskId = req.params.taskId;
  
  db.run(`DELETE FROM tasks WHERE id = ?`, [taskId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true });
  });
});


app.post('/tasks/:userId', (req, res) => {
  const userId = req.params.userId;
  const { name, date, time, priority, workload } = req.body;

  // Enhanced validation with specific error messages
  const missingFields = [];
  if (!name || name.trim() === '') missingFields.push('name');
  if (!date || date.trim() === '') missingFields.push('date');
  if (!priority || priority.trim() === '') missingFields.push('priority');

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      missingFields: missingFields
    });
  }

  db.run(
    `INSERT INTO tasks (userId, name, date, time, priority, workload, completed) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, date, time, priority, workload, 0],
    function (err) {
      if (err) {
        console.error('SQLite INSERT error:', err.message);
        return res.status(500).json({ error: 'Failed to create task' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Replace the existing PUT /tasks/:userId endpoint in server.js with this:

app.put('/tasks/:userId', (req, res) => {
  const { id, completed } = req.body;
  const userId = req.params.userId;
  
  console.log('PUT /tasks/:userId called with:', { 
    userId, 
    taskId: id, 
    completed,
    body: req.body 
  });
  
  // Validate required fields
  if (!id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }
  
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed status must be a boolean' });
  }
  
  // Update the task, but also verify it belongs to the user for security
  db.run(
    `UPDATE tasks SET completed = ? WHERE id = ? AND userId = ?`, 
    [completed ? 1 : 0, id, userId], 
    function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update task' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found or not owned by user' });
      }
      
      console.log(`Successfully updated task ${id} for user ${userId}`);
      res.json({ success: true, changes: this.changes });
    }
  );
});

app.delete('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  db.run(`DELETE FROM tasks WHERE id = ?`, [taskId], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Failed to delete task' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(200).json({ message: 'Task deleted successfully' });
    }
  });
});

// Friend system endpoints
app.get('/users/search/:username', (req, res) => {
  const searchTerm = `%${req.params.username}%`;
  const currentUserId = req.query.currentUserId;
  
  db.all(
    `SELECT id, username FROM users 
     WHERE username LIKE ? AND id != ?`,
    [searchTerm, currentUserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/friends/requests', (req, res) => {
  const { fromUserId, toUsername } = req.body;
  
  // First get the toUserId from the username
  db.get(`SELECT id FROM users WHERE username = ?`, [toUsername], (err, toUser) => {
    if (err || !toUser) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const toUserId = toUser.id;
    
    // Check if request already exists or they're already friends
    db.get(
      `SELECT * FROM friendships WHERE 
      (user1_id = ? AND user2_id = ?) OR 
      (user1_id = ? AND user2_id = ?)`, 
      [fromUserId, toUserId, toUserId, fromUserId], 
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
          const error = row.status === 'accepted' 
            ? 'You are already friends with this user' 
            : 'Friend request already exists';
          return res.status(400).json({ error });
        }
        
        // Create new request
        db.run(
          `INSERT INTO friendships (user1_id, user2_id, status, action_user_id) 
           VALUES (?, ?, 'pending', ?)`, 
          [fromUserId, toUserId, fromUserId], 
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, requestId: this.lastID });
          }
        );
      }
    );
  });
});

// Add this endpoint to server.js
app.put('/friends/requests/:requestId/accept', (req, res) => {
  const requestId = req.params.requestId;
  
  // First verify the request exists and is pending
  db.get(
    `SELECT * FROM friendships WHERE id = ? AND status = 'pending'`,
    [requestId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      // Add this debug log
      console.log('[Accept] Found request:', row);
      if (!row) return res.status(404).json({ error: 'Request not found or already processed' });

      // Update the friendship status
      db.run(
        `UPDATE friendships SET status = 'accepted', action_user_id = ? 
         WHERE id = ?`,
        [req.body.userId, requestId],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          console.log(`[Accept] Updated request ${requestId} to accepted`);
          res.json({ success: true });
        }
      );
    }
  );
});

app.put('/friends/requests/:requestId/decline', (req, res) => {
  const requestId = req.params.requestId;
  
  db.run(
    `DELETE FROM friendships WHERE id = ? AND status = 'pending'`,
    [requestId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Request not found or already processed' });
      }
      res.json({ success: true });
    }
  );
});

// Update the incoming requests endpoint
app.get('/friends/requests/incoming/:userId', (req, res) => {
  db.all(
    `SELECT 
      f.id, 
      u.id as fromUserId, 
      u.username as fromUsername, 
      f.status,
      f.action_user_id
     FROM friendships f 
     JOIN users u ON f.user1_id = u.id 
     WHERE f.user2_id = ? AND f.status = 'pending'`, 
    [req.params.userId], 
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Update outgoing requests endpoint
app.get('/friends/requests/outgoing/:userId', (req, res) => {
  db.all(
    `SELECT 
      f.id, 
      u.id as toUserId, 
      u.username as toUsername, 
      f.status,
      f.action_user_id
     FROM friendships f 
     JOIN users u ON f.user2_id = u.id 
     WHERE f.user1_id = ? AND f.status = 'pending'`, 
    [req.params.userId], 
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

app.get('/friends/:userId', (req, res) => {
  console.log(`Fetching friends for user ${req.params.userId}`);
  
  db.all(
    `SELECT 
      u.id, 
      u.username,
      datetime(f.created_at) as friendsSince
     FROM friendships f
     JOIN users u ON 
       (u.id = CASE 
          WHEN f.user1_id = ? THEN f.user2_id 
          ELSE f.user1_id 
        END)
     WHERE 
       (f.user1_id = ? OR f.user2_id = ?)
       AND f.status = 'accepted'
       AND u.id != ?`,
    [req.params.userId, req.params.userId, req.params.userId, req.params.userId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Failed to load friends',
          details: err.message 
        });
      }
      console.log(`Found ${rows.length} friends:`, rows);
      res.json(rows);
    }
  );
});

app.delete('/friends/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  
  db.run(
    `DELETE FROM friendships 
     WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
     AND status = 'accepted'`, 
    [userId, friendId, friendId, userId], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Friendship not found' });
      }
      res.json({ success: true });
    }
  );
});

// Get chat messages between two users
app.get('/messages/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  db.all(
    `SELECT m.*, u.username as sender_name 
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE (sender_id = ? AND receiver_id = ?) 
     OR (sender_id = ? AND receiver_id = ?)
     ORDER BY timestamp`,
    [userId, friendId, friendId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Send a new message
// Add this with your other routes (after app.use(cors()) but before app.listen)
app.post('/messages', (req, res) => {
  console.log('Received message:', req.body); // Debug log
  const { sender_id, receiver_id, message } = req.body;

  // Basic validation
  if (!sender_id || !receiver_id || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Insert into database
  db.run(
    `INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)`,
    [sender_id, receiver_id, message],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to save message' });
      }
      res.json({
        id: this.lastID,
        sender_id,
        receiver_id,
        message,
        timestamp: new Date().toISOString()
      });
    }
  );
});

// Mark messages as read
app.put('/messages/read', (req, res) => {
  const { userId, friendId } = req.body;
  db.run(
    `UPDATE messages SET is_read = 1 
     WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
    [friendId, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});



// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});