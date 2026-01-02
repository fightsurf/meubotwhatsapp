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
const estadoCliente = new Map();

// --- FUNÇÕES DE ENVIO Z-API ---

async function enviarMensagem(phone, message) {
  try {
    await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`, 
    { phone, message }, 
    { headers: { 'Client-Token': CLIENT_TOKEN } });
  } catch (err) { console.error('❌ Erro Texto:', err.message); }
}

async function enviarFoto(phone, image, caption) {
  try {
    await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-image`, 
    { phone, image, caption }, 
    { headers: { 'Client-Token': CLIENT_TOKEN } });
  } catch (err) { console.error('❌ Erro Imagem:', err.message); }
}

// --- WEBHOOK ---

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  if (req.body.fromMe || req.body.isGroup) return;

  const phone = req.body.phone.replace(/\D/g, '');
  const texto = req.body.text?.message;
  if (phone !== NUMERO_AUTORIZADO || !texto) return;

  let historico = memoriaMensagens.get(phone) || [];
  
  try {
    const { texto: respostaIA, produtosDaAPI } = await responderComIA(texto, historico);

    // LÓGICA DE FOTO: Verifica se o George mencionou um produto que existe na API
    const produtoMencionado = produtosDaAPI.find(p => 
      respostaIA.toLowerCase().includes(p.nome.toLowerCase())
    );

    if (produtoMencionado && produtoMencionado.imagem) {
      // Envia a imagem com a resposta da IA como legenda
      await enviarFoto(phone, produtoMencionado.imagem, respostaIA);
    } else {
      // Envia apenas o texto
      await enviarMensagem(phone, respostaIA);
    }

    // Atualiza Memória
    historico.push({ role: 'user', content: texto }, { role: 'assistant', content: respostaIA });
    memoriaMensagens.set(phone, historico.slice(-6));

  } catch (err) {
    console.error('❌ Erro Processamento:', err.message);
  }
});

app.listen(process.env.PORT || 10000, () => console.log('🟢 George Online com suporte a fotos'));
