const axios = require('axios');
const path = require('path');

const PROMPT_BASE = require(path.join(__dirname, 'prompt.js'));

async function responderComIA(texto) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: PROMPT_BASE
          },
          {
            role: 'user',
            content: texto
          }
        ],
        temperature: 0,
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resposta = response.data.choices?.[0]?.message?.content;

    return resposta || 'Posso te ajudar com produtos, preços ou catálogo.';

  } catch (err) {
    console.error(
      '❌ ERRO IA:',
      err.response?.data || err.message
    );
    return 'Posso te ajudar com produtos, preços ou catálogo.';
  }
}

module.exports = { responderComIA };
