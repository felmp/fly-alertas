import axios from 'axios';
import fastify from 'fastify';

const app = fastify();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.post('/webhook/group-message', (request, res) => {
  const payload = request.body;

  var data = JSON.stringify({
    "to_number": "+5584986211496",
    "from_number": "+5585991694005",
    "text": JSON.stringify(payload)
  });

  var config = {
    method: 'post',
    url: 'https://api.p.2chat.io/open/whatsapp/send-message',
    headers: { 
      'X-User-API-Key': 'UAK87599222-57bf-48c6-aa90-032e2001f488', 
      'Content-Type': 'application/json'
    },
    data : data
  };

  axios(config)
  .then(function (response) {
    res.send(JSON.stringify(response.data))
  })
  .catch(function (error) {
    console.log(error);
  });

})

app.listen({
  host: '0.0.0.0',
  port
}).then(() => {
  console.log("Running at port "+ port)
})