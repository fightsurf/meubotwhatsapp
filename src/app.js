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

async function enviarFoto(phone, image, caption) {
  try {
    await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-image`, 
      { phone, image, caption }, { headers: { 'Client-Token': CLIENT_TOKEN } });
  } catch (err) { console.error('❌ Erro Imagem:', err.message); }
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  if (req.body.fromMe || req.body.isGroup) return;

  const phone = req.body.phone.replace(/\D/g, '');
  const textoOriginal = req.body.text?.message;
  if (phone !== NUMERO_AUTORIZADO || !textoOriginal) return;

  let historico = memoriaMensagens.get(phone) || [];
  
  try {
    const { texto: respostaIA, produtosDaAPI } = await responderComIA(textoOriginal, historico);

    await enviarMensagem(phone, respostaIA);

    // Busca e envia fotos apenas se a IA citou produtos específicos no texto
    const produtosEncontrados = produtosDaAPI.filter(p => 
      respostaIA.toUpperCase().includes(p.nome.toUpperCase().trim())
    );

    if (produtosEncontrados.length > 0) {
      for (const prod of produtosEncontrados) {
        const legenda = `${prod.nome}\nPreço: R$ ${prod.preco.toFixed(2)}`;
        await enviarFoto(phone, prod.foto, legenda);
      }
    }

    historico.push({ role: 'user', content: textoOriginal }, { role: 'assistant', content: respostaIA });
    memoriaMensagens.set(phone, historico.slice(-6));

  } catch (err) { console.error('❌ Erro Webhook:', err.message); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🟢 George Online - Saudação e Catálogo Alinhados`));
