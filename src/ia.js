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
        temperature: 0.4
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resposta = response.data.choices?.[0]?.message?.content;

    if (!resposta) {
      console.error('IA respondeu sem texto:', response.data);
      return 'Não consegui gerar resposta agora.';
    }

    return resposta;

  } catch (err) {
    console.error(
      '❌ ERRO REAL IA:',
      err.response?.data || err.message
    );
    return 'Erro interno no atendimento automático.';
  }
}

module.exports = { responderComIA };
