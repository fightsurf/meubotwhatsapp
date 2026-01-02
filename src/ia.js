const OpenAI = require('openai');
const PROMPT_BASE = require('./prompt');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 👉 TEXTO DE SEGURANÇA (fallback absoluto)
const RESPOSTA_PADRAO_FORA_ESCOPO =
  'Posso te ajudar com produtos, preços ou o catálogo da Alumínio JR.';

// 👉 FRASE PARA FALTA DE DADOS
const RESPOSTA_FALTA_INFO =
  'Me diga o nome exato do produto e o tamanho ou litragem.';

// 👉 LINK DO CATÁLOGO (CONTROLADO PELO BACKEND)
const LINK_CATALOGO = 'https://SEU_LINK_DE_CATALOGO_AQUI';

// 👉 DADOS DO CATÁLOGO (TEMPORÁRIO)
const CATALOGO_DADOS = [
  'Panela de Pressão 3L',
  'Panela de Pressão 4,5L',
  'Caçarola Alumínio 20',
  'Caçarola Alumínio 24',
  'Cafeteira Alumínio 1L'
];

/**
 * Função para gerar resposta usando IA
 * @param {string} textoCliente - A mensagem atual do usuário
 * @param {Array} historico - Array de mensagens anteriores vindo do app.js
 */
async function responderComIA(textoCliente, historico = []) {
  try {
    const promptFinal = PROMPT_BASE
      .replace('{{LINK_CATALOGO}}', LINK_CATALOGO)
      .replace('{{CATALOGO_DADOS}}', CATALOGO_DADOS.join(', '));

    // Montagem do Chat Completion padrão OpenAI
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Nome correto do modelo (mini e econômico)
      messages: [
        {
          role: 'system',
          content: promptFinal
        },
        ...historico, // Insere as mensagens anteriores para contexto
        {
          role: 'user',
          content: textoCliente
        }
      ],
      temperature: 0,
      max_tokens: 150 // Nome correto do parâmetro de limite de saída
    });

    const resposta = response.choices[0]?.message?.content;

    if (!resposta) {
      return RESPOSTA_PADRAO_FORA_ESCOPO;
    }

    return resposta.trim();

  } catch (err) {
    console.error('❌ ERRO OPENAI:', err.message);
    return RESPOSTA_PADRAO_FORA_ESCOPO;
  }
}

module.exports = {
  responderComIA
};
