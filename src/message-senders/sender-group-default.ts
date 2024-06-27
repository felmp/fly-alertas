import { wpp } from '../axios';

export function sendDefaultMessage(message: string) {
  var data = JSON.stringify({
    "to_group_uuid": "WAGb20bcd1c-1bfd-447a-bc33-594a10952708", //certo
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