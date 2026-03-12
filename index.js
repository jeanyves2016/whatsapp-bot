const axios = require("axios")
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require("express")
const QRCode = require("qrcode")
const P = require("pino")

const app = express()
let latestQR = null

async function askAI(question){

    try{

        const response = await axios.post(
            "http://vswg0g0o400cwckkkckg40gs-203209172076:11434/api/generate",
            {
                model: "mistral",
                prompt: question,
                stream: false
            }
        )

        return response.data.response

    }catch(err){

        console.log(err.message)

        return "Je rencontre un problème technique."

    }

}

async function startBot(){

    const { state, saveCreds } = await useMultiFileAuthState("auth")

    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        auth: state
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({ messages }) => {

        const msg = messages[0]

        if(!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || ""

        console.log("Message reçu:", text)

        const aiResponse = await askAI(text)

        await sock.sendMessage(msg.key.remoteJid,{
            text: aiResponse
        })

    })

    sock.ev.on("connection.update", async(update)=>{

        const { connection, qr } = update

        if(qr){
            latestQR = await QRCode.toDataURL(qr)
            console.log("QR généré")
        }

        if(connection === "open"){
            console.log("Bot connecté")
            latestQR = null
        }

    })

}

startBot()

app.get("/",(req,res)=>{
    res.send("Bot actif 🚀")
})

app.get("/qr",(req,res)=>{

    if(!latestQR) return res.send("Pas de QR disponible")

    res.send(`<img src="${latestQR}" />`)

})

app.listen(3000,()=>{
    console.log("Serveur lancé sur 3000")
})
