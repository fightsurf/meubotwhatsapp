const OpenAI = require('openai');
const axios = require('axios'); // Necessário para buscar a API
const PROMPT_BASE = require('./prompt');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const RESPOSTA_PADRAO_FORA_ESCOPO = 'Posso te ajudar com produtos, preços ou o catálogo da Alumínio JR.';
const LINK_CATALOGO_SITE = 'https://catalogo-aluminio-jr.onrender.com';
const API_URL = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';

/**
 * Busca os produtos diretamente da API do catálogo
 */
async function buscarProdutosDaAPI() {
  try {
    const response = await axios.get(API_URL);
    const produtos = response.data;

    // Transforma o JSON da API em uma lista de texto para a IA entender
    return produtos.map(p => `- ${p.nome}: R$ ${p.preco}`).join('\n');
  } catch (err) {
    console.error('❌ Erro ao buscar API de produtos:', err.message);
    return 'Erro ao carregar preços. Por favor, consulte o catálogo.';
  }
}

async function responderComIA(textoCliente, historico = []) {
  try {
    // 1. Busca os dados atualizados da API antes de responder
    const catalogoAtualizado = await buscarProdutosDaAPI();

    // 2. Injeta os dados dinâmicos no Prompt
    const promptFinal = PROMPT_BASE
      .replace('{{LINK_CATALOGO}}', LINK_CATALOGO_SITE)
      .replace('{{CATALOGO_DADOS}}', catalogoAtualizado);

    // 3. Chamada para a OpenAI
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: promptFinal },
        ...historico,
        { role: 'user', content: textoCliente }
      ],
      temperature: 0,
      max_tokens: 150
    });

    const resposta = response.choices[0]?.message?.content;
    return resposta ? resposta.trim() : RESPOSTA_PADRAO_FORA_ESCOPO;

  } catch (err) {
    console.error('❌ ERRO NO ia.js:', err.message);
    return RESPOSTA_PADRAO_FORA_ESCOPO;
  }
}

module.exports = { responderComIA };
