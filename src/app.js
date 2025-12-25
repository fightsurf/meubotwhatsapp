const express = require('express');
const axios = require('axios');
const chamarIA = require('./ia');
const config = require('./config');

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado (modo produção seguro)');

// ===== CONTROLE GLOBAL =====
let IA_ATIVA = false;

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

  const msg = texto.trim();

  // 🔐 SENHA DE ATIVAÇÃO (APENAS VOCÊ)
  if (msg === '123mudar') {
    IA_ATIVA = true;
    await enviarMensagem(
      phone,
      '✅ Modo IA ativado.\n\nDigite:\n1 - Kits\n2 - Preços\nOu escreva normalmente para testar a IA.'
    );
    console.log('🔓 IA ATIVADA MANUALMENTE');
    return;
  }

  // 🔒 PRODUÇÃO: não responde nada antes da senha
  if (!IA_ATIVA) {
    console.log('⛔ Mensagem ignorada (IA desligada)');
    return;
  }

  const textoLower = msg.toLowerCase();

  // ===== MENU =====
  if (textoLower === 'oi' || textoLower === 'ola' || textoLower === 'olá') {
    return enviarMensagem(
      phone,
      '👋 Atendimento Alumínio JR\n\n' +
      '1️⃣ Kits\n' +
      '2️⃣ Preços\n' +
      '3️⃣ Falar com humano'
    );
  }

  if (textoLower === '1' || textoLower.includes('kit')) {
    return enviarMensagem(
      phone,
      '📦 Trabalhamos com kits econômicos e completos.\n\nDiga o valor médio por item que você procura.'
    );
  }

  if (textoLower === '2' || textoLower.includes('preço') || textoLower.includes('preco')) {
    return enviarMensagem(
      phone,
      '💰 Pode me dizer qual produto você quer consultar ou se prefere montar um kit?'
    );
  }

  if (textoLower === '3' || textoLower.includes('humano')) {
    return enviarMensagem(
      phone,
      '👤 Certo. Um atendente humano assumirá a conversa.'
    );
  }

  // ===== IA =====
  try {
    const respostaIA = await chamarIA(msg);
    await enviarMensagem(phone, respostaIA);
    console.log('🤖 IA respondeu com sucesso');
  } catch (err) {
    console.error('❌ ERRO IA:', err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
