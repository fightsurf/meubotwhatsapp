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

// ===== DISCO PERSISTENTE =====
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

// ===== ENVIA TEXTO =====
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
  if (phone !== NUMERO_AUTORIZADO) return;

  const textoLower = texto.trim().toLowerCase();

  // ===== RESET DE PRIMEIRO CONTATO =====
  if (textoLower === '123reset') {
    salvarClientes({});
    await enviarMensagem(
      phone,
      '♻️ Reset realizado com sucesso.\nTabela de primeiro contato zerada.'
    );
    return;
  }

  const clientes = lerClientes();

  // ===== PRIMEIRO CONTATO =====
  if (!clientes[phone]) {
    clientes[phone] = {
      primeiroContato: new Date().toISOString()
    };
    salvarClientes(clientes);

    await enviarMensagem(
      phone,
      'Olá! 👋\nSou o atendimento da Alumínio JR.'
    );
    return;
  }

  // ===== CATÁLOGO =====
  if (
    textoLower.includes('catalogo') ||
    textoLower.includes('catálogo') ||
    textoLower.includes('produtos') ||
    textoLower.includes('lista') ||
    textoLower.includes('preços') ||
    textoLower.includes('preco')
  ) {
    await enviarMensagem(
      phone,
      '📦 Catálogo Alumínio JR\nhttps://catalogo-aluminio-jr.onrender.com'
    );
    return;
  }

  // ===== IA =====
  try {
    console.log('📩 Mensagem:', texto);

    const resposta = await responderComIA(texto);
    await enviarMensagem(phone, resposta);

  } catch (err) {
    console.error(
      '❌ ERRO BOT:',
      err.response?.data || err.message
    );
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('🟢 Bot rodando com RESET de primeiro contato ativo');
});
