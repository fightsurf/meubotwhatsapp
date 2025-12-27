const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado (DESATIVADO)');

// ===== Z-API =====
const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN_INSTANCIA = process.env.TOKEN_INSTANCIA;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// ===== NORMALIZA TELEFONE =====
function normalizarTelefone(phone) {
  return phone
    .replace('@c.us', '')
    .replace('@lid', '')
    .replace(/\D/g, '');
}

// ===== ENVIO TEXTO =====
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

  if (!req.body.phone || !req.body.text?.message) return;

  const phone = normalizarTelefone(req.body.phone);
  const texto = req.body.text.message.trim();

  console.log('📞 Phone:', phone);
  console.log('📩 Texto:', texto);

  // =====================================================
  // 🚫 BOT DESATIVADO — NÃO CONVERSA
  // =====================================================
  await enviarMensagem(
    phone,
    'Atendimento automático temporariamente indisponível.\nUm atendente humano irá responder.'
  );

  return;
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
