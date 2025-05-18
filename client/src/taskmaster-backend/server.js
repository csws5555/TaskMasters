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
  db.run(`DROP TABLE IF EXISTS tasks`);
  db.run(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      name TEXT,
      date TEXT,
      time TEXT,
      priority TEXT,
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
  const { name, date, time, priority } = req.body;

  console.log('Received POST /tasks');
  console.log('userId:', userId);
  console.log('Request body:', req.body);

  if (!name || !date || !priority) {
    console.error('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO tasks (userId, name, date, time, priority, completed) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, name, date, time, priority, 0],
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


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
