// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5000;

app.use(cors());
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

// verify datbase
db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) console.error(err);
    else console.log('Tables:', tables);
  });

// login data
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);
  
  // And link tasks to users:
// Drop and recreate tasks table with userId included
db.serialize(() => {
  //db.run(`ALTER TABLE tasks ADD COLUMN workload TEXT`);
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      name TEXT,
      date TEXT,
      time TEXT,
      priority TEXT,
      workload TEXT,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating tasks table:', err.message);
    else console.log('Recreated tasks table with userId');
  });
});

  
// register
// In server.js, modify the register endpoint:
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
  
//login 
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
      if (err || !row) return res.status(401).send('Invalid credentials');
      res.json({ id: row.id, username: row.username });
    });
  });

// get task for a user
app.get('/tasks/:userId', (req, res) => {
  db.all('SELECT * FROM tasks WHERE userId = ?', [req.params.userId], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});


// Add a new task for a user
app.post('/tasks/:userId', (req, res) => {
  const userId = req.params.userId;
  const { name, date, time, priority, workload } = req.body;

  console.log('Received POST /tasks');
  console.log('userId:', userId);
  console.log('Request body:', req.body);

  if (!name || !date || !priority) {
    console.error('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO tasks (userId, name, date, time, priority, workload, completed) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, date, time, priority, workload, 0],
    function (err) {
      if (err) {
        console.error('SQLite INSERT error:', err.message);
        return res.status(500).json({ error: 'Failed to create task' });
      }

      console.log('Task inserted with ID:', this.lastID);
      res.status(201).json({ id: this.lastID });
    }
  );
});


  

// Update task completion
app.put('/tasks/:userId', (req, res) => {
  const { id, completed } = req.body;
  db.run(`UPDATE tasks SET completed = ? WHERE id = ?`, [completed ? 1 : 0, id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update task' });
    res.json({ success: true });
  });
});

// DELETE /tasks/:id - delete a task by ID
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

// Add friend-related endpoints
db.run(`CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER,
  user2_id INTEGER,
  status TEXT DEFAULT 'pending',
  action_user_id INTEGER,
  FOREIGN KEY(user1_id) REFERENCES users(id),
  FOREIGN KEY(user2_id) REFERENCES users(id)
)`);

// Search users by username
app.get('/users/search/:username', (req, res) => {
  const searchTerm = `%${req.params.username}%`;
  db.all(`SELECT id, username FROM users WHERE username LIKE ?`, [searchTerm], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Send friend request
app.post('/friends/request', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  
  // Check if request already exists
  db.get(`SELECT * FROM friendships WHERE 
    (user1_id = ? AND user2_id = ?) OR 
    (user1_id = ? AND user2_id = ?)`, 
    [fromUserId, toUserId, toUserId, fromUserId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: 'Friend request already exists' });
      
      db.run(`INSERT INTO friendships (user1_id, user2_id, status, action_user_id) 
              VALUES (?, ?, 'pending', ?)`, 
              [fromUserId, toUserId, fromUserId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
});

// Get friend requests
app.get('/friends/requests/:userId', (req, res) => {
  db.all(`SELECT f.id, u.username, u.id as userId 
          FROM friendships f 
          JOIN users u ON f.user1_id = u.id 
          WHERE f.user2_id = ? AND f.status = 'pending'`, 
          [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Respond to friend request
app.post('/friends/respond', (req, res) => {
  const { requestId, userId, accept } = req.body;
  
  if (accept) {
    db.run(`UPDATE friendships SET status = 'accepted', action_user_id = ? 
            WHERE id = ?`, [userId, requestId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  } else {
    db.run(`DELETE FROM friendships WHERE id = ?`, [requestId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  }
});

// Get friends list
app.get('/friends/:userId', (req, res) => {
  db.all(`SELECT u.id, u.username 
          FROM friendships f 
          JOIN users u ON (f.user1_id = u.id OR f.user2_id = u.id) 
          WHERE (f.user1_id = ? OR f.user2_id = ?) 
          AND f.status = 'accepted' 
          AND u.id != ?`, 
          [req.params.userId, req.params.userId, req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
