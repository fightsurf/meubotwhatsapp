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
    // 1. Busca os produtos reais na sua API
    const responseAPI = await axios.get(API_URL);
    const produtosRaw = responseAPI.data;

    // 2. Formata a lista de produtos para a IA conhecer nomes e preços
    const catalogoTexto = produtosRaw
      .map(p => `- ${p.nome}: R$ ${p.preco.toFixed(2)}`)
      .join('\n');

    // 3. Monta o prompt com os dados dinâmicos
    const promptFinal = PROMPT_BASE
      .replace(/{{LINK_CATALOGO}}/g, LINK_CATALOGO_SITE)
      .replace(/{{CATALOGO_DADOS}}/g, catalogoTexto);

    // 4. Consulta a OpenAI
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
      produtosDaAPI: produtosRaw // Retorna o JSON para o app.js buscar a .foto
    };
  } catch (err) {
    console.error('❌ Erro no ia.js:', err.message);
    return { 
      texto: "Posso te ajudar com produtos, preços ou o catálogo da Alumínio JR.", 
      produtosDaAPI: [] 
    };
  }
}

module.exports = { responderComIA };
