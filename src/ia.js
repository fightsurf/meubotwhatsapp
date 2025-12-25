const axios = require('axios');
const path = require('path');

const config = require(path.join(__dirname, 'config.js'));

async function responderComIA(texto) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: config.PROMPT_BASE
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

  return response.data.choices[0].message.content;
}

module.exports = { responderComIA };
