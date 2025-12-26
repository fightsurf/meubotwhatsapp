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
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// 🔒 NÚMERO AUTORIZADO (SOMENTE VOCÊ)
const NUMERO_AUTORIZADO = '558398099164';

// ===== LINKS =====
const LINK_CATALOGO = 'https://catalogo-aluminio-jr.onrender.com';
const LINK_KITS = 'https://catalogo-aluminio-jr.onrender.com/kits-feirinha';

// ===== ENVIO WHATSAPP =====
async function enviarMensagem(phone, message) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
    { phone, message },
    {
      headers: {
        'Client-Token': CLIENT_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

// ===== PRIMEIRO CONTATO =====
function mensagemInicial() {
  return (
    `ALUMÍNIO JR\n\n` +
    `Catálogo completo\n` +
    `👉 ${LINK_CATALOGO}\n\n` +
    `KITS FEIRINHA\n` +
    `Panela de pressão a partir de R$ 14\n` +
    `👉 ${LINK_KITS}\n\n` +
    `Meu nome é George, em que posso te ajudar?`
  );
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const phone = req.body.phone;
  const texto = req.body.text?.message;

  if (!phone || !texto) return;

  // 🔒 BLOQUEIO TOTAL DE IA PARA OUTROS NÚMEROS
  if (phone !== NUMERO_AUTORIZADO) {
    await enviarMensagem(phone, mensagemInicial());
    return;
  }

  // ===== A PARTIR DAQUI, SÓ VOCÊ =====
  try {
    console.log('📩 Mensagem recebida:', texto);

    const resposta = await responderComIA(texto);

    console.log('🤖 Resposta IA:', resposta);

    await enviarMensagem(phone, resposta);

  } catch (err) {
    console.error(
      '❌ ERRO IA:',
      err.response?.data || err.message
    );
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
