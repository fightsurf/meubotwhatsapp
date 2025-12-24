const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

console.log('APP COM IA HIBRIDA SUBIU');

// ===== CONFIG =====
const INSTANCE_ID = '3EC3247648EB722CD4655A8D44CAB450';
const TOKEN_INSTANCIA = 'B605033F5F640093BC9FD637';
const CLIENT_TOKEN = 'Fa24360be57dd4b9d89e172e66818ca5aS';
const OPENAI_API_KEY = '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';
// ==================

// envia mensagem no WhatsApp
async function enviarMensagem(phone, message) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
    {
      phone: phone,
      message: message
    },
    {
      headers: {
        'Client-Token': CLIENT_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

// ===== WEBHOOK =====
app.post('/webhook', (req, res) => {
  const phone = req.body.phone;
  const texto = req.body.text && req.body.text.message;

  res.sendStatus(200);

  if (!phone || !texto) return;

  const msg = texto.toLowerCase();

  // MENU
  if (msg === 'oi' || msg === 'ola' || msg === 'olá') {
    return enviarMensagem(
      phone,
      'Ola! Sou o atendimento da Aluminio JR.\n\n' +
      '1 - Kits\n' +
      '2 - Precos\n' +
      '3 - Falar com humano'
    );
  }

  if (msg.includes('1') || msg.includes('kit')) {
    return enviarMensagem(
      phone,
      'Temos kits economicos e kits completos. Qual voce procura?'
    );
  }

  if (msg.includes('2') || msg.includes('preco') || msg.includes('preço')) {
    return enviarMensagem(
      phone,
      'Nossos kits partem de 16 reais por item. Voce compra para uso ou revenda?'
    );
  }

  if (msg.includes('3') || msg.includes('humano')) {
    return enviarMensagem(
      phone,
      'Certo. Vou chamar um atendente humano.'
    );
  }

  // ===== IA =====
  setTimeout(async () => {
    try {
      const respostaIA = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Voce e um vendedor direto da empresa Aluminio JR. ' +
                'Fale apenas sobre panelas, kits e precos. ' +
                'Conduza sempre para a venda.'
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
            'Authorization': 'Bearer ' + OPENAI_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const resposta = respostaIA.data.choices[0].message.content;
      await enviarMensagem(phone, resposta);

    } catch (err) {
      console.error('ERRO IA:', err.message);
    }
  }, 800);
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Servidor rodando com IA hibrida');
});
