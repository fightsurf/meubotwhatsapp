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

    const ehConsulta = respostaIA.includes("Veja abaixo as opções que encontrei");
    const ehPedidoConfirmado = respostaIA.toUpperCase().includes("RESUMO") || respostaIA.toUpperCase().includes("TOTAL");

    // Agora enviamos fotos sempre que for uma consulta de preço, sem travas por ambiguidade
    if (ehConsulta || ehPedidoConfirmado) {
      const produtosEncontrados = produtosDaAPI.filter(p => {
        const nomeProd = p.nome.toUpperCase();
        if (ehConsulta) {
            const busca = textoOriginal.toUpperCase();
            // Verifica se o nome do produto contém a palavra principal da busca (ex: "cafeteira")
            return busca.split(' ').some(palavra => palavra.length > 3 && nomeProd.includes(palavra));
        }
        return respostaIA.toUpperCase().includes(nomeProd);
      });

      if (produtosEncontrados.length > 0) {
        for (const prod of produtosEncontrados) {
          let legenda = `${prod.nome}\nPreço: R$ ${prod.preco.toFixed(2)}`;

          if (ehPedidoConfirmado) {
            const linhas = respostaIA.split('\n');
            const linhaDoProduto = linhas.find(l => l.toUpperCase().includes(prod.nome.toUpperCase().trim()));
            if (linhaDoProduto) {
              const detalhes = linhaDoProduto.split(': ')[1];
              if (detalhes) legenda = `${prod.nome}\n${detalhes}`;
            }
          }
          await enviarFoto(phone, prod.foto, legenda);
        }

        if (ehConsulta) {
          await enviarMensagem(phone, "\nVeja nossa linha completa no catálogo: https://catalogo-aluminio-jr.onrender.com/");
        } else {
          await enviarMensagem(phone, "Deseja adicionar mais algum item ou finalizar o pedido?");
        }
      }
    }

    historico.push({ role: 'user', content: textoOriginal }, { role: 'assistant', content: respostaIA });
    memoriaMensagens.set(phone, historico.slice(-15)); 

  } catch (err) { console.error('❌ Erro Webhook:', err.message); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🟢 George Online - Pesquisa de cafeteiras corrigida`));
