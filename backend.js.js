
// Import dependencies
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database (auto-creates db.sqlite)
const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Ensure table creation happens sequentially
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready.');
    }
  });
});

// Health check route
app.get('/', (req, res) => {
  res.send('API is running on Express + SQLite');
});

// Get all users
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add a new user
app.post('/users', (req, res) => {
  const { username, email, role } = req.body;

  if (!username || !email || !role) {
    return res.status(400).json({ error: 'All fields (username, email, role) are required' });
  }

  const stmt = `INSERT INTO users (username, email, role) VALUES (?, ?, ?)`;
  db.run(stmt, [username, email, role], function (err) {
    if (err) {
      console.error('Error inserting user:', err.message);
      return res.status(500).json({ error: 'Database insert failed' });
    }
    res.json({ id: this.lastID, username, email, role });
  });
});

// Update a user
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  if (!username || !email || !role) {
    return res.status(400).json({ error: 'All fields (username, email, role) are required' });
  }

  const stmt = `UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?`;
  db.run(stmt, [username, email, role, id], function (err) {
    if (err) {
      console.error('Error updating user:', err.message);
      return res.status(500).json({ error: 'Database update failed' });
    }
    res.json({ updated: this.changes });
  });
});

// Delete a user
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  const stmt = `DELETE FROM users WHERE id = ?`;
  db.run(stmt, [id], function (err) {
    if (err) {
      console.error('Error deleting user:', err.message);
      return res.status(500).json({ error: 'Database delete failed' });
    }
    res.json({ deleted: this.changes });
  });
});

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on all interfaces at http://0.0.0.0:${PORT}`);
});
