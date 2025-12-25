const express = require('express');
const axios = require('axios');
const chamarIA = require('./ia');
const config = require('./config');

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado (produção restrita)');

// ===== CONTROLE =====
const NUMERO_AUTORIZADO = '558398099164'; // SEU WHATSAPP

// ===== FUNÇÃO DE ENVIO =====
async function enviarMensagem(phone, message) {
  return axios.post(
    `https://api.z-api.io/instances/${config.INSTANCE_ID}/token/${config.TOKEN_INSTANCIA}/send-text`,
    {
      phone,
      message
    },
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

  // 🔒 BLOQUEIA QUALQUER OUTRO NÚMERO
  if (phone !== NUMERO_AUTORIZADO) {
    console.log('⛔ Mensagem ignorada de:', phone);
    return;
  }

  const msg = texto.trim().toLowerCase();

  // ===== MENU (SÓ VOCÊ VÊ) =====
  if (msg === 'oi' || msg === 'ola' || msg === 'olá') {
    return enviarMensagem(
      phone,
      '🧪 Modo teste Alumínio JR\n\n' +
      '1️⃣ Kits\n' +
      '2️⃣ Preços\n' +
      'Escreva qualquer coisa para testar a IA.'
    );
  }

  if (msg === '1' || msg.includes('kit')) {
    return enviarMensagem(
      phone,
      '📦 Teste de kits ativo. Diga o preço médio desejado.'
    );
  }

  if (msg === '2' || msg.includes('preço') || msg.includes('preco')) {
    return enviarMensagem(
      phone,
      '💰 Teste de preços ativo. Qual produto deseja consultar?'
    );
  }

  // ===== IA (SÓ VOCÊ) =====
  try {
    const respostaIA = await chamarIA(texto);
    await enviarMensagem(phone, respostaIA);
    console.log('🤖 IA respondeu para número autorizado');
  } catch (err) {
    console.error('❌ ERRO IA:', err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
