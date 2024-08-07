import { gpt, wpp } from '../axios';

export async function sendDefaultMessage(message: string, group_id: string = 'WAGb20bcd1c-1bfd-447a-bc33-594a10952708') {
  const prompt = 'Retire completamente todo tipo de link e redirecionamento da mensagem.' +
    'Não altere nada da mensagem, somente retire o que for link e observação do texto, se não houver não mexa em nada, retorne do jeito que foi enviado.' +
    'Não tire nenhum emoji'

  const data_gpt = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "system",
        "content": prompt
      },
      {
        "role": "user",
        "content": message
      }
    ]
  };

  const messageGPT = await gpt.post('chat/completions', data_gpt);
  
  var data = JSON.stringify({
    "to_group_uuid": group_id,
    "from_number": "+5579920012363",
    "text": messageGPT.data.choices[0].message.content
  });

  wpp.post('open/whatsapp/send-message', data)
    .then(function (response) {
    })
    .catch(function (error) {
      console.log(error);
    });
}