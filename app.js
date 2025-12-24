const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

console.log('APP ALUMÍNIO JR – PRODUÇÃO SEGURA');

// ===== CONFIG =====
const INSTANCE_ID = '3EC3247648EB722CD4655A8D44CAB450';
const TOKEN_INSTANCIA = 'B605033F5F640093BC9FD637';
const CLIENT_TOKEN = 'Fa24360be57dd4b9d89e172e66818ca5aS';
const OPENAI_API_KEY = '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';
// ==================

// ===== CONTROLE DE PRODUÇÃO =====
let ATENDIMENTO_ATIVO = false;
const SENHA_ATIVACAO = '123mudar';
// =================================

// ===== PROMPT BASE (COLE O PROMPT INTEIRO AQUI) =====
const PROMPT_BASE = `
COLE AQUI EXATAMENTE O PROMPT PROFISSIONAL DA ALUMÍNIO JR
SEM ALTERAR UMA PALAVRA
`;
// ================================================

// ===== FUNÇÃO ENVIO WHATSAPP =====
async function enviarMensagem(phone, message) {
  return axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
    { phone, message },
    {
      headers: {
        'Client-Token': CLIENT_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const phone = req.body.phone;
  const texto = req.body.text?.message;

  if (!phone || !texto) return;

  const msg = texto.trim().toLowerCase();

  // ===== ATIVAÇÃO MANUAL (SÓ VOCÊ) =====
  if (msg === SENHA_ATIVACAO) {
    ATENDIMENTO_ATIVO = true;

    console.log('🔓 ATENDIMENTO ATIVADO MANUALMENTE');

    await enviarMensagem(
      phone,
      '✅ Atendimento Alumínio JR ativado.\n\nMenu disponível e IA liberada.'
    );
    return;
  }

  // ===== SE NÃO ESTIVER ATIVO, FICA MUDO =====
  if (!ATENDIMENTO_ATIVO) {
    console.log('⛔ Mensagem ignorada (atendimento inativo)');
    return;
  }

  // ===== MENU =====
  if (msg === 'oi' || msg === 'olá' || msg === 'ola') {
    await enviarMensagem(
      phone,
      '👋 Olá! Atendimento Alumínio JR\n\n' +
      '1️⃣ Kits\n' +
      '2️⃣ Preços\n' +
      '3️⃣ Falar com humano'
    );
    return;
  }

  if (msg === '1' || msg.includes('kit')) {
    await enviarMensagem(
      phone,
      '📦 Temos kits econômicos, intermediários e premium.\nQual faixa de preço por item você procura?'
    );
    return;
  }

  if (msg === '2' || msg.includes('preço') || msg.includes('preco')) {
    await enviarMensagem(
      phone,
      '💰 Trabalhamos com preços de fábrica.\nQual produto você deseja consultar?'
    );
    return;
  }

  if (msg === '3' || msg.includes('humano')) {
    await enviarMensagem(
      phone,
      '👤 Certo, vou encaminhar para um atendente humano.'
    );
    return;
  }

  // ===== IA (SOMENTE APÓS SENHA) =====
  try {
    const respostaIA = await axios.post(
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
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resposta = respostaIA.data.choices[0].message.content;
    await enviarMensagem(phone, resposta);

  } catch (err) {
    console.error('❌ ERRO IA:', err.response?.data || err.message);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Servidor rodando — IA protegida por senha');
});
