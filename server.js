const express = require("express");
const app = express();
const cors = require("cors");
const crypto = require("crypto");

app.use(cors());

const PORT = process.env.PORT || 3000;

// Память для ключей
const keys = {};

// Генерация ключа
function generateKey() {
  return crypto.randomBytes(16).toString("hex");
}

// Срок действия ключа (3 часа)
const EXPIRY_MS = 3 * 60 * 60 * 1000;

// API: Выдача ключа (только через правильную ссылку)
app.get("/getkey", (req, res) => {
  const referer = req.get("Referer") || "";

  // Проверка, что переход был с Linkvertise
  if (!referer.includes("linkvertise")) {
    return res.status(403).send("❌ Invalid Referer");
  }

  const key = generateKey();
  keys[key] = Date.now();

  res.send(key);
});

// API: Проверка ключа
app.get("/verify", (req, res) => {
  const key = req.query.key;
  if (!key || !keys[key]) return res.status(400).send("❌ Invalid key");

  const age = Date.now() - keys[key];
  if (age > EXPIRY_MS) {
    delete keys[key];
    return res.status(410).send("⏰ Key expired");
  }

  res.send("✅ Access granted");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
