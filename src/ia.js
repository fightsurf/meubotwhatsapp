const OpenAI = require('openai');
const axios = require('axios');
const PROMPT_BASE = require('./prompt');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const API_URL = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';
const LINK_CATALOGO_SITE = 'https://catalogo-aluminio-jr.onrender.com/';

async function responderComIA(textoCliente, historico = []) {
  try {
    const responseAPI = await axios.get(API_URL);
    const produtosRaw = responseAPI.data;

    const catalogoTexto = produtosRaw
      .map(p => `PRODUTO: ${p.nome} | PREÇO: R$ ${p.preco.toFixed(2)}`)
      .join('\n');

    const promptFinal = PROMPT_BASE
      .replace(/{{LINK_CATALOGO}}/g, LINK_CATALOGO_SITE)
      .replace(/{{CATALOGO_DADOS}}/g, catalogoTexto);

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
      produtosDaAPI: produtosRaw
    };
  } catch (err) {
    console.error('❌ Erro ia.js:', err.message);
    return { texto: "Não tenho essa informação no momento.", produtosDaAPI: [] };
  }
}

module.exports = { responderComIA };
