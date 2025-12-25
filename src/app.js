const express = require('express');
const axios = require('axios');
const path = require('path');

const chamarIA = require(path.join(__dirname, 'ia.js'));
const config = require(path.join(__dirname, 'config.js'));

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado (produção restrita)');

// ===== CONTROLE =====
const NUMERO_AUTORIZADO = '558398099164'; // seu WhatsApp

// ===== ENVIO =====
async function enviarMensagem(phone, message) {
  return axios.post(
    `https://api.z-api.io/instances/${config.INSTANCE_ID}/token/${config.TOKEN_INSTANCIA}/send-text`,
    { phone, message },
    {
      headers: {
        'Client-Token': config.CLIENT_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const phone = req.body.phone;
  const texto = req.body.text?.message;

  if (!phone || !texto) return;

  if (phone !== NUMERO_AUTORIZADO) {
    console.log('⛔ Ignorado:', phone);
    return;
  }

  try {
    const resposta = await chamarIA(texto);
    await enviarMensagem(phone, resposta);
    console.log('🤖 IA respondeu');
  } catch (err) {
    console.error('❌ ERRO IA:', err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
