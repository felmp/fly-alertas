
export function formatMessageText(text: string): string {
  const arraySplitted = text.split("\n")

  if (arraySplitted[2].includes('Internacional')) {
    const regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
    const affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1').replace('amp;amp;', '')
    const country = arraySplitted[1].replace('🌎', '').replace('🌍', '').replace(/&amp;gt;/g, '&gt;').split('&gt;').map(item => item.trim());
    const trip = `${arraySplitted[2].replace('✈️', '')} - ${country[0]} > ${country[1]}`
    const route = arraySplitted[3].replace('📍', '').trim()
    const miles = arraySplitted[4].replace('💰', '').replace('milhas trecho', 'milhas por trecho').replace('A partir de', '').replace('💰', '')
    const typeTrip = arraySplitted[5].replace('💺Classe', '').replace('💺  Classe ', '').replace('💺', '').replace('Classe', '')
    const flex = [
      'Opções de Reserva Flexíveis Disponíveis',
      'Reserva Fixa'
    ];
    const airlines = arraySplitted[7].replace('🛫 Voando ', '').replace('🛫  Voando ', '')

    let restante = "";

    for (let i = 8; i < arraySplitted.length; i++) {
      restante += `${arraySplitted[i].replace(/🗓️ \s?Datas?:/g, '')}\n`;
    }

    const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${affiliatesProgram.trim()}
✈️  Rota: ${trip.trim()} / ${route.trim()}
💰 ${miles.trim()}
🛫 Companhia Aérea: ${airlines.trim()}
💺 Classe: ${typeTrip.trim()}

🗓️  Alerta de Data : ${restante}

_Não tem milhas ? Nós te ajudamos com essa emissão !_`;
    return formattedText.trim();

  } else {
    const regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
    const affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1').replace('amp;amp;', '')
    const trip = arraySplitted[1].replace('✈️ ', '')
    const route = arraySplitted[2].replace('📍 ', '').replace('📍', '')
    const miles = arraySplitted[3].replace('💰 ', '').replace('milhas trecho', 'milhas por trecho').replace('A partir de', '').replace('💰', '')
    const typeTrip = arraySplitted[4].replace('💺 Classe ', '').replace('💺  Classe ', '').replace('💺', '').replace('Classe', '')
    const flex = [
      'Opções de Reserva Flexíveis Disponíveis',
      'Reserva Fixa'
    ];
    const typeReserve = arraySplitted[5].includes('fixa') ? flex[1] : flex[0]
    const airlines = arraySplitted[6].replace('🛫 Voando ', '').replace('🛫  Voando ', '')
    let restante = "";

    for (let i = 7; i < arraySplitted.length; i++) {
      restante += `${arraySplitted[i].replace(/🗓️ \s?Datas?:/g, '')}\n`;
    }

    const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${affiliatesProgram.trim()}
✈️  Rota: ${trip.trim()} - ${route.trim()}
💰 ${miles.trim()} + taxas
🛫 Companhia Aérea: ${airlines.trim()}
💺 Classe: ${typeTrip.trim()}

🗓️  Alerta de Data: ${restante}
_Não tem milhas ? Nós te ajudamos com essa emissão !_`;


    return formattedText.trim();

  }

}