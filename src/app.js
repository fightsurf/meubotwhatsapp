const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado');

// ===== Z-API =====
const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN_INSTANCIA = process.env.TOKEN_INSTANCIA;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// número autorizado (somente você)
const NUMERO_AUTORIZADO = '558398099164';

// ===== PERSISTÊNCIA =====
const DATA_DIR = '/opt/render/project/data';
const CLIENTES_PATH = path.join(DATA_DIR, 'clientes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(CLIENTES_PATH)) {
  fs.writeFileSync(CLIENTES_PATH, '{}');
}

function lerClientes() {
  try {
    return JSON.parse(fs.readFileSync(CLIENTES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function salvarClientes(clientes) {
  fs.writeFileSync(CLIENTES_PATH, JSON.stringify(clientes, null, 2));
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

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const phone = req.body.phone;
  const texto = req.body.text?.message;

  if (!phone || !texto) return;

  const textoLower = texto.trim().toLowerCase();
  const clientes = lerClientes();

  // ===== RESET PARA TESTES =====
  if (phone === NUMERO_AUTORIZADO && textoLower === '123reset') {
    salvarClientes({});
    await enviarMensagem(
      phone,
      '♻️ Reset realizado.\nPrimeiro contato zerado.'
    );
    return;
  }

  // ===== PRIMEIRO CONTATO (TRÁFEGO) =====
  if (!clientes[phone]) {
    clientes[phone] = {
      primeiroContato: new Date().toISOString()
    };
    salvarClientes(clientes);

    await enviarMensagem(
      phone,
      'Olá! 👋\n' +
      'Aqui é o atendimento da *Alumínio JR*.\n\n' +
      '📦 *Catálogo completo*\n' +
      '👉 https://catalogo-aluminio-jr.onrender.com\n\n' +
      '🔥 *KITS FEIRINHA*\n' +
      'Panela de pressão Alumínio JR a partir de *R$ 14,00*\n' +
      '👉 https://catalogo-aluminio-jr.onrender.com/kits-feirinha\n\n' +
      'Se quiser, me diga o que você procura 😉'
    );
    return;
  }

  // ===== PEDIDOS DE CATÁLOGO =====
  if (
    textoLower.includes('catalogo') ||
    textoLower.includes('catálogo') ||
    textoLower.includes('produtos') ||
    textoLower.includes('preço') ||
    textoLower.includes('precos')
  ) {
    await enviarMensagem(
      phone,
      '📦 Catálogo Alumínio JR\nhttps://catalogo-aluminio-jr.onrender.com'
    );
    return;
  }

  // ===== IA (APÓS PRIMEIRO CONTATO) =====
  try {
    const resposta = await responderComIA(texto);
    await enviarMensagem(phone, resposta);
  } catch (err) {
    console.error('❌ ERRO IA:', err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('🟢 Bot com primeiro contato otimizado para tráfego');
});
