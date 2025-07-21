const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const TTL = 3 * 60 * 60 * 1000; // 3 hours in ms
const keys = {}; // { ip: { key, createdAt } }

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

function getIP(req) {
  return req.headers['cf-connecting-ip'] || req.ip;
}

app.get('/generate', (req, res) => {
  const ip = getIP(req);

  if (keys[ip] && Date.now() - keys[ip].createdAt < TTL) {
    const remaining = TTL - (Date.now() - keys[ip].createdAt);
    return res.json({ key: keys[ip].key, expiresIn: remaining });
  }

  const key = generateKey();
  keys[ip] = {
    key,
    createdAt: Date.now()
  };

  res.json({ key, expiresIn: TTL });
});

app.get('/verify', (req, res) => {
  const key = req.query.key;
  const found = Object.values(keys).find(obj => obj.key === key);

  if (found && Date.now() - found.createdAt < TTL) {
    return res.json({ valid: true });
  }

  res.json({ valid: false });
});

app.get('/token', (req, res) => {
  const ip = getIP(req);

  if (keys[ip] && Date.now() - keys[ip].createdAt < TTL) {
    const remaining = TTL - (Date.now() - keys[ip].createdAt);
    return res.json({ token: keys[ip].key, expiresIn: remaining });
  }

  const key = generateKey();
  keys[ip] = {
    key,
    createdAt: Date.now()
  };

  res.json({ token: key, expiresIn: TTL });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
