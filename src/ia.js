const OpenAI = require('openai');
const axios = require('axios');
const PROMPT_BASE = require('./prompt');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const API_URL = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';
const LINK_CATALOGO_SITE = 'https://catalogo-aluminio-jr.onrender.com/';

async function responderComIA(textoCliente, historico = []) {
  try {
    // 1. Busca produtos na sua API
    const responseAPI = await axios.get(API_URL);
    const produtosRaw = responseAPI.data;

    // 2. Prepara o catálogo em texto para a IA ler
    const catalogoTexto = produtosRaw.map(p => `- ${p.nome}: R$ ${p.preco}`).join('\n');

    const promptFinal = PROMPT_BASE
      .replace(/{{LINK_CATALOGO}}/g, LINK_CATALOGO_SITE)
      .replace(/{{CATALOGO_DADOS}}/g, catalogoTexto);

    // 3. Chamada OpenAI
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: promptFinal },
        ...historico,
        { role: 'user', content: textoCliente }
      ],
      temperature: 0
    });

    return {
      texto: response.choices[0].message.content,
      produtosDaAPI: produtosRaw // Retorna a lista para o app.js procurar a imagem
    };
  } catch (err) {
    console.error('❌ Erro no ia.js:', err.message);
    return { texto: "Posso te ajudar com produtos, preços ou o catálogo.", produtosDaAPI: [] };
  }
}

module.exports = { responderComIA };
