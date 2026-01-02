const OpenAI = require('openai');
const axios = require('axios');
const PROMPT_BASE = require('./prompt');

// Configuração do cliente OpenAI
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// URLs de referência do seu ecossistema
const API_URL = 'https://catalogo-aluminio-jr.onrender.com/api/produtos';
const LINK_CATALOGO_SITE = 'https://catalogo-aluminio-jr.onrender.com/';

/**
 * Função principal que processa a conversa com a IA
 * @param {string} textoCliente - Mensagem recebida via WhatsApp
 * @param {Array} historico - Contexto das últimas mensagens
 */
async function responderComIA(textoCliente, historico = []) {
  try {
    // 1. Busca os produtos em tempo real na sua API
    const responseAPI = await axios.get(API_URL);
    const produtosRaw = responseAPI.data;

    // 2. Formata a lista de produtos para que a IA saiba o que existe no estoque
    const catalogoTexto = produtosRaw
      .map(p => `PRODUTO: ${p.nome} | PREÇO: R$ ${p.preco.toFixed(2)}`)
      .join('\n');

    // 3. Prepara o prompt injetando o link do catálogo e os dados da API
    const promptFinal = PROMPT_BASE
      .replace(/{{LINK_CATALOGO}}/g, LINK_CATALOGO_SITE)
      .replace(/{{CATALOGO_DADOS}}/g, catalogoTexto);

    // 4. Solicita a resposta ao modelo GPT
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: promptFinal },
        ...historico,
        { role: 'user', content: textoCliente }
      ],
      temperature: 0 // Mantém a resposta precisa e técnica
    });

    // Retorna o texto gerado e a lista bruta de produtos para o app.js processar as fotos
    return {
      texto: response.choices[0].message.content,
      produtosDaAPI: produtosRaw
    };
  } catch (err) {
    console.error('❌ Erro na camada de IA (ia.js):', err.message);
    return { 
      texto: "Não tenho essa informação no momento. Por favor, tente novamente mais tarde.", 
      produtosDaAPI: [] 
    };
  }
}

module.exports = { responderComIA };
