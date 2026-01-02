// ... (funções enviarMensagem e enviarFoto permanecem iguais)

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  if (req.body.fromMe || req.body.isGroup) return;

  const phone = req.body.phone.replace(/\D/g, '');
  const textoOriginal = req.body.text?.message;
  if (phone !== NUMERO_AUTORIZADO || !textoOriginal) return;

  let historico = memoriaMensagens.get(phone) || [];
  
  try {
    const { texto: respostaIA, produtosDaAPI } = await responderComIA(textoOriginal, historico);
    await enviarMensagem(phone, respostaIA);

    // Só processa fotos e fechamento se não for uma pergunta de ambiguidade
    const ehDuvida = respostaIA.includes("Qual delas você gostaria"); 
    const ehPedido = respostaIA.toUpperCase().includes("RESUMO") || respostaIA.toUpperCase().includes("TOTAL");

    if (!ehDuvida) {
      const produtosEncontrados = produtosDaAPI.filter(p => 
        respostaIA.toUpperCase().includes(p.nome.toUpperCase().trim())
      );

      if (produtosEncontrados.length > 0) {
        for (const prod of produtosEncontrados) {
          let legenda = `${prod.nome}\nPreço: R$ ${prod.preco.toFixed(2)}`;
          
          if (ehPedido) {
            const linhas = respostaIA.split('\n');
            const linhaProd = linhas.find(l => l.toUpperCase().includes(prod.nome.toUpperCase().trim()));
            if (linhaProd) {
              const detalhes = linhaProd.split(': ')[1];
              if (detalhes) legenda = `${prod.nome}\n${detalhes}`;
            }
          }
          await enviarFoto(phone, prod.foto, legenda);
        }

        if (ehPedido) {
          await enviarMensagem(phone, "Deseja adicionar mais algum item ou finalizar o pedido?");
        }
      }
    }

    historico.push({ role: 'user', content: textoOriginal }, { role: 'assistant', content: respostaIA });
    memoriaMensagens.set(phone, historico.slice(-15)); 

  } catch (err) { console.error('❌ Erro Webhook:', err.message); }
});
