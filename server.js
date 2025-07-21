const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const keys = {}; // { key: { createdAt: timestamp } }

// Страница после Linkvertise: генерирует ключ
app.get('/after', (req, res) => {
  const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
  keys[newKey] = { createdAt: Date.now() };

  res.send(`
    <html>
      <head><title>Your Key</title></head>
      <body style="font-family:sans-serif;text-align:center;margin-top:50px;">
        <h1>✅ Ваш ключ:</h1>
        <h2 style="color:green;">${newKey}</h2>
        <p>Скопируйте этот ключ и вставьте его в Roblox</p>
      </body>
    </html>
  `);
});

// Проверка ключа
app.post('/check', (req, res) => {
  const { key } = req.body;

  if (!key || !keys[key]) {
    return res.json({ success: false, message: 'Неверный ключ' });
  }

  const now = Date.now();
  const createdAt = keys[key].createdAt;

  // Проверка на 3 часа
  if (now - createdAt > 3 * 60 * 60 * 1000) {
    delete keys[key];
    return res.json({ success: false, message: 'Ключ истёк' });
  }

  return res.json({ success: true });
});

// Для рендера
app.get('/', (req, res) => {
  res.send('🚀 Key System работает! Перейди на /after, чтобы получить ключ.');
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
