const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Хранилища (в оперативной памяти)
const keys = {};        // { KEY: { createdAt } }
const activeTokens = {}; // { TOKEN: true }
const usedIPs = {};     // [IP] — опционально

// Получение одноразового токена (ссылка из Linkvertise)
app.get('/token', (req, res) => {
  const token = Math.random().toString(36).substring(2, 12).toUpperCase();
  activeTokens[token] = true;

  // Редирект на after с токеном
  res.redirect(`/after?token=${token}`);
});

// Выдача ключа (только с одноразовым токеном)
app.get('/after', (req, res) => {
  const token = req.query.token;
  if (!token || !activeTokens[token]) {
    return res.status(403).send("⛔ Недействительный или использованный токен.");
  }

  // Удаляем токен (одноразово)
  delete activeTokens[token];

  const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
  keys[newKey] = { createdAt: Date.now() };

  res.send(`
    <html>
      <head><title>Ваш ключ</title></head>
      <body style="font-family:sans-serif;text-align:center;margin-top:50px;">
        <h1>✅ Ваш ключ:</h1>
        <h2 style="color:green;">${newKey}</h2>
        <p>Действителен 3 часа. Введите его в Roblox GUI.</p>
      </body>
    </html>
  `);
});

// Проверка ключа (из Roblox)
app.post('/check', (req, res) => {
  const { key } = req.body;
  if (!key || !keys[key]) {
    return res.json({ success: false, message: 'Неверный ключ' });
  }

  const now = Date.now();
  const created = keys[key].createdAt;

  if (now - created > 3 * 60 * 60 * 1000) {
    delete keys[key];
    return res.json({ success: false, message: 'Ключ истёк' });
  }

  res.json({ success: true });
});

// Главная страница (информация)
app.get('/', (req, res) => {
  res.send('🔐 KeySystem работает. Перейди на /token через Linkvertise.');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер работает на порту ${PORT}`);
});
