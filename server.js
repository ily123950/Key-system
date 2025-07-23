const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// --- КОНФИГУРАЦИЯ ---
const keys = {}; // Временное хранилище ключей: { key: { createdAt, ip } }
const KEY_LIFETIME = 3 * 60 * 60 * 1000; // 3 часа в миллисекундах
const LINKVERTISE_URL = 'https://loot-link.com/s?MTzk1hnB'; // Ваша ссылка Lootlink

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

function getExistingKey(ip, cookies) {
  const cookieKey = cookies.key;
  if (cookieKey && keys[cookieKey] && keys[cookieKey].ip === ip && Date.now() - keys[cookieKey].createdAt < KEY_LIFETIME) {
    return {
      key: cookieKey,
      remaining: KEY_LIFETIME - (Date.now() - keys[cookieKey].createdAt)
    };
  }
  return null;
}

function cleanupExpiredKeys() {
  for (const key in keys) {
    if (Date.now() - keys[key].createdAt >= KEY_LIFETIME) {
      delete keys[key];
    }
  }
}

// Функция для генерации HTML-страницы с ключом
function renderKeyPage(res, keyData, pageTitle, headerText) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${pageTitle}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(120deg, #1f1f1f, #2b2b2b); color: #fff; text-align: center; padding-top: 10vh; margin: 0; }
        .container { background-color: #333; border-radius: 12px; padding: 30px; width: 90%; max-width: 500px; margin: 0 auto; box-shadow: 0 0 15px #000; }
        .key { background-color: #222; padding: 12px; border-radius: 8px; font-size: 18px; word-break: break-all; }
        button { margin-top: 15px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #45a049; }
        .timer { margin-top: 10px; font-size: 14px; color: #ccc; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${headerText}</h2>
        <div class="key" id="key">${keyData.key}</div>
        <button onclick="copyKey()">Copy</button>
        <div class="timer" id="timer"></div>
      </div>
      <script>
        function copyKey() {
          navigator.clipboard.writeText(document.getElementById('key').textContent).then(() => {
            alert('Copied to clipboard!');
          });
        }
        let remaining = ${Math.floor(keyData.remaining / 1000)};
        const timerElement = document.getElementById('timer');
        function updateTimer() {
          if (remaining <= 0) {
            timerElement.textContent = "Key expired. Please get a new one.";
            clearInterval(timerInterval);
            return;
          }
          const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
          const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
          const s = String(remaining % 60).padStart(2, '0');
          timerElement.textContent = "Expires in: " + h + ":" + m + ":" + s;
          remaining--;
        }
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
}


// --- ОСНОВНАЯ ЛОГИКА (MIDDLEWARE) ---

const keyLogicMiddleware = (req, res, next) => {
  const ip = req.ip;
  cleanupExpiredKeys();

  // 1. Проверяем, есть ли у пользователя уже действующий ключ
  const existingKeyData = getExistingKey(ip, req.cookies);
  if (existingKeyData) {
    req.keyData = existingKeyData; // Передаем данные ключа в следующий обработчик
    return next();
  }

  // 2. Если ключа нет, проверяем, прошел ли пользователь верификацию
  if (req.cookies.verified === 'true') {
    // Пользователь верифицирован, создаем для него ключ
    const newKey = generateKey();
    keys[newKey] = { createdAt: Date.now(), ip };
    
    res.cookie('key', newKey, { maxAge: KEY_LIFETIME, httpOnly: true });

    // ВАЖНО: Удаляем cookie верификации, чтобы его нельзя было использовать снова
    res.clearCookie('verified');

    req.keyData = { key: newKey, remaining: KEY_LIFETIME };
    return next();
  }

  // 3. Если ключа нет и верификации нет — отправляем на Lootlink
  return res.redirect(LINKVERTISE_URL);
};


// --- РОУТЫ ---

// Сюда должен перенаправлять Lootlink после успешного выполнения
app.get('/getkey', (req, res) => {
  // Устанавливаем временный cookie, подтверждающий верификацию (действует 1 минуту)
  res.cookie('verified', 'true', { maxAge: 60 * 1000, httpOnly: true });
  // Перенаправляем на главную для получения ключа
  res.redirect('/');
});

// Применяем нашу основную логику ко всем роутам, где выдается ключ
app.use(['/', '/token', '/generate'], keyLogicMiddleware);

app.get('/', (req, res) => {
  renderKeyPage(res, req.keyData, 'Key System', 'Your Unique Key');
});

app.get('/token', (req, res) => {
  renderKeyPage(res, req.keyData, 'Token System', 'Your Unique Token');
});

app.get('/generate', (req, res) => {
  renderKeyPage(res, req.keyData, 'Generate Key', 'Your Generated Key');
});

// Роут для внешней проверки ключа (остался без изменений)
app.get('/verify', (req, res) => {
  const key = req.query.key;
  if (key && keys[key] && Date.now() - keys[key].createdAt < KEY_LIFETIME) {
    return res.json({ valid: true });
  }
  res.json({ valid: false });
});

// --- ЗАПУСК СЕРВЕРА ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
