const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require("express")
const QRCode = require("qrcode")
const P = require("pino")
const axios = require("axios")

const app = express()
let latestQR = null

// ----------- IA FUNCTION -----------
async function askAI(question) {

```
try {

    const res = await axios.post(
        "http://ollama:11434/api/generate",
        {
            model: "mistral",
            prompt: question,
            stream: false
        }
    )

    return res.data.response

} catch (error) {

    console.log("Erreur IA:", error.message)

    return "Désolé, je rencontre un problème technique."

}
```

}

// ----------- WHATSAPP BOT -----------
async function startBot() {

```
const { state, saveCreds } = await useMultiFileAuthState("auth")

const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0]

    if (!msg.message || msg.key.fromMe) return

    const text = msg.message.conversation || ""

    console.log("Message reçu:", text)

    // MENU
    if (text.toLowerCase() === "bonjour") {

        await sock.sendMessage(msg.key.remoteJid, {
            text:
```

`Bonjour 👋

Je suis l'assistant automatique.

1️⃣ Informations
2️⃣ Support
3️⃣ Agent humain

Ou posez directement votre question.`
})

```
        return
    }

    // IA RESPONSE
    const aiResponse = await askAI(text)

    await sock.sendMessage(msg.key.remoteJid, {
        text: aiResponse
    })

})

sock.ev.on("connection.update", async (update) => {

    const { connection, qr } = update

    if (qr) {

        latestQR = await QRCode.toDataURL(qr)

        console.log("QR généré")

    }

    if (connection === "open") {

        console.log("✅ Bot connecté")

        latestQR = null
    }
})
```

}

startBot()

// ----------- SERVER -----------
app.get("/", (req, res) => {
res.send("Bot actif 🚀")
})

app.get("/qr", (req, res) => {

```
if (!latestQR) return res.send("Pas de QR disponible")

res.send(`<img src="${latestQR}" />`)
```

})

app.listen(3000, () => {

```
console.log("Serveur démarré sur 3000")
```

})
