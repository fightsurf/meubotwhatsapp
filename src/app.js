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

// 🤖 NÚMERO DO BOT (ADMIN)
const NUMERO_BOT = '558399792085';

// ===== LINKS =====
const LINK_CATALOGO = 'https://catalogo-aluminio-jr.onrender.com';
const LINK_KITS = 'https://catalogo-aluminio-jr.onrender.com/kits-feirinha';
const API_PRODUTOS = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';

// ===== CONTROLES =====
const primeirosContatos = new Set();      // primeiro contato por cliente
const clientesBloqueados = new Set();     // clientes assumidos manualmente

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

// ===== ENVIO IMAGEM =====
async function enviarImagem(phone, imageUrl) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-image`,
    { phone, image: imageUrl },
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

// ===== CATÁLOGO DIRETO =====
function mensagemCatalogoDireta() {
  return `Catálogo completo Alumínio JR\n👉 ${LINK_CATALOGO}`;
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (!req.body.phone || !req.body.text?.message) return;

  const phone = normalizarTelefone(req.body.phone);
  const textoOriginal = req.body.text.message.trim();
  const texto = textoOriginal.toLowerCase();

  console.log('📞 Phone:', phone);
  console.log('📩 Texto:', textoOriginal);

  // =====================================================
  // 🔐 COMANDOS ADMIN (SÓ DO NÚMERO DO BOT)
  // =====================================================
  if (phone === NUMERO_BOT) {

    // assumir cliente
    if (texto.startsWith('#assumir')) {
      const alvo = texto.replace('#assumir', '').trim();
      if (alvo) {
        clientesBloqueados.add(alvo);
        await enviarMensagem(phone, `🔒 Bot bloqueado para o número ${alvo}`);
      }
      return;
    }

    // liberar cliente
    if (texto.startsWith('#liberar')) {
      const alvo = texto.replace('#liberar', '').trim();
      if (alvo) {
        clientesBloqueados.delete(alvo);
        await enviarMensagem(phone, `🔓 Bot liberado para o número ${alvo}`);
      }
      return;
    }
  }

  // =====================================================
  // 🚫 CLIENTE ASSUMIDO MANUALMENTE
  // =====================================================
  if (clientesBloqueados.has(phone)) {
    console.log('⛔ Cliente assumido manualmente. Bot não responde.');
    return;
  }

  // =====================================================
  // 👋 PRIMEIRO CONTATO
  // =====================================================
  if (!primeirosContatos.has(phone)) {
    primeirosContatos.add(phone);
    await enviarMensagem(phone, mensagemInicial());
    return;
  }

  // =====================================================
  // 📦 CATÁLOGO
  // =====================================================
  if (texto.includes('catálogo') || texto.includes('catalogo')) {
    await enviarMensagem(phone, mensagemCatalogoDireta());
    return;
  }

  // =====================================================
  // 🔍 BUSCA DE PRODUTOS (ATÉ 3)
  // =====================================================
  try {
    const { data: produtos } = await axios.get(API_PRODUTOS);

    const palavras = texto.split(' ').filter(p => p.length > 2);
    const termoBusca = palavras[0] || 'produto';

    const encontrados = produtos.filter(p => {
      const nome = p.nome.toLowerCase();
      return palavras.some(palavra => nome.includes(palavra));
    });

    if (encontrados.length > 0) {
      const limitados = encontrados.slice(0, 3);

      await enviarMensagem(
        phone,
        `Encontrei ${limitados.length} itens com o nome "${termoBusca}":`
      );

      for (const p of limitados) {
        const preco =
          `R$ ${Number(p.preco).toFixed(2).replace('.', ',')}`;

        await enviarMensagem(phone, `${p.nome}: *${preco}* 👇`);

        if (p.foto) {
          await enviarImagem(phone, p.foto);
        }
      }
      return;
    }

  } catch (err) {
    console.error('❌ ERRO CATÁLOGO:', err.message);
  }

  // =====================================================
  // 🤖 IA
  // =====================================================
  try {
    const resposta = await responderComIA(textoOriginal);
    await enviarMensagem(phone, resposta);
  } catch (err) {
    console.error('❌ ERRO IA:', err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
