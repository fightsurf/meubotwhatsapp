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

    // 1. Envia a resposta da IA (Pode ser saudação, lista de opções ou resumo)
    await enviarMensagem(phone, respostaIA);

    // Identifica o contexto da resposta
    const ehDuvidaAmbiguidade = respostaIA.includes("Qual delas você gostaria");
    const ehPedidoConfirmado = respostaIA.toUpperCase().includes("RESUMO") || respostaIA.toUpperCase().includes("TOTAL");

    // 2. Só processa mídias se NÃO for uma dúvida de ambiguidade
    if (!ehDuvidaAmbiguidade) {
      const produtosEncontrados = produtosDaAPI.filter(p => 
        respostaIA.toUpperCase().includes(p.nome.toUpperCase().trim())
      );

      if (produtosEncontrados.length > 0) {
        for (const prod of produtosEncontrados) {
          // Legenda padrão para consulta: Nome + Preço
          let legenda = `${prod.nome}\nPreço: R$ ${prod.preco.toFixed(2)}`;

          // Se for pedido, extrai a linha do cálculo para a legenda
          if (ehPedidoConfirmado) {
            const linhas = respostaIA.split('\n');
            const linhaDoProduto = linhas.find(l => l.toUpperCase().includes(prod.nome.toUpperCase().trim()));
            if (linhaDoProduto) {
              const calculoDetalhado = linhaDoProduto.split(': ')[1];
              if (calculoDetalhado) legenda = `${prod.nome}\n${calculoDetalhado}`;
            }
          }
          await enviarFoto(phone, prod.foto, legenda);
        }

        // 3. Pergunta de fechamento apenas após as fotos e se for pedido
        if (ehPedidoConfirmado) {
          await enviarMensagem(phone, "Deseja adicionar mais algum item ou finalizar o pedido?");
        }
      }
    }

    historico.push({ role: 'user', content: textoOriginal }, { role: 'assistant', content: respostaIA });
    memoriaMensagens.set(phone, historico.slice(-15)); 

  } catch (err) { console.error('❌ Erro Webhook:', err.message); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🟢 George Online - Fluxo Completo com Ambiguidade e Legendas`));
