const express = require('express');
const axios = require('axios');
const path = require('path');

const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado (IA-FIRST)');

// ===== Z-API =====
const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN_INSTANCIA = process.env.TOKEN_INSTANCIA;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// 🤖 NÚMERO DO BOT / ADMIN
const NUMERO_BOT = '558399792085';

// ===== LINKS =====
const LINK_CATALOGO = 'https://catalogo-aluminio-jr.onrender.com';
const API_PRODUTOS = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';

// ===== CONTROLES =====
const primeirosContatos = new Set();
const clientesAssumidos = new Set();

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
    `Catálogo completo\n👉 ${LINK_CATALOGO}\n\n` +
    `Meu nome é George, em que posso te ajudar?`
  );
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (!req.body.phone || !req.body.text?.message) return;

  const phone = normalizarTelefone(req.body.phone);
  const textoOriginal = req.body.text.message.trim();

  console.log('📞 Phone:', phone);
  console.log('📩 Texto:', textoOriginal);

  // =====================================================
  // 🔐 COMANDOS ADMIN (MENSAGEM CITADA)
  // =====================================================
  if (phone === NUMERO_BOT && req.body.quoted?.participant) {
    const clienteAlvo = normalizarTelefone(req.body.quoted.participant);

    if (textoOriginal === '#assumir') {
      clientesAssumidos.add(clienteAlvo);
      await enviarMensagem(phone, `🔒 Atendimento assumido para ${clienteAlvo}`);
      return;
    }

    if (textoOriginal === '#liberar') {
      clientesAssumidos.delete(clienteAlvo);
      await enviarMensagem(phone, `🔓 Atendimento liberado para ${clienteAlvo}`);
      return;
    }
  }

  // =====================================================
  // 🚫 CLIENTE EM ATENDIMENTO HUMANO
  // =====================================================
  if (clientesAssumidos.has(phone)) {
    console.log('⛔ Cliente em atendimento humano');
    return;
  }

  // =====================================================
  // 👋 PRIMEIRO CONTATO
  // =====================================================
  if (!primeirosContatos.has(phone)) {
    primeirosContatos.add(phone);
    await enviarMensagem(phone, mensagemInicial());
  }

  // =====================================================
  // 🤖 IA PRIMEIRO
  // =====================================================
  const respostaIA = await responderComIA(textoOriginal);

  // ===== A IA NÃO PEDIU AÇÃO → RESPONDE DIRETO =====
  if (!respostaIA.startsWith('INTENCAO:')) {
    await enviarMensagem(phone, respostaIA);
    return;
  }

  // =====================================================
  // 📌 INTERPRETA INTENÇÃO DA IA
  // =====================================================
  const linhas = respostaIA.split('\n');
  const intencao = linhas[0].replace('INTENCAO:', '').trim();
  const termo = linhas.find(l => l.startsWith('TERMO:'))?.replace('TERMO:', '').trim();

  // =====================================================
  // 📚 CATÁLOGO
  // =====================================================
  if (intencao === 'CATALOGO') {
    await enviarMensagem(
      phone,
      `Catálogo completo Alumínio JR\n👉 ${LINK_CATALOGO}`
    );
    return;
  }

  // =====================================================
  // 📦 PRODUTO
  // =====================================================
  if (intencao === 'PRODUTO' && termo) {
    try {
      const { data: produtos } = await axios.get(API_PRODUTOS);

      const encontrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(termo.toLowerCase())
      ).slice(0, 3);

      if (encontrados.length === 0) {
        await enviarMensagem(
          phone,
          'Não encontrei esse item no catálogo. Pode especificar melhor?'
        );
        return;
      }

      await enviarMensagem(
        phone,
        `Encontrei ${encontrados.length} itens com o nome "${termo}":`
      );

      for (const p of encontrados) {
        const preco =
          `R$ ${Number(p.preco).toFixed(2).replace('.', ',')}`;

        await enviarMensagem(phone, `${p.nome}: *${preco}* 👇`);

        if (p.foto) {
          await enviarImagem(phone, p.foto);
        }
      }
      return;

    } catch (err) {
      console.error('❌ ERRO CATÁLOGO:', err.message);
      await enviarMensagem(phone, 'Erro ao consultar o catálogo.');
      return;
    }
  }

  // =====================================================
  // 🤖 FALLBACK
  // =====================================================
  await enviarMensagem(phone, respostaIA);
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
