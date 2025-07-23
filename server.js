const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// --- CONFIGURATION ---
const keys = {}; // Temporary key storage: { key: { createdAt, ip } }
const KEY_LIFETIME = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const LOOTLINK_URL = 'https://loot-link.com/s?MTzk1hnB'; // LootLink URL

// --- HELPER FUNCTIONS ---

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

// Function to generate HTML page with key
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

// --- MAIN LOGIC (MIDDLEWARE) ---

const keyLogicMiddleware = (req, res, next) => {
  const ip = req.ip;
  cleanupExpiredKeys();

  // 1. Check if user already has a valid key
  const existingKeyData = getExistingKey(ip, req.cookies);
  if (existingKeyData) {
    req.keyData = existingKeyData; // Pass key data to the next handler
    return next();
  }

  // 2. If no key, check if user is verified
  if (req.cookies.verified === 'true') {
    // User is verified, generate a new key
    const newKey = generateKey();
    keys[newKey] = { createdAt: Date.now(), ip };
    
    res.cookie('key', newKey, { maxAge: KEY_LIFETIME, httpOnly: true });

    // IMPORTANT: Clear verification cookie to prevent reuse
    res.clearCookie('verified');

    req.keyData = { key: newKey, remaining: KEY_LIFETIME };
    return next();
  }

  // 3. If no key and no verification, redirect to LootLink
  return res.redirect(LOOTLINK_URL);
};

// --- ROUTES ---

// LootLink should redirect here after successful verification
app.get('/complete-verification', (req, res) => {
  // Set temporary verification cookie (valid for 1 minute)
  res.cookie('verified', 'true', { maxAge: 60 * 1000, httpOnly: true });
  // Redirect to main page to get the key
  res.redirect('/');
});

// Apply key logic to all key-issuing routes
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

// Route for external key verification
app.get('/verify', (req, res) => {
  const key = req.query.key;
  console.log(`[VERIFY] Received key: ${key}, IP: ${req.ip}`); // Log for debugging
  if (key && keys[key] && Date.now() - keys[key].createdAt < KEY_LIFETIME) {
    console.log(`[VERIFY] Key valid: ${key}`);
    res.setHeader('Content-Type', 'application/json');
    return res.json({ valid: true });
  }
  console.log(`[VERIFY] Key invalid: ${key}`);
  res.setHeader('Content-Type', 'application/json');
  res.json({ valid: false });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
