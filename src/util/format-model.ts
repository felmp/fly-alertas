import { AlertService } from "../services/alert.service";
import { converter } from "./conversion";

export async function formatMessageText(text: string): Promise<string | undefined> {
  const original_message = text;
  const arraySplitted = text.split("\n")

  let regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
  let affiliatesProgram = '';
  let country = [];
  let trip = '';
  let route = '';
  let miles = '';
  let typeTrip = '';
  let airlines = '';
  let remaining = "";

  if (arraySplitted[2].includes('Internacional')) {
    affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1').replace('amp;amp;', '').trim()
    country = arraySplitted[1].replace('🌎', '').replace('🌍', '').replace(/&amp;gt;/g, '&gt;').replace('>', '&gt;').split('&gt;').map(item => item.trim());
    trip = `${arraySplitted[2].replace('✈️', '')} - ${country[0]} > ${country[1]}`
    route = arraySplitted[3].replace('📍', '').trim()
    miles = arraySplitted[4].replace('💰', '').replace('milhas trecho', 'milhas por trecho').replace('A partir de', '').replace('💰', '')
    typeTrip = arraySplitted[5].replace('💺Classe', '').replace('💺  Classe ', '').replace('💺', '').replace('Classe', '')
    airlines = arraySplitted[7].replace('🛫 Voando ', '').replace('🛫  Voando ', '')

    for (let i = 8; i < arraySplitted.length; i++) {
      remaining += `${arraySplitted[i].replace(/🗓️ \s?Datas?:/g, '')}\n`;
    }
  } else {
    affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1').replace('amp;amp;', '').trim()
    trip = arraySplitted[1].replace('✈️ ', '')
    route = arraySplitted[2].replace('📍 ', '').replace('📍', '')
    miles = arraySplitted[3].replace('💰 ', '').replace('milhas trecho', 'milhas por trecho').replace('A partir de', '').replace('💰', '')
    typeTrip = arraySplitted[4].replace('💺 Classe ', '').replace('💺  Classe ', '').replace('💺', '').replace('Classe', '')
    airlines = arraySplitted[6].replace('🛫 Voando ', '').replace('🛫  Voando ', '')

    for (let i = 7; i < arraySplitted.length; i++) {
      remaining += `${arraySplitted[i].replace(/🗓️ \s?Datas?:/g, '')}\n`;
    }
  }


  const regexCatchMiles = /\d+(\.\d+)?/g;

  const onlyMiles = miles.match(regexCatchMiles);

  if (converter.filter(e => e.affiliateProgram == affiliatesProgram)[0] == undefined)
    return 'Programa de afiliados não encontrado: ' + affiliatesProgram

  console.log(miles)


  var price = 0;
  if (onlyMiles !== null) {
    price = converter.filter(e => e.affiliateProgram == affiliatesProgram)[0].price * parseFloat(onlyMiles[0])
  


    const save = new AlertService().createAlert({
      affiliates_program: affiliatesProgram,
      trip,
      route,
      miles: onlyMiles[0],
      type_trip: typeTrip,
      airlines,
      remaining,
      sent: 'waiting',
      original_message,
      amount: price.toString()
    })

    const saved = await save as unknown as string

    return saved;
  }
}