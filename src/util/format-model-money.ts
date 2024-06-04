import { converter } from "./conversion";
import axios from 'axios';

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export function formatMoneyMessageText(text: string): string {
  const arraySplitted = text.split("\n")

  if (arraySplitted[2].includes('Internacional')) {
    const regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
    const affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1').replace('amp;amp;', '').trim()
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
      restante += `${arraySplitted[i].replace(/🗓️\s?Datas?:/g, '')}\n`;
    }

    const regexCatchMiles = /\d+(\.\d+)?/g;

    const onlyMiles = miles.match(regexCatchMiles);

    if (converter.filter(e => e.affiliateProgram == affiliatesProgram)[0] == undefined)
      return 'Programa de afiliados não encontrado: '+ affiliatesProgram

    var price = 0;
    if (onlyMiles !== null)
      price = converter.filter(e => e.affiliateProgram == affiliatesProgram)[0].price * parseFloat(onlyMiles[0])


    let formattedText = `
🚀 Fly Alertas 🚀

🌍 Explore o Mundo com Facilidade 🌍

🚨 Programa de Afiliados: ${affiliatesProgram.trim()}
✈️  Rota: ${trip.trim()}
📍 De: ${route.trim()}
💰 A partir de ${formatter.format(price)} + taxas ida e volta
💺 Viaje com Estilo: ${typeTrip.trim()}
📈 ${arraySplitted[6].includes('fixa') ? flex[1] : flex[0]}
🛫 Companhia Aérea Parceira: ${airlines.trim()}

🗓️  Alerta de Data Especial: ${restante}

🎉 Deixe Sua Jornada Começar com a Fly Alertas! 🎉

Experimente luxo, flexibilidade e arranjos de viagem sem complicações. Reserve sua próxima aventura conosco e faça cada milha valer a pena!`;

    return formattedText.trim();

  } else {
    const regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
    const affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1').replace('amp;amp;', '').trim()
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

    const regexCatchMiles = /\d+(\.\d+)?/g;

    const onlyMiles = miles.match(regexCatchMiles);

    if (converter.filter(e => e.affiliateProgram == affiliatesProgram)[0] == undefined)
      return 'Programa de afiliados não encontrado: '+ affiliatesProgram

    var price = 0;
    if (onlyMiles !== null)
      price = converter.filter(e => e.affiliateProgram == affiliatesProgram)[0].price * parseFloat(onlyMiles[0])

    const formattedText = `
🚀 Fly Alertas 🚀

🌍 Explore o Mundo com Facilidade 🌍

🚨 Programa de Afiliados: ${affiliatesProgram.trim()}
✈️  Rota: ${trip.trim()}
📍 De: ${route.trim()}
💰 A partir de ${formatter.format(price)} + taxas ida e volta
💺 Viaje com Estilo: ${typeTrip.trim()}
📈 ${typeReserve.trim()}
🛫 Companhia Aérea Parceira: ${airlines.trim()}

🗓️  Alerta de Data Especial: ${restante}
🎉 Deixe Sua Jornada Começar com a Fly Alertas! 🎉

Experimente luxo, flexibilidade e arranjos de viagem sem complicações. Reserve sua próxima aventura conosco e faça cada milha valer a pena!`;


    return formattedText.trim();

  }

}