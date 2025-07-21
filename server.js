const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const keys = {}; // { key: { createdAt, ip } }
const KEY_LIFETIME = 3 * 60 * 60 * 1000; // 3 hours in ms

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

function getExistingKey(ip) {
  for (const key in keys) {
    if (keys[key].ip === ip && Date.now() - keys[key].createdAt < KEY_LIFETIME) {
      return { key, remaining: KEY_LIFETIME - (Date.now() - keys[key].createdAt) };
    }
  }
  return null;
}

// Маршрут для главной страницы
app.get('/', (req, res) => {
  const ip = req.ip;
  const existing = getExistingKey(ip);

  let keyData;
  if (existing) {
    keyData = existing;
  } else {
    const newKey = generateKey();
    keys[newKey] = { createdAt: Date.now(), ip };
    keyData = { key: newKey, remaining: KEY_LIFETIME };
  }

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Key System</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(120deg, #1f1f1f, #2b2b2b);
        color: #fff;
        text-align: center;
        padding-top: 10vh;
      }
      .container {
        background-color: #333;
        border-radius: 12px;
        padding: 30px;
        width: 90%;
        max-width: 500px;
        margin: 0 auto;
        box-shadow: 0 0 15px #000;
      }
      .key {
        background-color: #222;
        padding: 12px;
        border-radius: 8px;
        font-size: 18px;
        word-break: break-all;
      }
      button {
        margin-top: 15px;
        padding: 10px 20px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
      }
      button:hover {
        background-color: #45a049;
      }
      .timer {
        margin-top: 10px;
        font-size: 14px;
        color: #ccc;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Your Unique Key</h2>
      <div class="key" id="key">${keyData.key}</div>
      <button onclick="copyKey()">Copy</button>
      <div class="timer" id="timer"></div>
    </div>

    <script>
      function copyKey() {
        const key = document.getElementById('key').textContent;
        navigator.clipboard.writeText(key).then(() => {
          alert('Copied to clipboard!');
        });
      }

      let remaining = ${Math.floor(keyData.remaining / 1000)};
      const timerElement = document.getElementById('timer');

      function updateTimer() {
        const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
        const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');
        timerElement.textContent = "Expires in: " + h + ":" + m + ":" + s;
        if (remaining > 0) remaining--;
      }

      updateTimer();
      setInterval(updateTimer, 1000);
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

// Новый маршрут для /token
app.get('/token', (req, res) => {
  const ip = req.ip;
  const existing = getExistingKey(ip);

  let keyData;
  if (existing) {
    keyData = existing;
  } else {
    const newKey = generateKey();
    keys[newKey] = { createdAt: Date.now(), ip };
    keyData = { key: newKey, remaining: KEY_LIFETIME };
  }

  res.json({
    key: keyData.key,
    remaining: Math.floor(keyData.remaining / 1000), // Время в секундах
  });
});

// Маршрут для проверки ключа
app.get('/verify', (req, res) => {
  const key = req.query.key;
  if (key && keys[key] && Date.now() - keys[key].createdAt < KEY_LIFETIME) {
    return res.json({ valid: true });
  }
  res.json({ valid: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running at http://localhost:" + PORT));
