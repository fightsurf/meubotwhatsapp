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

// 🔒 SEU NÚMERO (EXATO COMO CHEGA DO Z-API)
const NUMERO_AUTORIZADO = '558398099164';

// ===== LINKS =====
const LINK_CATALOGO = 'https://catalogo-aluminio-jr.onrender.com';
const LINK_KITS = 'https://catalogo-aluminio-jr.onrender.com/kits-feirinha';
const API_PRODUTOS = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';

// ===== CONTROLE DE PRIMEIRO CONTATO =====
let primeiroContato = false;

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
  return (
    `Catálogo completo Alumínio JR\n` +
    `👉 ${LINK_CATALOGO}`
  );
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

  // 🔒 SÓ VOCÊ
  if (phone !== NUMERO_AUTORIZADO) return;

  // ===== RESET =====
  if (texto === '123reset') {
    primeiroContato = false;
    await enviarMensagem(phone, '✅ Primeiro contato resetado.');
    return;
  }

  // ===== PRIMEIRO CONTATO =====
  if (!primeiroContato) {
    primeiroContato = true;
    await enviarMensagem(phone, mensagemInicial());
    return;
  }

  // ===== PEDIDO DE CATÁLOGO =====
  if (
    texto.includes('catálogo') ||
    texto.includes('catalogo')
  ) {
    await enviarMensagem(phone, mensagemCatalogoDireta());
    return;
  }

  // ===== PEDIDO DE PREÇO =====
  if (
    texto.includes('preço') ||
    texto.includes('precos') ||
    texto.includes('valor') ||
    texto.includes('quanto custa')
  ) {
    try {
      const { data: produtos } = await axios.get(API_PRODUTOS);

      const termo = texto
        .replace('preço', '')
        .replace('valor', '')
        .replace('quanto custa', '')
        .trim();

      const encontrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(termo)
      );

      if (encontrados.length === 0) {
        await enviarMensagem(
          phone,
          'Não encontrei esse item no catálogo. Pode especificar melhor?'
        );
        return;
      }

      for (const p of encontrados) {
        const textoProduto = `${p.nome} — R$ ${p.preco.toFixed(2).replace('.', ',')}`;
        await enviarMensagem(phone, textoProduto);

        if (p.foto) {
          await enviarImagem(phone, p.foto, textoProduto);
        }
      }

      return;

    } catch (err) {
      console.error('❌ ERRO CATÁLOGO:', err.message);
      await enviarMensagem(phone, 'Erro ao consultar o catálogo.');
      return;
    }
  }

  // ===== IA =====
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
