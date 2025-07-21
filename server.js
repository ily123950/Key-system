const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Жёсткая настройка CORS только для Roblox и Cloudflare
app.use(cors({
  origin: [
    'https://www.roblox.com',
    'https://your-cloudflare-worker.workers.dev' // Замени!
  ]
}));

// Хранилище ключей
const keys = new Map();

// Проверка секретного заголовка от Cloudflare
app.use((req, res, next) => {
  if (req.get('X-API-Secret') !== 'YOUR_SECRET_KEY123') {
    return res.status(403).json({ error: "Доступ запрещён" });
  }
  next();
});

// Выдача ключа (только через Linkvertise)
app.get('/getkey', (req, res) => {
  const referer = req.get('Referer') || '';
  if (!referer.includes('linkvertise')) {
    return res.status(403).json({ error: "Используйте Linkvertise" });
  }

  const key = crypto.randomBytes(16).toString('hex');
  keys.set(key, {
    createdAt: Date.now(),
    ip: req.ip,
    used: false
  });

  res.json({ 
    key,
    expiresIn: 10800 // 3 часа в секундах
  });
});

// Проверка ключа
app.get('/verify', (req, res) => {
  const key = req.query.key;
  if (!keys.has(key)) return res.json({ valid: false });

  const keyData = keys.get(key);
  const isExpired = (Date.now() - keyData.createdAt) > 10800000; // 3 часа

  res.json({ 
    valid: !isExpired,
    expiresIn: isExpired ? 0 : 10800000 - (Date.now() - keyData.createdAt)
  });
});

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
