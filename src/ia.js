const axios = require('axios');
const PROMPT_BASE = require('./prompt');
const { OPENAI_API_KEY } = require('./config');

async function chamarIA(texto) {
  const resp = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPT_BASE },
        { role: 'user', content: texto }
      ],
      temperature: 0.4
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return resp.data.choices[0].message.content;
}

module.exports = chamarIA;
