const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const keys = {}; // { ip: { key, createdAt } }
const KEY_LIFETIME = 3 * 60 * 60 * 1000; // 3 часа

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

app.get('/generate', (req, res) => {
  const ip = getClientIP(req);

  const existing = keys[ip];
  const now = Date.now();

  if (existing && now - existing.createdAt < KEY_LIFETIME) {
    const expiresIn = KEY_LIFETIME - (now - existing.createdAt);
    return res.json({ key: existing.key, expiresIn });
  }

  const newKey = generateKey();
  keys[ip] = { key: newKey, createdAt: now };

  res.json({ key: newKey, expiresIn: KEY_LIFETIME });
});

app.get('/verify', (req, res) => {
  const { key } = req.query;
  const ip = getClientIP(req);
  const record = keys[ip];

  if (record && record.key === key && Date.now() - record.createdAt < KEY_LIFETIME) {
    return res.json({ valid: true });
  }

  res.json({ valid: false });
});

app.get('/token', (req, res) => {
  const ip = getClientIP(req);
  const now = Date.now();

  const token = generateKey();
  keys[ip] = { key: token, createdAt: now };

  res.json({ token });
});

// fallback to index.html for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
