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

// 🔒 SEU NÚMERO (EXATAMENTE COMO O Z-API ENVIA)
const NUMERO_AUTORIZADO = '558398099164';

// ===== LINKS =====
const LINK_CATALOGO = 'https://catalogo-aluminio-jr.onrender.com';
const LINK_KITS = 'https://catalogo-aluminio-jr.onrender.com/kits-feirinha';

// ===== CONTROLE DE PRIMEIRO CONTATO =====
let primeiroContato = false;

// ===== NORMALIZA TELEFONE =====
function normalizarTelefone(phone) {
  return phone
    .replace('@c.us', '')
    .replace('@lid', '')
    .replace(/\D/g, '');
}

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

// ===== PRIMEIRA MENSAGEM =====
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

// ===== MENSAGEM CATÁLOGO DIRETA =====
function mensagemCatalogoDireta() {
  return (
    `Catálogo completo Alumínio JR\n` +
    `👉 ${LINK_CATALOGO}/`
  );
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (!req.body.phone || !req.body.text?.message) return;

  const phoneRaw = req.body.phone;
  const phone = normalizarTelefone(phoneRaw);
  const texto = req.body.text.message.trim().toLowerCase();

  console.log('📞 Phone recebido:', phoneRaw, '→ normalizado:', phone);

  // 🔒 REGRA MÁXIMA: SÓ VOCÊ
  if (phone !== NUMERO_AUTORIZADO) {
    return;
  }

  // ===== RESET =====
  if (texto === '123reset') {
    primeiroContato = false;
    await enviarMensagem(phone, '✅ Primeiro contato resetado.');
    console.log('♻️ Reset executado');
    return;
  }

  // ===== PRIMEIRO CONTATO =====
  if (!primeiroContato) {
    primeiroContato = true;
    await enviarMensagem(phone, mensagemInicial());
    return;
  }

  // ===== PEDIDO DE CATÁLOGO (SEM IA) =====
  if (
    texto.includes('catálogo') ||
    texto.includes('catalogo') ||
    texto.includes('preço') ||
    texto.includes('preços') ||
    texto.includes('produtos')
  ) {
    await enviarMensagem(phone, mensagemCatalogoDireta());
    return;
  }

  // ===== IA =====
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
