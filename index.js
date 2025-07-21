<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Key System</title>
  <style>
    body {
      background: #0f111a;
      color: #fff;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }

    .container {
      background: #1a1d2b;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 0 15px #000;
      text-align: center;
      width: 90%;
      max-width: 500px;
    }

    h1 {
      color: #00ffcc;
    }

    #keyDisplay {
      margin: 20px 0;
      font-size: 18px;
      word-break: break-all;
      background: #2a2d3b;
      padding: 10px;
      border-radius: 10px;
    }

    button {
      background: #00ffcc;
      color: #000;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 10px;
    }

    button:hover {
      background: #00e6b8;
    }

    #countdown {
      margin-top: 15px;
      color: #ccc;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your Key</h1>
    <div id="keyDisplay">Loading...</div>
    <button onclick="copyKey()">Copy Key</button>
    <div id="countdown">Expires in: --:--:--</div>
  </div>

  <script>
    let key = '';
    let expiresIn = 0;

    async function fetchKey() {
      const res = await fetch('/generate');
      const data = await res.json();
      key = data.key;
      expiresIn = data.expiresIn;
      document.getElementById('keyDisplay').innerText = key;
      startCountdown(expiresIn / 1000);
    }

    function copyKey() {
      navigator.clipboard.writeText(key);
      alert("Key copied to clipboard!");
    }

    function startCountdown(seconds) {
      function update() {
        if (seconds <= 0) return;
        seconds--;

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        document.getElementById('countdown').innerText =
          `Expires in: ${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }

      update();
      setInterval(update, 1000);
    }

    fetchKey();
  </script>
</body>
</html>
