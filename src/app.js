const express = require('express');
const axios = require('axios');
const path = require('path');

const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado (ESTADO CONTROLADO + TRAVA POR NÚMERO)');

// ===== Z-API =====
const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN_INSTANCIA = process.env.TOKEN_INSTANCIA;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// 🔒 SEU NÚMERO (ÚNICO AUTORIZADO)
const NUMERO_AUTORIZADO = '558398099164';

// ===== CONTROLE DE ESTADO =====
// INICIAL | ATENDIMENTO | HUMANO
const estadoCliente = new Map();

// ===== NORMALIZA TELEFONE =====
function normalizarTelefone(phone) {
  return phone
    .replace('@c.us', '')
    .replace('@lid', '')
    .replace(/\D/g, '');
}

// ===== ENVIO TEXTO =====
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
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (!req.body.phone || !req.body.text?.message) return;

  const phone = normalizarTelefone(req.body.phone);
  const texto = req.body.text.message.trim();

  console.log('📞 Phone:', phone);
  console.log('📩 Texto:', texto);

  // 🔒 TRAVA TOTAL — SÓ VOCÊ
  if (phone !== NUMERO_AUTORIZADO) {
    console.log('⛔ Número não autorizado. Ignorado.');
    return;
  }

  // ===== ESTADO ATUAL =====
  let estado = estadoCliente.get(phone);

  // ===== PRIMEIRO CONTATO =====
  if (!estado) {
    estadoCliente.set(phone, 'INICIAL');

    await enviarMensagem(
      phone,
      'Olá! Seja bem-vindo à Alumínio JR.\nComo posso te ajudar?'
    );

    return;
  }

  // ===== ATENDIMENTO HUMANO =====
  if (estado === 'HUMANO') {
    console.log('⛔ Atendimento humano ativo. Bot não responde.');
    return;
  }

  // ===== TRANSIÇÃO INICIAL → ATENDIMENTO =====
  if (estado === 'INICIAL') {
    estadoCliente.set(phone, 'ATENDIMENTO');
  }

  // ===== ATENDIMENTO (IA ESCREVE) =====
  try {
    const respostaIA = await responderComIA(texto);
    await enviarMensagem(phone, respostaIA);
  } catch (err) {
    console.error('❌ ERRO IA:', err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
