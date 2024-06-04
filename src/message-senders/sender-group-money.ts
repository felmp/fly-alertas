import axios from 'axios';
import { FastifyReply } from 'fastify';

export function sendMoneyMessage(message: string, res: FastifyReply) {

  const prompt = "Preciso que reformule um texto para uma postagem de um GRUPO DE ALERTAS DE PASSAGENS, chamado @FLYALERTAS. "
    + "Envie somente 1 mensagem formatada e preparada para o envio ao whatsapp "
    + "Ao invês de 'Experimente luxo, flexibilidade e arranjos de viagem sem complicações. Reserve sua próxima aventura conosco e faça cada milha valer a pena!' fique avontade para escrever qualquer descrição apropriada para viagem, inclua curiosidades sobre o local de destino ou coisas para se fazer nele, seja criativo."
    + "Altere completamente a estrutura e os emojis, sem prejudicar as informações. Faça com que fique entendivel e completamente legivel para meu cliente. "
    + "Apague qualquer link ou redirecionamento para site, ou qualquer terminologia ou termo: HTTPS HTTP http www .com .br cartões aluno live "


  if (message !== 'Programa de afiliados não encontrado') {

    const headerGPT = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.OPEN_AI_KEY
    }

    axios.post('https://api.openai.com/v1/chat/completions', {
      'model': 'gpt-3.5-turbo',
      'messages': [
        { 'role': 'user', 'content': prompt },
        { 'role': 'user', 'content': message }
      ]
    }, {
      headers: headerGPT
    }).then((response) => {
      res.send(JSON.stringify(response.data))

      var data = JSON.stringify({
        // "to_group_uuid": "WAGed8f75a5-1d1d-4d13-8c1c-7ce5298632b2",
        // "to_group_uuid": "WAGb20bcd1c-1bfd-447a-bc33-594a10952708", //certo
        "to_group_uuid": "WAG2a2d7898-305f-4b21-8528-b26f36f3a342", //grupo para testes em real
        "from_number": "+5579920012363",
        "text": response.data.choices[0].message.content
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
    }).catch((err) => {
      console.log(err)
    })

  }
}