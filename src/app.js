const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado');

// ===== Z-API =====
const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN_INSTANCIA = process.env.TOKEN_INSTANCIA;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// ===== CATÁLOGO =====
const CATALOGO_API = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';

// ===== PRIMEIRO CONTATO =====
const DATA_DIR = '/opt/render/project/data';
const CLIENTES_PATH = path.join(DATA_DIR, 'clientes.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLIENTES_PATH)) fs.writeFileSync(CLIENTES_PATH, '{}');

function lerClientes() {
  try {
    return JSON.parse(fs.readFileSync(CLIENTES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function salvarClientes(c) {
  fs.writeFileSync(CLIENTES_PATH, JSON.stringify(c, null, 2));
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

async function enviarImagem(phone, imageUrl, caption) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-image`,
    {
      phone,
      image: imageUrl,
      caption
    },
    {
      headers: {
        'Client-Token': CLIENT_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

// ===== BUSCA NO CATÁLOGO =====
async function buscarProdutosPorTexto(texto) {
  const resp = await axios.get(CATALOGO_API);
  const produtos = resp.data;

  const termo = texto.toLowerCase();

  return produtos.filter(p =>
    p.nome.toLowerCase().includes(termo)
  );
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const phone = req.body.phone;
  const texto = req.body.text?.message;

  if (!phone || !texto) return;

  const textoLower = texto.toLowerCase();
  const clientes = lerClientes();

  // ===== PRIMEIRO CONTATO =====
  if (!clientes[phone]) {
    clientes[phone] = true;
    salvarClientes(clientes);

    await enviarMensagem(
      phone,
      'ALUMÍNIO JR\n\n' +
      'Catálogo completo\n' +
      '👉 https://catalogo-aluminio-jr.onrender.com\n\n' +
      'KITS FEIRINHA\n' +
      'Panela de pressão a partir de R$ 14\n' +
      '👉 https://catalogo-aluminio-jr.onrender.com/kits-feirinha\n\n' +
      'Meu nome é George, em que posso te ajudar?'
    );
    return;
  }

  // ===== CONSULTA DE PREÇO =====
  if (
    textoLower.includes('preço') ||
    textoLower.includes('preco') ||
    textoLower.includes('quanto custa') ||
    textoLower.includes('valor')
  ) {
    const encontrados = await buscarProdutosPorTexto(textoLower);

    if (encontrados.length > 0) {
      for (const p of encontrados) {
        const legenda =
          `${p.nome}\n💰 R$ ${p.preco.toFixed(2).replace('.', ',')}`;

        if (p.foto) {
          await enviarImagem(phone, p.foto, legenda);
        } else {
          await enviarMensagem(phone, legenda);
        }
      }
      return;
    }
  }

  // ===== IA (QUALQUER OUTRO CASO) =====
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
  console.log('🟢 Bot com preços individuais + fotos ativo');
});
