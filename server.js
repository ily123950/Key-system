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
const COOLDOWN_PERIOD = 1 * 60 * 60 * 1000; // 1 hour in ms
const LINKVERTISE_URL = 'https://direct-link.net/1369897/ehMpzXXibTCK';

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

function getExistingKey(ip, cookies) {
  const cookieKey = cookies.key;
  if (cookieKey && keys[cookieKey] && keys[cookieKey].ip === ip && Date.now() - keys[cookieKey].createdAt < KEY_LIFETIME) {
    return { key: cookieKey, remaining: KEY_LIFETIME - (Date.now() - keys[cookieKey].createdAt) };
  }
  return null;
}

function isInCooldown(cookies, ip) {
  const lastKeyTime = cookies.lastKeyTime ? parseInt(cookies.lastKeyTime) : 0;
  return Date.now() - lastKeyTime < KEY_LIFETIME + COOLDOWN_PERIOD;
}

function cleanupExpiredKeys() {
  for (const key in keys) {
    if (Date.now() - keys[key].createdAt >= KEY_LIFETIME) {
      delete keys[key];
    }
  }
}

// Route for the main page
app.get('/', (req, res) => {
  const ip = req.ip;
  cleanupExpiredKeys();

  const existing = getExistingKey(ip, req.cookies);
  let keyData;

  if (existing) {
    keyData = existing;
    res.cookie('key', keyData.key, { maxAge: keyData.remaining, httpOnly: true });
    res.cookie('lastKeyTime', keys[keyData.key].createdAt, { maxAge: KEY_LIFETIME + COOLDOWN_PERIOD, httpOnly: true });
  } else if (!isInCooldown(req.cookies, ip)) {
    const newKey = generateKey();
    keys[newKey] = { createdAt: Date.now(), ip };
    keyData = { key: newKey, remaining: KEY_LIFETIME };
    res.cookie('key', newKey, { maxAge: KEY_LIFETIME, httpOnly: true });
    res.cookie('lastKeyTime', Date.now(), { maxAge: KEY_LIFETIME + COOLDOWN_PERIOD, httpOnly: true });
  } else {
    return res.redirect(LINKVERTISE_URL);
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
          else window.location.href = '${LINKVERTISE_URL}';
        }

        updateTimer();
        setInterval(updateTimer, 1000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Route for /token
app.get('/token', (req, res) => {
  const ip = req.ip;
  cleanupExpiredKeys();

  const existing = getExistingKey(ip, req.cookies);
  let keyData;

  if (existing) {
    keyData = existing;
    res.cookie('key', keyData.key, { maxAge: keyData.remaining, httpOnly: true });
    res.cookie('lastKeyTime', keys[keyData.key].createdAt, { maxAge: KEY_LIFETIME + COOLDOWN_PERIOD, httpOnly: true });
  } else if (!isInCooldown(req.cookies, ip)) {
    const newKey = generateKey();
    keys[newKey] = { createdAt: Date.now(), ip };
    keyData = { key: newKey, remaining: KEY_LIFETIME };
    res.cookie('key', newKey, { maxAge: KEY_LIFETIME, httpOnly: true });
    res.cookie('lastKeyTime', Date.now(), { maxAge: KEY_LIFETIME + COOLDOWN_PERIOD, httpOnly: true });
  } else {
    return res.redirect(LINKVERTISE_URL);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Token System</title>
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
        <h2>Your Unique Token</h2>
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
          else window.location.href = '${LINKVERTISE_URL}';
        }

        updateTimer();
        setInterval(updateTimer, 1000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Route for /generate
app.get('/generate', (req, res) => {
  const ip = req.ip;
  cleanupExpiredKeys();

  const existing = getExistingKey(ip, req.cookies);
  let keyData;

  if (existing) {
    keyData = existing;
    res.cookie('key', keyData.key, { maxAge: keyData.remaining, httpOnly: true });
    res.cookie('lastKeyTime', keys[keyData.key].createdAt, { maxAge: KEY_LIFETIME + COOLDOWN_PERIOD, httpOnly: true });
  } else if (!isInCooldown(req.cookies, ip)) {
    const newKey = generateKey();
    keys[newKey] = { createdAt: Date.now(), ip };
    keyData = { key: newKey, remaining: KEY_LIFETIME };
    res.cookie('key', newKey, { maxAge: KEY_LIFETIME, httpOnly: true });
    res.cookie('lastKeyTime', Date.now(), { maxAge: KEY_LIFETIME + COOLDOWN_PERIOD, httpOnly: true });
  } else {
    return res.redirect(LINKVERTISE_URL);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Generate Key</title>
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
        <h2>Your Generated Key</h2>
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
          else window.location.href = '${LINKVERTISE_URL}';
        }

        updateTimer();
        setInterval(updateTimer, 1000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Route for Linkvertise redirect
app.get('/linkvertise', (req, res) => {
  res.redirect(LINKVERTISE_URL);
});

// Route to handle Linkvertise callback (simulated)
app.get('/complete-verification', (req, res) => {
  const ip = req.ip;
  cleanupExpiredKeys();

  // Reset cooldown by setting lastKeyTime to 0
  res.cookie('lastKeyTime', 0, { maxAge: KEY_LIFETIME + COOLDOWN_PERIOD, httpOnly: true });
  res.redirect('/'); // Redirect to generate a new key
});

// Route for key verification
app.get('/verify', (req, res) => {
  const key = req.query.key;
  if (key && keys[key] && Date.now() - keys[key].createdAt < KEY_LIFETIME) {
    return res.json({ valid: true });
  }
  res.json({ valid: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running at http://localhost:" + PORT));
