const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ====== CONFIGURAÇÕES ======
const INSTANCE_ID = '3EC3247648EB722CD4655A8D44CAB450';
const TOKEN_INSTANCIA = 'B605033F5F640093BC9FD637';
const CLIENT_TOKEN = 'Fa24360be57dd4b9d89e172e66818ca5aS';

// OpenAI
const OPENAI_API_KEY = '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';
// ===========================

// função para enviar mensagem no WhatsApp
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

// ===== WEBHOOK =====
app.post('/webhook', (req, res) => {
  const phone = req.body.phone;
  const texto = req.body.text?.message;

  // responde rápido
  res.sendStatus(200);

  if (!phone || !texto) return;

  const msg = texto.toLowerCase();

  // ===== REGRAS DURAS =====
  if (msg === 'oi' || msg === 'olá' || msg === 'ola') {
    return enviarMensagem(
      phone,
      `Olá! 👋 Sou o atendimento da *Alumínio JR*.\n\n` +
      `1️⃣ Kits\n2️⃣ Preços\n3️⃣ Falar com humano`
    );
  }

  if (msg.includes('kit')) {
    return enviarMensagem(
      phone,
      `Trabalhamos com *kits de alumínio* completos para revenda e uso doméstico.\n` +
      `Quer kit econômico ou kit completo?`
    );
  }

  if (msg.includes('preço') || msg.includes('preco')) {
    return enviarMensagem(
      phone,
      `Temos kits a partir de *R$ 16 por item*.\n` +
      `Me diga: uso pessoal ou revenda?`
    );
  }

  if (msg.includes('humano') || msg.includes('atendente')) {
    return enviarMensagem(
      phone,
      `Certo 👍 Vou chamar um atendente humano para continuar com você.`
    );
  }

  // ===== IA HÍBRIDA (fallback) =====
  setTimeout(async () => {
    try {
      const respostaIA = await axios.post(
        '
