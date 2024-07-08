import { exit } from 'process';
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
  // alert: AlertService

  constructor() {
    this.is_running = false;
    this.interval = null;
    // this.alert = new AlertService();
  }

  async processQueueSeatsAero() {
    const alerts = await prismaClient.alerts.findMany({
      where: {
        AND: [
          { sent: 'test' },
          {
            NOT: {
              affiliates_program: 'UNITED'
            }
          }
        ]
      },
      orderBy: { created_at: 'asc' },
      take: 1
    });

    for (const alert of alerts) {
      console.log(`Enviando alert ID: ${alert.id} - seatsAero`);

      const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${alert.miles?.trim()} trecho + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}

_Não tem milhas ? Nós te ajudamos com essa emissão !_
`;

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
💰 A partir de ${alert.miles?.trim()} ida e volta + taxas
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
      setInterval(() => this.getSeatsAero(), 42000);
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

  async getSeatsAero() {

    const origins_airports = ['FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'];
    const continents = ['North+America', 'Europe', 'Asia'];
    const sources = ['smiles', 'american', 'azul', 'aeroplan'];
    console.log('SeatsAero rodando')
    let take = 500;
    let skip = 0;

    let start_date = new Date();
    let end_date = new Date(start_date);
    end_date.setFullYear(start_date.getFullYear() + 1);
    start_date = randomDate(start_date, end_date);
    end_date = randomDate(start_date, end_date);

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

      availability.data = availability.data.filter((seat: any) =>
        seat.WRemainingSeats > 4 ||
        seat.JRemainingSeats > 4 ||
        seat.FRemainingSeats > 4
      );

      for (let i = 0; i < availability.data.length; i++) {
        const e = availability.data[i];
        if (origins_airports.includes(e.Route.OriginAirport) && (e.WAvailable == true || e.JAvailable == true || e.FAvailable == true)) {

          const data_gpt = {
            "model": "gpt-3.5-turbo",
            "messages": [
              {
                "role": "system",
                "content": "Você é um analista de passagens aereas, você nao aceita passagens economicas, se vier economica. apenas não envie o JSON, envie a mensagem. PASSAGEM ECONOMICA " +
                  "vou lhe mandar um objeto você vai analisar e vai retornar pra mim um " +
                  "JSON que contenha os dados que mandei pra você organizado. o json é" +
                  "affiliates_program: voce vai identificar o programa de afiliados no json que enviar e colocar nesse campo em caixa alta " +
                  "trip: aqui voce vai colocar de onde será a origem e de onde será o destino, coloque o nome das cidades por extenso no formato (origem para destino) " +
                  "route: coloque a rota dos continentes Exemplo: América do Sul para América do Norte" +
                  "miles: identifique o menor custo de milhas e coloque nesse campo com pontuação duas casas decimais sem usar virgula e como texto " +
                  "type_trip: com base nas milhas mais baratas identifique em qual classe está o voo se é premium/executiva/primeira classe e coloque nesse campo" +
                  "airlines: identifique a companhia aerea e coloque nesse campo," +
                  "remaining: data de embarque em formato brasil DD/MM/YYYY," +
                  "sent: 'test'," +
                  "amount: com base no valor em milhas converta usando a tabela a baixo para a cada 1000 milhas. coloque como texto em duas casas decimais sem usar virgula.," +
                  " }" +
                  "\n " +
                  "Tabela para conversão em reais" +
                  "SMILES -> valor da milha = 21.0" +
                  "LATAM PASS -> valor da milha = 32.50" +
                  "LATAMPASS -> valor da milha = 32.50" +
                  "LATAM PASS - TABELA FIXA -> valor da milha = 32.50" +
                  "TUDO AZUL -> valor da milha = 28.00" +
                  "AADVANTAGE - AMERICAN AIRLINES -> valor da milha = 117.00" +
                  "MILES&GO - TAP -> valor da milha = 39.00" +
                  "MILES&amp;GO - TAP -> valor da milha = 39.00" +
                  "AZUL FIDELIDADE - AZUL PELO MUNDO -> valor da milha = 21.00" +
                  "AZUL FIDELIDADE -> valor da milha = 21.00" +
                  "IBERIA PLUS - IBERIA -> valor da milha = 78.00" +
                  "AEROPLAN -> valor da milha = 110.00" +
                  "CONNECT MILES -> valor da milha = 85.00"
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


          if (json.miles != null && json.miles <= '250000') {

            return new AlertService().createAlert(json)

          }

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