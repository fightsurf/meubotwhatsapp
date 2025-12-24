const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;

    const telefone = data.phone;        // número do cliente
    const mensagem = data.text?.message; // texto recebido

    if (!telefone || !mensagem) {
      return res.sendStatus(200);
    }

    // RESPOSTA AUTOMÁTICA
    await axios.post(
      'https://api.z-api.io/instances/3EC3247648EB722CD4655A8D44CAB450/token/B605033F5F640093BC9FD637/send-text',
      {
        phone: telefone,
        message: 'Bot Alumínio JR ativo ✅'
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Servidor rodando');
});
