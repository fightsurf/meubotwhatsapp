const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ===== CONFIGURAÇÕES =====
const INSTANCE_ID = '3EC3247648EB722CD4655A8D44CAB450';

// Token da INSTÂNCIA (fica na URL)
const TOKEN_INSTANCIA = 'B605033F5F640093BC9FD637';

// Token de SEGURANÇA DA CONTA (Client-Token)
const CLIENT_TOKEN = 'Fa24360be57dd4b9d89e172e66818ca5aS';

// =========================

app.post('/webhook', (req, res) => {
  console.log('🔥 WEBHOOK CHAMADO');
  console.log(JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone;
  const mensagem = req.body.text?.message;

  // responde o webhook imediatamente
  res.sendStatus(200);

  if (!telefone || !mensagem) {
    console.log('❌ Telefone ou mensagem ausente');
    return;
  }

  // envio fora do ciclo do webhook
  setTimeout(async () => {
    try {
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN_INSTANCIA}/send-text`,
        {
          phone: telefone,
          message: 'Bot Alumínio JR ativo ✅'
        },
        {
          headers: {
            'Client-Token': CLIENT_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Mensagem enviada com sucesso');
    } catch (err) {
      console.error(
        '❌ ERRO AO ENVIAR:',
        err.response?.data || err.message
      );
    }
  }, 1000);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});
