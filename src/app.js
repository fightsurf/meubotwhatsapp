require('dotenv').config(); // ESSENCIAL: Carrega as chaves do Render
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

// 🔒 NÚMERO AUTORIZADO
const NUMERO_AUTORIZADO = '558398099164';

// ===== CONTROLE DE ESTADO E MEMÓRIA =====
const estadoCliente = new Map();
const memoriaMensagens = new Map(); // Nova memória para contexto

// ===== NORMALIZA TELEFONE =====
function normalizarTelefone(phone) {
  return phone
    .replace('@c.us', '')
    .replace('@lid', '')
    .replace(/\D/g, '');
}

// ===== ENVIO TEXTO =====
async function enviarMensagem(phone, message) {
  try {
    return await axios.post(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
      { phone, message },
      {
        headers: {
          'Client-Token': CLIENT_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('❌ Erro Z-API:', err.response?.data || err.message);
  }
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  // 1. Resposta rápida para o Z-API
  res.sendStatus(200);

  // 2. Filtro de segurança: Ignora se a mensagem veio do próprio bot ou se for grupo
  if (req.body.fromMe === true || req.body.isGroup === true) return;
  if (!req.body.phone || !req.body.text?.message) return;

  const phone = normalizarTelefone(req.body.phone);
  const texto = req.body.text.message.trim();

  // 🔒 TRAVA POR NÚMERO
  if (phone !== NUMERO_AUTORIZADO) {
    return;
  }

  console.log('📞 Phone:', phone);
  console.log('📩 Texto:', texto);

  // ===== ESTADO ATUAL =====
  let estado = estadoCliente.get(phone);
  let historico = memoriaMensagens.get(phone) || [];

  // ===== PRIMEIRO CONTATO =====
  if (!estado) {
    estadoCliente.set(phone, 'ATENDIMENTO');
    
    const saudacao = 'Você está falando com a Alumínio JR.\nMeu nome é George. Em que posso te ajudar?';
    await enviarMensagem(phone, saudacao);
    
    // Inicia histórico com a saudação do bot
    memoriaMensagens.set(phone, [{ role: 'assistant', content: saudacao }]);
    return;
  }

  // ===== ATENDIMENTO HUMANO =====
  if (estado === 'HUMANO') {
    return;
  }

  // ===== ATENDIMENTO COMERCIAL (IA) =====
  try {
    // Passamos o texto atual E o histórico para a IA não ter amnésia
    const respostaIA = await responderComIA(texto, historico);
    
    if (respostaIA) {
      await enviarMensagem(phone, respostaIA);

      // Atualiza a memória com a pergunta e a resposta
      historico.push({ role: 'user', content: texto });
      historico.push({ role: 'assistant', content: respostaIA });
      
      // Guarda apenas as últimas 6 mensagens para economizar tokens
      memoriaMensagens.set(phone, historico.slice(-6));
    }
  } catch (err) {
    console.error('❌ ERRO IA:', err.message);
    await enviarMensagem(
      phone,
      'Posso te ajudar com produtos, preços ou o catálogo da Alumínio JR.'
    );
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
