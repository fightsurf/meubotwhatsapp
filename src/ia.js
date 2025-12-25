const axios = require('axios');
const path = require('path');

const PROMPT_BASE = require(path.join(__dirname, 'prompt.js'));

async function responderComIA(texto) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: 'gpt-4.1-mini',
        instructions: PROMPT_BASE,
        input: texto,
        temperature: 0.4
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resposta = response.data.output_text;

    if (!resposta) {
      console.error('Resposta vazia da IA:', response.data);
      return 'Não consegui gerar resposta agora.';
    }

    return resposta;

  } catch (err) {
    console.error(
      '❌ ERRO IA:',
      err.response?.data || err.message
    );
    return 'Erro interno no atendimento automático.';
  }
}

module.exports = { responderComIA };
