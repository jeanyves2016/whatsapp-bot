const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");

const app = express();
const PORT = 3000;

let qrCodeData = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

client.on("qr", (qr) => {
  console.log("QR généré");
  qrCodeData = qr;
});

client.on("ready", () => {
  console.log("WhatsApp connecté 🚀");
});

client.on("message", message => {
  console.log("Message reçu:", message.body);

  if (message.body === "ping") {
    message.reply("pong 🏓");
  }
});

client.initialize();

app.get("/", (req, res) => {
  res.send("Bot actif 🚀");
});

app.get("/qr", async (req, res) => {
  if (!qrCodeData) {
    return res.send("Pas de QR disponible");
  }

  const qrImage = await QRCode.toDataURL(qrCodeData);

  res.send(`
    <html>
    <body>
    <h2>Scanner le QR WhatsApp</h2>
    <img src="${qrImage}" />
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log("Serveur lancé sur", PORT);
});
