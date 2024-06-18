import { AlertService } from "../services/alert.service";
import { converter } from "./conversion";

export async function formatMessageText(text: string, id_payload: string): Promise<string | undefined> {
  const arraySplitted = text.split("\n")

  if (arraySplitted[2].includes('Internacional')) {
    const regexAffiliates = /(?:🚨)(.*?)(?:🚨)/g;
    const affiliatesProgram = arraySplitted[0].replace(regexAffiliates, '$1').replace('amp;amp;', '')
    const country = arraySplitted[1].replace('🌎', '').replace('🌍', '').replace(/&amp;gt;/g, '&gt;').split('&gt;').map(item => item.trim());
    const trip = `${arraySplitted[2].replace('✈️', '')} - ${country[0]} > ${country[1]}`
    const route = arraySplitted[3].replace('📍', '').trim()
    const miles = arraySplitted[4].replace('💰', '').replace('milhas trecho', 'milhas por trecho').replace('A partir de', '').replace('💰', '')
    const typeTrip = arraySplitted[5].replace('💺Classe', '').replace('💺  Classe ', '').replace('💺', '').replace('Classe', '')

    const airlines = arraySplitted[7].replace('🛫 Voando ', '').replace('🛫  Voando ', '')

    let remaining = "";

    for (let i = 8; i < arraySplitted.length; i++) {
      remaining += `${arraySplitted[i].replace(/🗓️ \s?Datas?:/g, '')}\n`;
    }

    const regexCatchMiles = /\d+(\.\d+)?/g;

    const onlyMiles = miles.match(regexCatchMiles);

    if (converter.filter(e => e.affiliateProgram == affiliatesProgram)[0] == undefined)
      return 'Programa de afiliados não encontrado: ' + affiliatesProgram

    var price = 0;
    if (onlyMiles !== null)
      price = converter.filter(e => e.affiliateProgram == affiliatesProgram)[0].price * parseFloat(onlyMiles[0])


    const save = new AlertService().saveFormattedText({
      id: id_payload,
      affiliates_program: affiliatesProgram,
      trip,
      route,
      miles,
      type_trip: typeTrip,
      airlines,
      remaining,
      amount: price.toString()
    })

    const saved = await save as unknown as string

    return saved;

    //     const formattedText = `
    // ⚠️ *OPORTUNIDADE @FLYALERTAS*

    // 🚨 Programa de Afiliados: ${affiliatesProgram.trim()}
    // ✈️  Rota: ${trip.trim()} / ${route.trim()}
    // 💰 ${miles.trim()}
    // 🛫 Companhia Aérea: ${airlines.trim()}
    // 💺 Classe: ${typeTrip.trim()}

    // 🗓️  Alerta de Data : ${remaining}

    // _Não tem milhas ? Nós te ajudamos com essa emissão !_`;
    // return formattedText.trim();

  }

}