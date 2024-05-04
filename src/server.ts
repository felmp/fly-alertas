import axios from 'axios';
import fastify from 'fastify';
import { GroupMessage } from './models/group-message';
import { formatMessageText } from './util/format-model';

const app = fastify();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.post('/webhook', (request, res) => {
  const payload = request.body as GroupMessage;

  const padrao = /🌎 ([^>]+) &amp;gt; ([^>]+)\n(?:✈️ (Internacional|Nacional)\n)?📍 ([^]+)\n💰 A partir de (\d{1,3}(?:\.\d{3})*(?:,\d{2})?) milhas trecho/;

  if (padrao.test(payload.message.text)) {

    const formattedText = formatMessageText(payload.message.text)

    var data = JSON.stringify({
      "to_number": "+5585991694005",
      "from_number": "+558499271649",
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
  }

})

app.listen({
  host: '0.0.0.0',
  port
}).then(() => {
  console.log("Running at port " + port)
})