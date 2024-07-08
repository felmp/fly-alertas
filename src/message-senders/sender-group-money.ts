import { gpt, wpp } from '../axios';

export async function sendMoneyMessage(message: string) {
  const prompt = 'Retire completamente todo tipo de link e redirecionamento da mensagem. Não altere nada da mensagem, somente retire o que for link e observação do texto, se não houver não mexa em nada.'

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

  if (message !== 'Programa de afiliados não encontrado') {

    var data = JSON.stringify({
      "to_group_uuid": "WAG2a2d7898-305f-4b21-8528-b26f36f3a342",
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
}