import axios from 'axios';
import fastify from 'fastify';
import { GroupMessage } from './models/group-message';
import { formatMessageText } from './util/format-model';
import { formatMoneyMessageText } from './util/format-model-money';
import { sendMoneyMessage } from './message-senders/sender-group-money';
import { sendDefaultMessage } from './message-senders/sender-group-default';
import { setTimeout } from 'timers';

const app = fastify();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.post('/webhook', (request, res) => {
  const payload = request.body as GroupMessage;

  const padrao = /(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n((.*?)📈|📈)(.*?)\n🛫(.*?)\n/
  const padrao2 = /(.*?)\n(🌍|🌎)(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n/

  const resultado = padrao.test(payload.message.text) || padrao2.test(payload.message.text);

  if (resultado && payload.contact.friendly_name == 'Espelho Emissões Y1') {

    const formattedTextMoney = formatMoneyMessageText(payload.message.text)
    const formattedText = formatMessageText(payload.message.text)

    // console.log(formattedText);
    // return
    sendMoneyMessage(formattedTextMoney, res)
    setTimeout(() => {
      sendDefaultMessage(formattedText, res)
    }, 2000)
  } else if(payload.contact.friendly_name == 'Espelho Emissões Y1') {
    // console.log(resultado)
    // return
    //ENVIAR O ERRO PARA VALIDAÇÃO NO WPP
    var data = JSON.stringify({
      "to_number": "+5585991694005",
      "from_number": "+5579920012363",
      "text": JSON.stringify(payload)
    });

    var config = {
      method: 'post',
      url: 'https://api.p.2chat.io/open/whatsapp/send-message',
      headers: {
        'X-User-API-Key': 'UAK92d7aaee-adf8-4c51-a33b-8da927bb477f',
        'Content-Type': 'application/json'
      },
      data: data
    };

    axios(config)
      .then(function (response) {
      })
      .catch(function (error) {
        console.log(error);
      });
      res.send({ message: 'Erro de validação na mensagem.' })
  }

})

app.listen({
  host: '0.0.0.0',
  port
}).then(() => {
  console.log("Running at port " + port)
})