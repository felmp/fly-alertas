import { gpt, wpp } from "../../../axios";
import { sendDefaultMessage } from "../../../message-senders/sender-group-default";
import { sendMoneyMessage } from "../../../message-senders/sender-group-money";
import prismaClient from "../../../prisma";
import { formatter } from "../../../util/money-formatter";

async function processQueue() {
  const alerts = await prismaClient.alerts.findMany({
    where: { sent: 'waiting' },
    orderBy: { created_at: 'asc' },
    take: 1
  });

  for (const alert of alerts) {
    console.log(`Enviando alert ID: ${alert.id}`);

    const arraySplitted = alert.original_message?.split("\n") as string[]

    let miles = '';
    if (arraySplitted[2].includes('Internacional')) {
      miles = arraySplitted[4].replace('💰', '').replace('💰', '')
    } else {
      miles = arraySplitted[3].replace('💰 ', '').replace('💰', '')
    }

    const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 ${miles} + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}

${alert.link != null ? 'LINK : ' + alert.link : ''}

_Não tem milhas ? Nós te ajudamos com essa emissão !_`;

    console.log(formattedText)

    sendDefaultMessage(formattedText)

    setTimeout(() => {
      const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${formatter.format(Number(alert.amount))} trecho + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}

${alert.link != null ? 'LINK : ' + alert.link : ''}

_Não tem milhas ? Nós te ajudamos com essa emissão !_`;

      sendMoneyMessage(formattedText)

    }, 4000);

    //     /// PRIVADO DO CARA TESTE BR
    //     setTimeout(async () => {
    //       if ((alert.type_trip?.includes('EXECUTIVA') || alert.type_trip?.includes('Executiva'))) {
    //         const formattedText = `
    // ⚠️ *OPORTUNIDADE @FLYALERTAS*

    // 🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
    // ✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
    // 💰 ${miles} + taxas
    // 🛫 Companhia Aérea: ${alert.airlines?.trim()}
    // 💺 Classe: ${alert.type_trip?.trim()}
    // 🗓️  Alerta de Data : ${alert.remaining}

    // _Não tem milhas ? Nós te ajudamos com essa emissão !_`;

    //         const prompt = 'Retire completamente todo tipo de link e redirecionamento da mensagem.' +
    //           'Não altere nada da mensagem, somente retire o que for link e observação do texto, se não houver não mexa em nada, retorne do jeito que foi enviado.' +
    //           'Não tire nenhum emoji'

    //         const data_gpt = {
    //           "model": "gpt-3.5-turbo",
    //           "messages": [
    //             {
    //               "role": "system",
    //               "content": prompt
    //             },
    //             {
    //               "role": "user",
    //               "content": formattedText
    //             }
    //           ]
    //         };

    //         const messageGPT = await gpt.post('chat/completions', data_gpt);

    //         var data = JSON.stringify({
    //           // "to_group_uuid": group_id,
    //           "to_number": "+19713406030",
    //           "from_number": "+5579920012363",
    //           "text": messageGPT.data.choices[0].message.content
    //         });

    //         wpp.post('open/whatsapp/send-message', data)
    //           .then(function (response) {
    //           })
    //           .catch(function (error) {
    //             console.log(error);
    //           });
    //       }
    //     }, 4000);


    await prismaClient.alerts.update({
      where: { id: alert.id },
      data: {
        sent: 'sent',
        sent_date: new Date()
      }
    });
  }
}

async function processQueueSeatsAero() {
  const alerts = await prismaClient.alerts.findMany({
    where: {
      sent: 'brasil_group'
    },
    orderBy: { created_at: 'asc' },
    take: 1
  });

  for (const alert of alerts) {
    console.log(`Enviando alert ID: ${alert.id} - seatsAero (GRUPO BRASIL)`);

    const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${alert.miles?.trim()} trecho + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}

_Não tem milhas ? Nós te ajudamos com essa emissão !_`;

    sendDefaultMessage(formattedText)

    setTimeout(() => {
      const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${formatter.format(Number(alert.amount))} trecho + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}

_Não tem milhas ? Nós te ajudamos com essa emissão !_`;

      sendMoneyMessage(formattedText)

    }, 4000);

    await prismaClient.alerts.update({
      where: { id: alert.id },
      data: {
        sent: 'brasil_group_sent',
        sent_date: new Date()
      }
    });
  }
}

async function processQueueSeatsAeroChile() {
  const alerts = await prismaClient.alerts.findMany({
    where: {
      AND: [
        { sent: 'chile_group' },
      ]
    },
    orderBy: { created_at: 'asc' },
    take: 1
  });

  for (const alert of alerts) {
    console.log(`Enviando alert ID: ${alert.id} - seatsAero (CHILE)`);

    const formattedText = `
⚠️ *OPORTUNIDAD @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Ruta: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 Desde ${alert.miles?.trim()} tramo + tasas
🛫 Aerolínea: ${alert.airlines?.trim()}
💺 Clase: ${alert.type_trip?.trim()}
🗓️  Alerta de Fecha: ${alert.remaining}

_¿No tienes millas? ¡Te ayudamos con esa emisión!_
`;

    sendDefaultMessage(formattedText, 'WAG631c5f1e-b6c2-418a-814e-96d4310a092c')

    await prismaClient.alerts.update({
      where: { id: alert.id },
      data: {
        sent: 'chile_group_sent',
        sent_date: new Date()
      }
    });
  }
}

export default { processQueue, processQueueSeatsAero, processQueueSeatsAeroChile }