<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Key System</title>
  <style>
    body {
      background: #0f0f0f;
      color: #fff;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      height: 100vh;
      margin: 0;
    }

    .container {
      background: #1f1f1f;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 0 20px #00ffcc40;
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    h1 {
      color: #00ffcc;
      margin-bottom: 10px;
    }

    p {
      color: #ccc;
    }

    .key {
      font-size: 16px;
      margin: 15px 0;
      word-break: break-all;
    }

    button {
      background: #00ffcc;
      color: #000;
      border: none;
      padding: 10px 20px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.2s ease-in-out;
    }

    button:hover {
      background: #00c9a0;
    }

    .timer {
      margin-top: 15px;
      color: #aaa;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your Access Key</h1>
    <p class="key">Loading...</p>
    <button onclick="copyKey()">Copy</button>
    <div class="timer" id="timer">Expires in: ...</div>
  </div>

  <script>
    let timeLeft = 0;

    fetch('/generate')
      .then(res => res.json())
      .then(data => {
        document.querySelector('.key').textContent = data.key;
        timeLeft = Math.floor(data.remaining / 1000);
      });

    function copyKey() {
      const key = document.querySelector('.key').textContent;
      navigator.clipboard.writeText(key);
      alert("Copied to clipboard!");
    }

    setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        const h = Math.floor(timeLeft / 3600);
        const m = Math.floor((timeLeft % 3600) / 60);
        const s = timeLeft % 60;
        document.getElementById('timer').textContent =
          `Expires in: ${h}h ${m}m ${s}s`;
      } else {
        document.getElementById('timer').textContent = "Expired. Refresh to regenerate.";
      }
    }, 1000);
  </script>
</body>
</html>
