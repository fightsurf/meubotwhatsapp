const express = require('express');
const axios = require('axios');
const path = require('path');

const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado');

// ===== Z-API =====
const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN_INSTANCIA = process.env.TOKEN_INSTANCIA;

// número autorizado (somente você)
const NUMERO_AUTORIZADO = '558398099164';

// envia mensagem pelo Z-API (SEM Client-Token)
async function enviarMensagem(phone, message) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
    {
      phone,
      message
    },
    {
      headers: {
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
  if (phone !== NUMERO_AUTORIZADO) return;

  try {
    console.log('📩 Mensagem recebida:', texto);

    const resposta = await responderComIA(texto);
    console.log('🤖 Resposta IA:', resposta);

    await enviarMensagem(phone, resposta);
    console.log('✅ Mensagem enviada ao WhatsApp');

  } catch (err) {
    console.error(
      '❌ ERRO AO ENVIAR MENSAGEM (Z-API):',
      err.response?.data || err.message
    );
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
