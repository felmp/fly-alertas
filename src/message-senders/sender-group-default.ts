import { wpp } from '../axios';

export function sendDefaultMessage(message: string) {
  var data = JSON.stringify({
    "to_group_uuid": "WAGb20bcd1c-1bfd-447a-bc33-594a10952708", //certo
    // "to_group_uuid": "WAG2a2d7898-305f-4b21-8528-b26f36f3a342", //grupo para testes em real
    // "to_number": "+5585991694005",
    "from_number": "+5579920012363",
    "text": message
  });

  wpp.post('open/whatsapp/send-message', data)
    .then(function (response) {
    })
    .catch(function (error) {
      console.log(error);
    });;
}