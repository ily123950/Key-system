const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

app.use(cors());
app.use(express.json());

const keys = {}; // { ip: key }

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

// Serve HTML page at root
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Get Your Key</title>
      <style>
        body {
          background: linear-gradient(135deg, #1e1e2f, #2a2a40);
          color: #fff;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 20px;
        }
        #key-box {
          background: #333;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 1.2rem;
          margin-bottom: 10px;
        }
        button {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background: #45a049;
        }
      </style>
    </head>
    <body>
      <h1>Your Access Key</h1>
      <div id="key-box">Loading...</div>
      <button onclick="copyKey()">Copy Key</button>

      <script>
        fetch('/token')
          .then(res => res.json())
          .then(data => {
            document.getElementById('key-box').innerText = data.token;
          });

        function copyKey() {
          const key = document.getElementById('key-box').innerText;
          navigator.clipboard.writeText(key).then(() => {
            alert('Key copied to clipboard!');
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Generate and assign a key based on IP
app.get('/token', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!keys[ip]) {
    keys[ip] = generateKey();
  }
  res.json({ token: keys[ip] });
});

// Verify and delete key (one-time)
app.get('/verify', (req, res) => {
  const key = req.query.key;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (key && keys[ip] && keys[ip] === key) {
    delete keys[ip];
    return res.json({ valid: true });
  }
  res.json({ valid: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Key server running on http://localhost:${PORT}`));
