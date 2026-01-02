require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { responderComIA } = require(path.join(__dirname, 'ia.js'));

const app = express();
app.use(express.json());

// Variáveis de Ambiente (Devem estar configuradas no Render)
const { INSTANCE_ID, TOKEN_INSTANCIA, CLIENT_TOKEN } = process.env;
const NUMERO_AUTORIZADO = '558398099164';

// Memória temporária para o contexto da conversa
const memoriaMensagens = new Map();

// --- FUNÇÕES DE ENVIO PARA Z-API ---

async function enviarMensagem(phone, message) {
  try {
    await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`, 
      { phone, message }, 
      { headers: { 'Client-Token': CLIENT_TOKEN } }
    );
  } catch (err) {
    console.error('❌ Erro ao enviar texto:', err.response?.data || err.message);
  }
}

async function enviarFoto(phone, image, caption) {
  try {
    await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-image`, 
      { phone, image, caption }, 
      { headers: { 'Client-Token': CLIENT_TOKEN } }
    );
  } catch (err) {
    console.error('❌ Erro ao enviar imagem:', err.response?.data || err.message);
  }
}

// --- WEBHOOK PRINCIPAL ---

app.post('/webhook', async (req, res) => {
  // Responde imediatamente ao Z-API para evitar retentativas
  res.sendStatus(200);

  // Ignora mensagens enviadas pelo próprio bot ou de grupos
  if (req.body.fromMe || req.body.isGroup) return;

  const phone = req.body.phone.replace(/\D/g, '');
  const textoOriginal = req.body.text?.message;

  // Validação de número e conteúdo
  if (phone !== NUMERO_AUTORIZADO || !textoOriginal) return;

  let historico = memoriaMensagens.get(phone) || [];
  
  try {
    // Chama a IA para processar a resposta e trazer os dados da API
    const { texto: respostaIA, produtosDaAPI } = await responderComIA(textoOriginal, historico);

    // LÓGICA DE MULTI-FOTOS:
    // Filtramos na API todos os produtos que o George escreveu na resposta curta
    const produtosEncontrados = produtosDaAPI.filter(p => 
      respostaIA.toUpperCase().includes(p.nome.toUpperCase())
    );

    if (produtosEncontrados.length > 0) {
      // Se a IA citou produtos, enviamos cada um individualmente com sua foto e legenda
      for (const prod of produtosEncontrados) {
        const legendaIndividual = `${prod.nome}\nPreço: R$ ${prod.preco.toFixed(2)}`;
        await enviarFoto(phone, prod.foto, legendaIndividual);
      }
    } else {
      // Se não houver produto específico (saudação, catálogo, erro), envia apenas o texto
      await enviarMensagem(phone, respostaIA);
    }

    // Atualiza o histórico de mensagens (mantém as últimas 4 para contexto)
    historico.push({ role: 'user', content: textoOriginal }, { role: 'assistant', content: respostaIA });
    memoriaMensagens.set(phone, historico.slice(-4));

  } catch (err) {
    console.error('❌ Erro no processamento do webhook:', err.message);
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor George ativo na porta ${PORT}`);
});
