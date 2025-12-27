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
            content: `
${PROMPT_BASE}

REGRAS IMPORTANTES (OBRIGATÓRIO):
- Responda SEMPRE em JSON válido
- Nunca escreva texto fora do JSON
- Escolha UMA ação abaixo

AÇÕES POSSÍVEIS:
1) responder
{
  "acao": "responder",
  "mensagem": "texto curto para o cliente"
}

2) buscar_produto
{
  "acao": "buscar_produto",
  "termo": "palavra chave do produto",
  "limite": 3
}

3) catalogo
{
  "acao": "catalogo"
}

4) ignorar
{
  "acao": "ignorar"
}

EXEMPLOS:
Cliente: "cafeteira"
Resposta:
{
  "acao": "buscar_produto",
  "termo": "cafeteira",
  "limite": 3
}

Cliente: "me manda o catálogo"
Resposta:
{
  "acao": "catalogo"
}
`
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

    const conteudo = response.data.choices?.[0]?.message?.content;

    if (!conteudo) {
      return { acao: 'responder', mensagem: 'Não consegui responder agora.' };
    }

    // ⚠️ GARANTE JSON
    try {
      return JSON.parse(conteudo);
    } catch (e) {
      console.error('❌ IA não retornou JSON:', conteudo);
      return {
        acao: 'responder',
        mensagem: 'Erro ao interpretar resposta. Tente novamente.'
      };
    }

  } catch (err) {
    console.error(
      '❌ ERRO IA:',
      err.response?.data || err.message
    );

    return {
      acao: 'responder',
      mensagem: 'Erro interno no atendimento automático.'
    };
  }
}

module.exports = { responderComIA };
