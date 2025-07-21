const express = require("express");
const app = express();
const cors = require("cors");
const crypto = require("crypto");
const rateLimit = require('express-rate-limit');

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Память для ключей (в продакшене лучше использовать базу данных)
const keys = {};

// Генерация ключа
function generateKey() {
  return crypto.randomBytes(16).toString("hex");
}

// Срок действия ключа (3 часа)
const EXPIRY_MS = 3 * 60 * 60 * 1000;

// Лимит запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // 100 запросов с одного IP
});
app.use(limiter);

// API: Выдача ключа (только через правильную ссылку)
app.get("/getkey", (req, res) => {
  const referer = req.get("Referer") || "";
  const userAgent = req.get("User-Agent") || "";

  // Двойная проверка (Referer и User-Agent)
  if (!referer.includes("linkvertise") || !userAgent.includes("Roblox")) {
    return res.status(403).json({ 
      success: false,
      message: "❌ Invalid request source"
    });
  }

  const key = generateKey();
  keys[key] = {
    createdAt: Date.now(),
    used: false
  };

  res.json({
    success: true,
    key: key,
    expiry: EXPIRY_MS
  });
});

// API: Проверка ключа
app.get("/verify", (req, res) => {
  const key = req.query.key;
  
  if (!key || !keys[key]) {
    return res.status(400).json({ 
      success: false,
      message: "❌ Invalid key" 
    });
  }

  const age = Date.now() - keys[key].createdAt;
  
  if (age > EXPIRY_MS) {
    delete keys[key];
    return res.status(410).json({ 
      success: false,
      message: "⏰ Key expired" 
    });
  }

  // Помечаем ключ как использованный
  keys[key].used = true;
  
  res.json({
    success: true,
    message: "✅ Access granted"
  });
});

// Cloudflare проверка
app.get("/", (req, res) => {
  res.send("Key system is working");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
