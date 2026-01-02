require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

const { INSTANCE_ID, TOKEN_INSTANCIA, CLIENT_TOKEN } = process.env;
const NUMERO_AUTORIZADO = '558398099164';
const memoriaMensagens = new Map();

async function enviarMensagem(phone, message) {
  try {
    await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`, 
      { phone, message }, { headers: { 'Client-Token': CLIENT_TOKEN } });
  } catch (err) { console.error('❌ Erro Texto:', err.message); }
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  if (req.body.fromMe || req.body.isGroup) return;

  const phone = req.body.phone.replace(/\D/g, '');
  const textoOriginal = req.body.text?.message;
  if (phone !== NUMERO_AUTORIZADO || !textoOriginal) return;

  let historico = memoriaMensagens.get(phone) || [];
  
  try {
    let { texto: respostaIA, produtosDaAPI } = await responderComIA(textoOriginal, historico);

    // FORÇAR QUEBRA DE LINHA NA SAUDAÇÃO
    if (respostaIA.includes("Você está falando com a Alumínio JR.")) {
      respostaIA = "Você está falando com a Alumínio JR. Em que posso ajudar?\n\nMonte seu pedido aqui: https://catalogo-aluminio-jr.onrender.com/orcamento";
    }

    await enviarMensagem(phone, respostaIA);

    historico.push({ role: 'user', content: textoOriginal }, { role: 'assistant', content: respostaIA });
    memoriaMensagens.set(phone, historico.slice(-10));

  } catch (err) { console.error('❌ Erro Webhook:', err.message); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🟢 George Online - Saudação Forçada`));
