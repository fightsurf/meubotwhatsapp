const express = require('express');

const app = express();
app.use(express.json());

console.log('🚀 Bot Alumínio JR iniciado (IA-FIRST PURO)');

// ===== NORMALIZA TELEFONE =====
function normalizarTelefone(phone) {
  return phone
    .replace('@c.us', '')
    .replace('@lid', '')
    .replace(/\D/g, '');
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (!req.body.phone || !req.body.text?.message) return;

  const phone = normalizarTelefone(req.body.phone);
  const texto = req.body.text.message.trim();

  console.log('📞 Phone:', phone);
  console.log('📩 Texto:', texto);

  console.log('🤖 Respostas automáticas desativadas; nenhuma mensagem será enviada.');
});

// ===== SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
