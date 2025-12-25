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

    // ✅ EXTRAÇÃO CORRETA E ROBUSTA
    const output =
      response.data.output_text ||
      response.data.output?.[0]?.content?.[0]?.text;

    if (!output) {
      console.error('❌ IA respondeu sem texto:', response.data);
      return 'Não consegui gerar resposta agora.';
    }

    return output;

  } catch (err) {
    console.error(
      '❌ ERRO REAL DA IA:',
      err.response?.data || err.message
    );
    return 'Erro interno no atendimento automático.';
  }
}

module.exports = { responderComIA };
