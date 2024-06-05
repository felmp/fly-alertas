import axios from 'axios';
import { FastifyReply } from 'fastify';

export function sendDefaultMessage(message: string, res: FastifyReply) {
  var data = JSON.stringify({
    "to_group_uuid": "WAGb20bcd1c-1bfd-447a-bc33-594a10952708", //certo
    "from_number": "+5579920012363",
    "text": message
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