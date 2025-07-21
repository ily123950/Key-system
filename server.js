const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const keys = {}; // {key: createdAt}

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

app.get('/generate', (req, res) => {
  const key = generateKey();
  keys[key] = Date.now();
  res.json({ key });
});

app.get('/verify', (req, res) => {
  const key = req.query.key;
  if (key && keys[key]) {
    delete keys[key];
    return res.json({ valid: true });
  }
  res.json({ valid: false });
});

// ✅ добавляем поддержку /token
app.get('/token', (req, res) => {
  const key = generateKey();
  keys[key] = Date.now();
  res.json({ token: key });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Key server running on ${PORT}`));
