import axios from 'axios';
import { FastifyReply } from 'fastify';
import { gpt, wpp } from '../axios';

export function sendMoneyMessage(message: string) {

  // const prompt = "Preciso que reformule um texto para uma postagem de um GRUPO DE ALERTAS DE PASSAGENS, chamado @FLYALERTAS. "
  //   + "Envie somente 1 mensagem formatada e preparada para o envio ao whatsapp "
  //   + "Ao invês de 'Experimente luxo, flexibilidade e arranjos de viagem sem complicações. Reserve sua próxima aventura conosco e faça cada milha valer a pena!' fique avontade para escrever qualquer descrição apropriada para viagem, inclua curiosidades sobre o local de destino ou coisas para se fazer nele, seja criativo."
  //   + "Altere completamente a estrutura e os emojis, sem prejudicar as informações. Envie sempre o valor, o local, a classe, o programa de afiliados e todas as informações"
  //   + "Faça com que fique entendivel e completamente legivel para meu cliente. "
  //   + "Apague qualquer link ou redirecionamento para site, ou qualquer terminologia ou termo: HTTPS HTTP http www .com .br cartões aluno live "

  if (message !== 'Programa de afiliados não encontrado') {

    var data = JSON.stringify({
      "to_group_uuid": "WAG2a2d7898-305f-4b21-8528-b26f36f3a342", //grupo para testes em real
      "from_number": "+5579920012363",
      "text": message
    });

    wpp.post('open/whatsapp/send-message', data)
      .then(function (response) {
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}