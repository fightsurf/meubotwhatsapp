require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

// Importação garantida do arquivo ia.js
const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado');

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN_INSTANCIA = process.env.TOKEN_INSTANCIA;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;
const NUMERO_AUTORIZADO = '558398099164';

const estadoCliente = new Map();
const memoriaMensagens = new Map();

function normalizarTelefone(phone) {
  return phone.replace('@c.us', '').replace('@lid', '').replace(/\D/g, '');
}

async function enviarMensagem(phone, message) {
  try {
    await axios.post(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
      { phone, message },
      { headers: { 'Client-Token': CLIENT_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('❌ Erro Z-API:', err.response?.data || err.message);
  }
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  // Filtros de segurança essenciais
  if (req.body.fromMe === true || req.body.isGroup === true) return;
  if (!req.body.phone || !req.body.text?.message) return;

  const phone = normalizarTelefone(req.body.phone);
  const texto = req.body.text.message.trim();

  if (phone !== NUMERO_AUTORIZADO) return;

  let estado = estadoCliente.get(phone);
  let historico = memoriaMensagens.get(phone) || [];

  if (!estado) {
    estadoCliente.set(phone, 'ATENDIMENTO');
    const saudacao = 'Você está falando com a Alumínio JR.\nMeu nome é George. Em que posso te ajudar?';
    await enviarMensagem(phone, saudacao);
    memoriaMensagens.set(phone, [{ role: 'assistant', content: saudacao }]);
    return;
  }

  if (estado === 'HUMANO') return;

  try {
    const respostaIA = await responderComIA(texto, historico);
    
    if (respostaIA) {
      await enviarMensagem(phone, respostaIA);
      historico.push({ role: 'user', content: texto });
      historico.push({ role: 'assistant', content: respostaIA });
      memoriaMensagens.set(phone, historico.slice(-6));
    }
  } catch (err) {
    console.error('❌ ERRO NO FLUXO:', err.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🟢 Servidor na porta ${PORT}`));
