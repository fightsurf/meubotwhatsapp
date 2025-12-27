const axios = require('axios');

async function responderComIA(texto) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um atendente educado.'
          },
          {
            role: 'user',
            content: texto
          }
        ],
        temperature: 0.3
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
    console.error('❌ ERRO IA BRUTO:', err.response?.data || err.message);
    return 'Erro na IA';
  }
}

module.exports = { responderComIA };
