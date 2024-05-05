
export function formatMessageText(text: string): string {
  const arraySplitted = text.split("\n")

  if (arraySplitted[2].includes('Internacional')) {
    const regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
    const affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1')
    const country = arraySplitted[1].replace('🌎 ', '').replace(/&amp;gt;/g, '&gt;').split('&gt;').map(item => item.trim());
    const trip = `${arraySplitted[2].replace('✈️ ', '')} - ${country[0]} > ${country[1]}`
    const route = arraySplitted[3].replace('📍 ', '')
    const miles = arraySplitted[4].replace('💰 ', '').replace('milhas trecho', 'milhas por trecho')
    const typeTrip = arraySplitted[5].replace('💺 Classe ', '')
    const flex = [
      'Opções de Reserva Flexíveis Disponíveis',
      'Reserva Fixa'
    ];
    const airlines = arraySplitted[7].replace('🛫 Voando ', '')

    let restante = "";

    for (let i = 8; i < arraySplitted.length; i++) {
      restante += `${arraySplitted[i].replace(/🗓️\s?Datas?:/g, '')}\n`;
    }

    const formattedText = `
🚀 Fly Alertas 🚀

🌍 Explore o Mundo com Facilidade 🌍

🚨 Programa de Afiliados: ${affiliatesProgram}
✈️  Rota: ${trip}
📍 De: ${route}
💰 ${miles}
💺 Viaje com Estilo: ${typeTrip}
📈 ${arraySplitted[6].includes('fixa') ? flex[1] : flex[0]}
🛫 Companhia Aérea Parceira: ${airlines}

🗓️ Alerta de Data Especial: ${restante}

🎉 Deixe Sua Jornada Começar com a Fly Alertas! 🎉

Experimente luxo, flexibilidade e arranjos de viagem sem complicações. Reserve sua próxima aventura conosco e faça cada milha valer a pena!`;
    return formattedText.trim();

  } else {
    const regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
    const affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1')
    const trip = arraySplitted[1].replace('✈️ ', '')
    const route = arraySplitted[2].replace('📍 ', '')
    const miles = arraySplitted[3].replace('💰 ', '').replace('milhas trecho', 'milhas por trecho')
    const typeTrip = arraySplitted[4].replace('💺 Classe ', '')
    const flex = [
      'Opções de Reserva Flexíveis Disponíveis',
      'Reserva Fixa'
    ];
    const typeReserve = arraySplitted[5].includes('fixa') ? flex[1] : flex[0]
    const airlines = arraySplitted[6].replace('🛫 Voando ', '')
    let restante = "";

    for (let i = 7; i < arraySplitted.length; i++) {
      restante += `${arraySplitted[i].replace(/🗓️\s?Datas?:/g, '')}\n`;
    }

    const formattedText = `
🚀 Fly Alertas 🚀

🌍 Explore o Mundo com Facilidade 🌍

✈️ Programa de Afiliados: ${affiliatesProgram}
✈️ Rota: ${trip}
📍 De: ${route}
💰 ${miles}
💺 Viaje com Estilo: ${typeTrip}
📈 ${typeReserve}
🛫 Companhia Aérea Parceira: ${airlines}

🗓️ Alerta de Data Especial: ${restante}
🎉 Deixe Sua Jornada Começar com a Fly Alertas! 🎉

Experimente luxo, flexibilidade e arranjos de viagem sem complicações. Reserve sua próxima aventura conosco e faça cada milha valer a pena!`;


    return formattedText.trim();

  }

}