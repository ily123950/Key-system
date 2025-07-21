const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const keys = {}; // Если хочешь хранение в памяти

// Генерация ключа
app.post('/generate', (req, res) => {
  const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
  keys[newKey] = { createdAt: Date.now() };
  res.json({ key: newKey });
});

// Проверка ключа
app.post('/check', (req, res) => {
  const { key } = req.body;

  if (!key || !keys[key]) return res.json({ success: false, message: 'Invalid key' });

  const now = Date.now();
  const created = keys[key].createdAt;

  if (now - created > 3 * 60 * 60 * 1000) {
    delete keys[key];
    return res.json({ success: false, message: 'Key expired' });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
