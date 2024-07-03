import { engine_v1, gpt } from '../../axios';
import { sendDefaultMessage } from '../../message-senders/sender-group-default';
import { sendMoneyMessage } from '../../message-senders/sender-group-money';
import { Alert } from '../../models/alert.model';
import prismaClient from '../../prisma';
import { AlertService } from '../../services/alert.service';
import { formatDate } from '../../util/format-date';
import { randomDate } from '../../util/random-date';


const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

class engineV1 {
  interval: any;
  is_running: boolean;

  constructor() {
    this.is_running = false;
    this.interval = null;
  }

  async processQueueSeatsAero() {
    const alerts = await prismaClient.alerts.findMany({
      where: { sent: 'test' },
      orderBy: { created_at: 'asc' },
      take: 1
    });

    for (const alert of alerts) {
      console.log(`Enviando alert ID: ${alert.id} - seatsAero`);

      const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${alert.miles?.trim()} milhas ida e volta + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}
_Não tem milhas ? Nós te ajudamos com essa emissão !_

_SEATS AERO_
`;


      sendMoneyMessage(formattedText)


      await prismaClient.alerts.update({
        where: { id: alert.id },
        data: {
          sent: 'sent',
          sent_date: new Date()
        }
      });
    }
  }


  async processQueue() {
    const alerts = await prismaClient.alerts.findMany({
      where: { sent: 'waiting' },
      orderBy: { created_at: 'asc' },
      take: 1
    });

    for (const alert of alerts) {
      console.log(`Enviando alert ID: ${alert.id}`);

      const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${alert.miles?.trim()} milhas ida e volta + taxas
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
💰 A partir de ${formatter.format(Number(alert.amount))} ida e volta + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}
_Não tem milhas ? Nós te ajudamos com essa emissão !_`;

        sendMoneyMessage(formattedText)

      }, 4000);

      console.log('cheguei aqui')

      await prismaClient.alerts.update({
        where: { id: alert.id },
        data: {
          sent: 'sent',
          sent_date: new Date()
        }
      });
    }
  }

  start() {
    if (!this.is_running) {
      this.is_running = true;
      this.interval = setInterval(() => this.processQueue(), 5000);
      setInterval(() => this.processQueueSeatsAero(), 900000);
      setInterval(() => this.getNorthAmericaDestination(), 40000);
      console.log('Fila de alertas iniciada.');
    }
  }

  stop() {
    if (this.is_running) {
      clearInterval(this.interval);
      this.is_running = false;
      console.log('Fila de alertas parada.');
    }
  }

  async getNorthAmericaDestination() {
    const origins_airports = ['FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'];
    const continents = ['North+America', 'Europe', 'Asia'];
    const sources = ['smiles', 'united', 'azul'];
    console.log('SeatsAero rodando')
    let take = 10; // Quantidade de resultados por página
    let skip = 0; // Quantidade de resultados a pular inicialmente

    let start_date = new Date();
    let end_date = new Date(start_date);
    end_date.setFullYear(start_date.getFullYear() + 1);
    start_date = randomDate(start_date, end_date);
    end_date = randomDate(start_date, end_date);

    // Garantir que a data de saída não seja maior que a data de entrada
    if (end_date.getTime() > end_date.getTime()) {
      const tempDate = start_date;
      start_date = end_date;
      end_date = tempDate;
    }

    const source = sources[Math.floor(Math.random() * sources.length)];
    const destination = continents[Math.floor(Math.random() * continents.length)];


    try {
      const response = await engine_v1.get(`/availability?source=${source}&start_date=${formatDate(start_date)}&end_date=${formatDate(end_date)}&origin_region=South+America&destination_region=${destination}&take=${take}&skip=${skip}`);

      const availability = response.data;


      if (availability.data.length === 0) {
        console.log('No more data available. Restarting...');
        skip = 0;
      }

      for (let i = 0; i < availability.data.length; i++) {
        const e = availability.data[i];
        if (origins_airports.includes(e.Route.OriginAirport)) {
          const data_gpt = {
            "model": "gpt-3.5-turbo",
            "messages": [
              {
                "role": "system",
                "content": "Você é um analista de passagens aereas, " +
                  "vou lhe mandar um objeto você vai analisar e vai retornar pra mim um " +
                  "JSON que contenha os dados que mandei pra você organizado. o json é" +
                  "affiliates_program: voce vai identificar o programa de afiliados no json que enviar e colocar nesse campo em caixa alta " +
                  "trip: aqui voce vai colocar de onde será a origem e de onde será o destino, coloque o nome das cidades por extenso no formato (origem para destino) " +
                  "route: coloque a rota dos continentes Exemplo: América do Sul para América do Norte" +
                  "miles: identifique o menor custo de milhas e coloque nesse campo pontuação de numero, e como um texto" +
                  "type_trip: com base nas milhas identifique em qual classe está o voo se é economica/executiva/primeira classe e coloque nesse campo" +
                  "airlines: identifique a companhia aerea e coloque nesse campo, remaining: data de embarque em formato brasil DD/MM/YYYY, sent: 'test' } "
              },
              {
                "role": "user",
                "content": JSON.stringify(e)
              }
            ]
          };

          const message = await gpt.post('chat/completions', data_gpt);

          let json = JSON.parse(message.data.choices[0].message.content) as Alert;
          json.miles = json.miles?.toString() as any
          const saved = new AlertService().createAlert(json)
        }
      }

      if (availability.hasMore) {
        skip += take; // Atualiza o offset para a próxima página
      } else {
        console.log('No more pages available for current selection. Restarting...');
        skip = 0; // Reiniciar o skip para buscar desde o início na próxima iteração
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }


}

export default engineV1