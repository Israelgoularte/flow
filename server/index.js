const express = require('express');
const path = require("path");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { db, init } = require('./db');

init();
const app = express();
const router = express.Router();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client")));
app.use("/api", router);

const SECRET = 'secret-key'; // for demo only

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// register
router.post('/auth/register', (req, res) => {
  const { email, password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
  stmt.run(email, hash, function (err) {
    if (err) return res.status(400).json({ error: 'Email exists' });
    res.json({ id: this.lastID, email });
  });
});

// login
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, row.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: row.id, email: row.email }, SECRET);
    res.json({ token });
  });
});

// contacts
router.get('/contacts', authMiddleware, (req, res) => {
  db.all('SELECT * FROM contacts WHERE user_id = ?', [req.user.id], (err, rows) => {
    res.json(rows);
  });
});

router.post('/contacts', authMiddleware, (req, res) => {
  const { name, email, phone, custom_fields } = req.body;
  const stmt = db.prepare('INSERT INTO contacts (user_id, name, email, phone, custom_fields) VALUES (?, ?, ?, ?, ?)');
  stmt.run(req.user.id, name, email, phone, JSON.stringify(custom_fields || {}), function (err) {
    res.json({ id: this.lastID });
  });
});

router.put('/contacts/:id', authMiddleware, (req, res) => {
  const { name, email, phone, custom_fields } = req.body;
  const stmt = db.prepare('UPDATE contacts SET name=?, email=?, phone=?, custom_fields=? WHERE id=? AND user_id=?');
  stmt.run(name, email, phone, JSON.stringify(custom_fields || {}), req.params.id, req.user.id, function (err) {
    res.json({ updated: this.changes });
  });
});

router.delete('/contacts/:id', authMiddleware, (req, res) => {
  const stmt = db.prepare('DELETE FROM contacts WHERE id=? AND user_id=?');
  stmt.run(req.params.id, req.user.id, function (err) {
    res.json({ deleted: this.changes });
  });
});

// sessions
router.get('/sessions', authMiddleware, (req, res) => {
  db.all('SELECT * FROM sessions WHERE user_id=?', [req.user.id], (err, rows) => {
    res.json(rows);
  });
});

router.post('/sessions', authMiddleware, (req, res) => {
  const { name, status, openai_api_key, ia_instructions } = req.body;
  const stmt = db.prepare('INSERT INTO sessions (user_id, name, status, openai_api_key, ia_instructions) VALUES (?, ?, ?, ?, ?)');
  stmt.run(req.user.id, name, status || 'active', openai_api_key, ia_instructions, function (err) {
    res.json({ id: this.lastID });
  });
});

router.put('/sessions/:id', authMiddleware, (req, res) => {
  const { name, status, openai_api_key, ia_instructions, ia_active } = req.body;
  const stmt = db.prepare('UPDATE sessions SET name=?, status=?, openai_api_key=?, ia_instructions=?, ia_active=? WHERE id=? AND user_id=?');
  stmt.run(name, status, openai_api_key, ia_instructions, ia_active, req.params.id, req.user.id, function (err) {
    res.json({ updated: this.changes });
  });
});

router.delete('/sessions/:id', authMiddleware, (req, res) => {
  const stmt = db.prepare('DELETE FROM sessions WHERE id=? AND user_id=?');
  stmt.run(req.params.id, req.user.id, function (err) {
    res.json({ deleted: this.changes });
  });
});

// placeholder for messages
router.post('/messages', authMiddleware, (req, res) => {
  const { contact_id, session_id, author, type, content } = req.body;
  const stmt = db.prepare('INSERT INTO messages (contact_id, session_id, author, type, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(contact_id, session_id, author, type, content, Date.now(), function (err) {
    res.json({ id: this.lastID });
  });
});

router.get('/messages/:contactId', authMiddleware, (req, res) => {
  db.all('SELECT * FROM messages WHERE contact_id=? ORDER BY timestamp DESC LIMIT 100', [req.params.contactId], (err, rows) => {
    res.json(rows.reverse());
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server running on', PORT));
