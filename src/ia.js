const axios = require('axios');
const PROMPT_BASE = require('./prompt');

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
        temperature: 0
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (err) {
    console.error('❌ ERRO IA:', err.response?.data || err.message);
    return 'Erro no atendimento automático.';
  }
}

module.exports = { responderComIA };
