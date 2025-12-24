const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  console.log('🔥 WEBHOOK CHAMADO');
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const telefone = req.body.phone;
    const mensagem = req.body.text?.message;

    if (!telefone || !mensagem) {
      console.log('❌ Telefone ou mensagem ausente');
      return res.sendStatus(200);
    }

    await axios.post(
      'https://api.z-api.io/instances/3EC3247648EB722CD4655A8D44CAB450/send-text',
      {
        phone: telefone,
        message: 'Bot Alumínio JR ativo ✅'
      },
      {
        headers: {
          'client-token': 'B605033F5F640093BC9FD637', // 🔴 CORREÇÃO AQUI
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Mensagem enviada com sucesso');
    res.sendStatus(200);

  } catch (err) {
    console.error(
      '❌ ERRO AO ENVIAR:',
      err.response?.data || err.message
    );
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});
