import axios from 'axios';
import fastify from 'fastify';
import { GroupMessage } from './models/group-message';
import { formatMessageText } from './util/format-model';

const app = fastify();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.post('/webhook', (request, res) => {
  const payload = request.body as GroupMessage;

  const padrao = /🌎 ([^>]+) (&amp;gt;|&gt;) ([^\n]+)\n(?:✈️ (Internacional|Nacional)\n)?📍 ([^\n]+)\n💰 A partir de (\d{1,3}(?:\.\d{3})*(?:,\d{3})*(?:\.\d{2})?) milhas/;

  if (padrao.test(payload.message.text) && payload.contact.friendly_name == 'Espelho Emissões Y1') {

    const formattedText = formatMessageText(payload.message.text)

    var data = JSON.stringify({
      // "to_group_uuid": "WAGed8f75a5-1d1d-4d13-8c1c-7ce5298632b2",
      "to_group_uuid": "WAGb20bcd1c-1bfd-447a-bc33-594a10952708", //certo
      "from_number": "+5579920012363",
      "text": formattedText
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
        res.send(JSON.stringify(response.data))
      })
      .catch(function (error) {
        console.log(error);
      });
  } else if(payload.contact.friendly_name == 'Espelho Emissões Y1') {
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