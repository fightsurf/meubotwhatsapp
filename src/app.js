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

// ===== PRIMEIRO CONTATO (persistência simples local) =====
const DATA_DIR = '/opt/render/project/data';
const CLIENTES_PATH = path.join(DATA_DIR, 'clientes.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLIENTES_PATH)) fs.writeFileSync(CLIENTES_PATH, '{}');

function lerClientes() {
  try { return JSON.parse(fs.readFileSync(CLIENTES_PATH, 'utf-8')); }
  catch { return {}; }
}
function salvarClientes(c) {
  fs.writeFileSync(CLIENTES_PATH, JSON.stringify(c, null, 2));
}

// ===== ENVIO WHATSAPP =====
async function enviarMensagem(phone, message) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
    { phone, message },
    { headers: { 'Client-Token': CLIENT_TOKEN, 'Content-Type': 'application/json' } }
  );
}

async function enviarImagem(phone, imageUrl, caption) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-image`,
    { phone, image: imageUrl, caption },
    { headers: { 'Client-Token': CLIENT_TOKEN, 'Content-Type': 'application/json' } }
  );
}

// ===== UTIL =====
function normalizar(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tira acentos
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPerguntaPreco(txtNorm) {
  return (
    txtNorm.includes('preco') ||
    txtNorm.includes('preço') || // só por garantia (mesmo normalizado)
    txtNorm.includes('quanto custa') ||
    txtNorm.includes('valor') ||
    txtNorm.includes('custa quanto')
  );
}

// remove palavras “lixo” e tenta pegar só o nome do produto
function extrairTermoProduto(txtNorm) {
  // tira gatilhos comuns
  const lixo = [
    'qual', 'o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos',
    'preco', 'preco?', 'preco', 'quanto', 'custa', 'valor',
    'por', 'favor', 'me', 'diz', 'diga', 'tem', 'tens', 'voces', 'vocês',
    'ai', 'aí', 'pra', 'para', 'e', 'um', 'uma', 'no', 'na'
  ];

  const tokens = txtNorm.split(' ').filter(t => t && !lixo.includes(t));
  // se ficou vazio, devolve o texto original normalizado (pra não quebrar)
  return tokens.join(' ').trim() || txtNorm;
}

async function obterProdutosCatalogo() {
  const resp = await axios.get(CATALOGO_API, { timeout: 15000 });
  return Array.isArray(resp.data) ? resp.data : [];
}

function matchScore(nomeProdutoNorm, tokensBusca) {
  // score = quantos tokens existem no nome
  let score = 0;
  for (const t of tokensBusca) {
    if (!t) continue;
    if (nomeProdutoNorm.includes(t)) score++;
  }
  return score;
}

function formatarPreco(preco) {
  // preco pode vir number ou string
  const n = typeof preco === 'number'
    ? preco
    : parseFloat(String(preco).replace(',', '.').replace(/[^\d.]/g, ''));
  if (Number.isNaN(n)) return null;
  return n.toFixed(2).replace('.', ',');
}

async function buscarProdutos(termo) {
  const produtos = await obterProdutosCatalogo();
  const termoNorm = normalizar(termo);

  // tokens da busca (mínimo 1)
  const tokens = termoNorm.split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  // calcula score e filtra score >= 1
  const scored = produtos
    .map(p => {
      const nomeNorm = normalizar(p.nome);
      return { p, score: matchScore(nomeNorm, tokens) };
    })
    .filter(x => x.score >= 1)
    .sort((a, b) => b.score - a.score);

  // mantém os melhores (se tiver muita coisa, limita)
  const topScore = scored[0]?.score || 0;
  const melhores = scored.filter(x => x.score === topScore).slice(0, 10).map(x => x.p);

  return melhores;
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const phone = req.body.phone;
  const texto = req.body.text?.message;

  if (!phone || !texto) return;

  const txtNorm = normalizar(texto);
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

  // ===== SE PEDIU CATÁLOGO =====
  if (txtNorm.includes('catalogo') || txtNorm.includes('catálogo')) {
    await enviarMensagem(phone, 'Catálogo completo 👉 https://catalogo-aluminio-jr.onrender.com');
    return;
  }

  // ===== PREÇO (NUNCA CHUTAR VIA IA) =====
  if (isPerguntaPreco(txtNorm)) {
    const termo = extrairTermoProduto(txtNorm);
    const encontrados = await buscarProdutos(termo);

    if (encontrados.length === 0) {
      await enviarMensagem(
        phone,
        'Não achei esse item no catálogo. Me diga o nome exato (ex: “cafeteira 1L”, “cuscuzeira express”).'
      );
      return;
    }

    // manda todos os encontrados (bom p/ “cafeteira” = 2 itens)
    for (const p of encontrados) {
      const precoFmt = formatarPreco(p.preco);
      const legenda = precoFmt
        ? `${p.nome}\n💰 R$ ${precoFmt}`
        : `${p.nome}\n💰 (preço não cadastrado)`;

      if (p.foto) {
        await enviarImagem(phone, p.foto, legenda);
      } else {
        await enviarMensagem(phone, legenda);
      }
    }
    return;
  }

  // ===== IA (só pra conversa geral; sem preço) =====
  try {
    const resposta = await responderComIA(texto);
    if (resposta && resposta.trim()) {
      await enviarMensagem(phone, resposta.trim());
    }
  } catch (err) {
    console.error('❌ ERRO IA:', err.response?.data || err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Bot rodando na porta ${PORT}`);
});
