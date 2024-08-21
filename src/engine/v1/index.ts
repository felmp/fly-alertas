import puppeteer from 'puppeteer';
import { engine_v1, gpt, wpp } from '../../axios';
import { sendDefaultMessage } from '../../message-senders/sender-group-default';
import { sendMoneyMessage } from '../../message-senders/sender-group-money';
import { Alert } from '../../models/alert.model';
import prismaClient from '../../prisma';
import { AlertService } from '../../services/alert.service';
import { formatDate } from '../../util/format-date';
import { randomDate } from '../../util/random-date';
import moment from 'moment';
import delay from '../../util/delay';
import 'moment/locale/pt-br'
import calculateMilesToCurrency from '../../util/conversor';

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

class engineV1 {
  interval: any;
  is_running: boolean;
  count_execution: number;
  change_search: 'BR' | 'CH';

  constructor() {
    this.is_running = false;
    this.count_execution = 0;
    this.interval = null;

    this.change_search = 'BR';
  }

  async processQueueSeatsAero() {
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

_Não tem milhas ? Nós te ajudamos com essa emissão !_
`;

      sendDefaultMessage(formattedText)

      setTimeout(() => {
        const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${alert.amount} trecho + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}
_Não tem milhas ? Nós te ajudamos com essa emissão !_`;

        sendMoneyMessage(formattedText)

      }, 4000);


      /// PRIVADO DO CARA TESTE BR
      setTimeout(async () => {
        if ((alert.type_trip?.includes('EXECUTIVA') || alert.type_trip?.includes('Executiva')) && this.count_execution !== 10) {
          this.count_execution++;
          const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 A partir de ${alert.miles?.trim()} trecho + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}
_Não tem milhas ? Nós te ajudamos com essa emissão !_`;


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
                "content": formattedText
              }
            ]
          };

          const messageGPT = await gpt.post('chat/completions', data_gpt);

          var data = JSON.stringify({
            "to_number": "+19713406030",
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

  async processQueueSeatsAeroChile() {
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

Link: 

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

  async processQueueSeatsAeroChileFreeGroup() {
    console.log('RODANDO FILA GRUPO');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const countExecutiva = await prismaClient.alerts.count({
      where: {
        sent: 'chile_group_sent_free',
        type_trip: 'Executiva',
        sent_date: {
          gte: today
        }
      }
    });

    const countEconomica = await prismaClient.alerts.count({
      where: {
        sent: 'chile_group_sent_free',
        type_trip: 'Econômica',
        sent_date: {
          gte: today
        }
      }
    });

    let limitExecutiva = 30 - countExecutiva;
    let limitEconomica = 30 - countEconomica;

    if (limitExecutiva <= 0 && limitEconomica <= 0) {
      console.log('Limite diário de envios atingido para ambas as classes.');
      return;
    }

    let alerts = await prismaClient.alerts.findMany({
      where: {
        AND: [
          { sent: 'chile_group' },
          {
            OR: [
              { type_trip: 'Executiva' },
              { type_trip: 'Econômica' }
            ]
          }
        ]
      },
      orderBy: { created_at: 'asc' },
      take: 10
    });

    // Remover alertas duplicados por rota
    const uniqueAlerts = [];
    const seenRoutes = new Set();

    for (const alert of alerts) {
      const routeKey = `${alert.route}_${alert.type_trip}`;
      if (!seenRoutes.has(routeKey)) {
        seenRoutes.add(routeKey);
        uniqueAlerts.push(alert);
      } else {
        // Remove o alerta duplicado do banco de dados
        await prismaClient.alerts.delete({
          where: { id: alert.id }
        });
      }
    }

    // Enviar um alerta com base nos limites
    for (const alert of uniqueAlerts) {
      const tipoClasse = alert.type_trip;

      if ((tipoClasse === 'Executiva' && limitExecutiva > 0) ||
        (tipoClasse === 'Econômica' && limitEconomica > 0)) {

        console.log(`Enviando alert ID: ${alert.id} - seatsAero (CHILE)`);

        const formattedText = `
⚠️ *OPORTUNIDAD @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Ruta: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 Desde ${alert.amount?.trim()} CLP + tasas
🛫 Aerolínea: ${alert.airlines?.trim()}
💺 Clase: ${alert.type_trip?.trim()}
🗓️  Alerta de Fecha: ${alert.remaining}

_¿QUIERES CONSEGUIR ESTA OFERTA AHORA ANTES DE QUE TERMINE? LLAMA A NUESTRO SOPORTE EN PRIVADO TE AYUDAMOS CON LA EMISIÓN._
`;

        sendDefaultMessage(formattedText, 'WAG631c5f1e-b6c2-418a-814e-96d4310a092c');

        await prismaClient.alerts.update({
          where: { id: alert.id },
          data: {
            sent: 'chile_group_sent_free',
            sent_date: new Date()
          }
        });

        if (tipoClasse === 'Executiva') {
          limitExecutiva--;
        } else if (tipoClasse === 'Econômica') {
          limitEconomica--;
        }

        break;  // Enviar apenas 1 alerta
      }
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
_Não tem milhas ? Nós te ajudamos com essa emissão !_`;

        sendMoneyMessage(formattedText)

      }, 4000);

      /// PRIVADO DO CARA TESTE BR
      setTimeout(async () => {
        if ((alert.type_trip?.includes('EXECUTIVA') || alert.type_trip?.includes('Executiva')) && this.count_execution !== 10) {
          this.count_execution++;
          const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 ${miles} + taxas
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}
_Não tem milhas ? Nós te ajudamos com essa emissão !_`;


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
                "content": formattedText
              }
            ]
          };

          const messageGPT = await gpt.post('chat/completions', data_gpt);

          var data = JSON.stringify({
            // "to_group_uuid": group_id,
            "to_number": "+19713406030",
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

  async processQueueTK() {
    const alerts = await prismaClient.alerts.findMany({
      where: {
        sent: 'tk'
      },
      orderBy: { created_at: 'asc' },
      take: 1
    });

    for (const alert of alerts) {
      console.log(`Enviando alert ID: ${alert.id} - TK milhas`);

      const formattedText = `
⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
💰 ${alert.miles?.trim()}
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
💰 A partir de ${alert.amount} trecho + taxas
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

  start() {
    if (!this.is_running) {
      this.is_running = true;
      this.interval = setInterval(() => this.processQueue(), 5000);
      setInterval(() => this.processQueueSeatsAero(), 1800000);
      setInterval(() => this.processQueueSeatsAeroChile(), 1805000);
      setInterval(() => this.getSeatsAeroBrasil(), 10000);
      setInterval(() => this.getSeatsAeroChile(), 300000);
      // this.getTKmilhas();
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

  maintenance() {
    var data = JSON.stringify({
      "to_group_uuid": "WAG21643897-66e9-45a7-8886-7040c803db73",
      "from_number": "+5579920012363",
      "text": `NO TE PIERDAS NADA SIGUE TODAS LAS OFERTAS QUE SUELTAREMOS AQUÍ ES EXCLUSIVO Y TEMPORAL, COMPÁRTELO CON TU AMIGO QUE VIAJA, ¡LAS VACANTES AQUÍ GRATIS SON LIMITADAS!`
    });

    wpp.post('open/whatsapp/send-message', data)
      .then(function (response) {
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  async getSeatsAeroChile() {
    moment.locale('pt-br')
    this.count_execution = this.count_execution + 1;

    console.log(this.count_execution)
    const origins_airports = ['SCL'];
    const continents = ['Europe', 'South+America', 'North+America'];
    const sources = ['smiles', 'azul'];
    console.log('SeatsAero (CHILE) rodando')
    let take = 5000;
    let skip = 0;

    let start_date = new Date();
    let end_date = new Date(start_date);
    end_date.setFullYear(start_date.getFullYear() + 1);
    start_date = randomDate(start_date, end_date, 0, 24);
    end_date = randomDate(start_date, end_date, 0, 24);

    if (end_date.getTime() > end_date.getTime()) {
      const tempDate = start_date;
      start_date = end_date;
      end_date = tempDate;
    }

    const airports_to: string[] = [
      'ATL', // Hartsfield-Jackson Atlanta International Airport, Atlanta, USA
      'PEK', // Beijing Capital International Airport, Beijing, China
      'LAX', // Los Angeles International Airport, Los Angeles, USA
      'DXB', // Dubai International Airport, Dubai, UAE
      'HND', // Tokyo Haneda Airport, Tokyo, Japan
      'ORD', // O'Hare International Airport, Chicago, USA
      'LHR', // London Heathrow Airport, London, UK
      'PVG', // Shanghai Pudong International Airport, Shanghai, China
      'CDG', // Charles de Gaulle Airport, Paris, France
      'DFW', // Dallas/Fort Worth International Airport, Dallas, USA
      'GRU', // São Paulo/Guarulhos International Airport, São Paulo, Brazil
      'GIG', // Rio de Janeiro/Galeão International Airport, Rio de Janeiro, Brazil
      'BSB', // Brasília International Airport, Brasília, Brazil
      'CGH', // São Paulo/Congonhas Airport, São Paulo, Brazil
      'SDU', // Rio de Janeiro/Santos Dumont Airport, Rio de Janeiro, Brazil
      'POA', // Salgado Filho International Airport, Porto Alegre, Brazil
      'SSA', // Deputado Luís Eduardo Magalhães International Airport, Salvador, Brazil
      'REC', // Recife/Guararapes-Gilberto Freyre International Airport, Recife, Brazil
      'CWB', // Afonso Pena International Airport, Curitiba, Brazil
      'FOR', // Pinto Martins – Fortaleza International Airport, Fortaleza, Brazil
      'BEL', // Val de Cans/Júlio Cezar Ribeiro International Airport, Belém, Brazil
      'MAO', // Eduardo Gomes International Airport, Manaus, Brazil
      'CNF', // Tancredo Neves/Confins International Airport, Belo Horizonte, Brazil
      'VIX', // Eurico de Aguiar Salles Airport, Vitória, Brazil
      'NAT', // São Gonçalo do Amarante–Governador Aluízio Alves International Airport, Natal, Brazil
      'MCZ', // Zumbi dos Palmares International Airport, Maceió, Brazil
      'AJU', // Santa Maria Airport, Aracaju, Brazil
      'AMS', // Amsterdam Schiphol Airport, Amsterdam, Netherlands
      'FRA', // Frankfurt Airport, Frankfurt, Germany
      'IST', // Istanbul Airport, Istanbul, Turkey
      'SIN', // Singapore Changi Airport, Singapore, Singapore
      'ICN', // Incheon International Airport, Seoul, South Korea
      'BKK', // Suvarnabhumi Airport, Bangkok, Thailand
      'JFK', // John F. Kennedy International Airport, New York City, USA
      'HKG', // Hong Kong International Airport, Hong Kong, China
      'LIS', // Humberto Delgado Airport, Lisbon, Portugal
      'WAS', // Washington D.C. (various airports), USA
      'PAR', // Paris (various airports), France
      'SEL', // Seoul (various airports), South Korea
      'MAD', // Adolfo Suárez Madrid–Barajas Airport, Madrid, Spain
      'CHI', // Chicago (various airports), USA
      'ORL', // Orlando International Airport, Orlando, USA
      'NYC', // New York City (various airports), USA
      'MIL', // Milan (various airports), Italy
      'BUE', // Buenos Aires (various airports), Argentina
      'LON', // London (various airports), UK
      'IAH', // George Bush Intercontinental Airport, Houston, USA
      'LIM', // Jorge Chávez International Airport, Lima, Peru
    ];


    const source = sources[Math.floor(Math.random() * sources.length)];
    const destination = continents[Math.floor(Math.random() * continents.length)];

    try {
      const response = await engine_v1.get(`/availability?source=${source}&start_date=${formatDate(start_date)}&end_date=${formatDate(end_date)}&origin_region=South+America&destination_region=${destination}&take=${take}&skip=${skip}`);

      // const response = await engine_v1.post('live', {
      //   disable_filters: true,
      //   origin_airport: "SCL",
      //   departure_date: "2024-09-18",
      //   source: "azul",
      //   destination_airport: "MIA"
      // });

      type Route = {
        ID: string;
        OriginAirport: string;
        OriginRegion: string;
        DestinationAirport: string;
        DestinationRegion: string;
        NumDaysOut: number;
        Distance: number;
        Source: string;
      };

      type AvailabilityData = {
        ID: string;
        RouteID: string;
        Route: Route;
        Date: string;
        ParsedDate: string;
        YAvailable: boolean;
        WAvailable: boolean;
        JAvailable: boolean;
        FAvailable: boolean;
        YMileageCost: string;
        WMileageCost: string;
        JMileageCost: string;
        FMileageCost: string;
        YDirectMileageCost: number;
        WDirectMileageCost: number;
        JDirectMileageCost: number;
        FDirectMileageCost: number;
        YRemainingSeats: number;
        WRemainingSeats: number;
        JRemainingSeats: number;
        FRemainingSeats: number;
        YDirectRemainingSeats: number;
        WDirectRemainingSeats: number;
        JDirectRemainingSeats: number;
        FDirectRemainingSeats: number;
        YAirlines: string;
        WAirlines: string;
        JAirlines: string;
        FAirlines: string;
        YDirectAirlines: string;
        WDirectAirlines: string;
        JDirectAirlines: string;
        FDirectAirlines: string;
        YDirect: boolean;
        WDirect: boolean;
        JDirect: boolean;
        FDirect: boolean;
        Source: string;
        CreatedAt: string;
        UpdatedAt: string;
        AvailabilityTrips: null;
      };

      let availability;

      availability = response.data

      // console.log('---------------------------')


      if (availability.data.length === 0) {
        console.log('No more data available. Restarting...');
        skip = 0;
      }

      availability.data = availability.data.filter((seat: any) =>
        seat.WRemainingSeats > 4 ||
        seat.JRemainingSeats > 4 ||
        seat.FRemainingSeats > 4 ||
        seat.YRemainingSeats > 4
      );

      for (let i = 0; i < availability.data.length; i++) {
        const e = availability.data[i];

        if (origins_airports.includes(e.Route.OriginAirport) && e.Route.DestinationAirport !== 'PTY' && airports_to.includes(e.Route.DestinationAirport)) {

          let mileageCosts = {
            Y: parseInt(e.YMileageCost),
            W: parseInt(e.WMileageCost),
            J: parseInt(e.JMileageCost),
            F: parseInt(e.FMileageCost)
          };

          let filteredCosts = Object.entries(mileageCosts).filter(([key, value]) => value !== 0);
          let minCostEntry = filteredCosts.reduce((minEntry, currentEntry) => currentEntry[1] < minEntry[1] ? currentEntry : minEntry);

          function deleteRelatedKeys(type: any) {
            for (let key in e) {
              if (key.startsWith(type)) {
                delete e[key as keyof AvailabilityData];
              }
            }
          }

          for (let key in mileageCosts) {
            if (key !== minCostEntry[0]) {
              deleteRelatedKeys(key);
            }
          }

          let miles
          let type_trip;
          let airlines;

          if (e.YMileageCost !== undefined) {
            miles = e.YMileageCost
            type_trip = 'Econômica'
            airlines = e.YAirlines;
          } else if (e.WMileageCost !== undefined) {
            miles = e.WMileageCost
            type_trip = 'Premium Economy'
            airlines = e.WAirlines;
          } else if (e.JMileageCost !== undefined) {
            miles = e.JMileageCost
            type_trip = 'Executiva'
            airlines = e.JAirlines;
          } else {
            miles = e.FMileageCost
            type_trip = 'Primeira Classe'
            airlines = e.FAirlines;
          }

          const airportsCity: { [key: string]: string } = {
            'LIS': 'Lisboa',
            'WAS': 'Washington, D.C.',
            'PAR': 'Paris',
            'SEL': 'Seul',
            'MAD': 'Madri',
            'HND': 'Tóquio',
            'CHI': 'Chicago',
            'LAX': 'Los Angeles',
            'ORL': 'Orlando',
            'NYC': 'Nova York',
            'MIL': 'Milão',
            'BUE': 'Buenos Aires',
            'LON': 'Londres',
            'MIA': 'Miami',
            'IAH': 'Houston',
            'LIM': 'Lima',
            'JFK': 'Nova York',
            'GIG': 'Rio de Janeiro',
            'FOR': 'Fortaleza',
            'NAT': 'Natal',
            'SAO': 'São Paulo',
            'REC': 'Recife',
            'MCZ': 'Maceió',
            'RIO': 'Rio de Janeiro',
            'CNF': 'Belo Horizonte',
            'BSB': 'Brasília',
            'AJU': 'Aracaju',
            'GRU': 'São Paulo',
            'ATL': 'Atlanta',
            'PEK': 'Pequim',
            'DXB': 'Dubai',
            'ORD': 'Chicago',
            'LHR': 'Londres',
            'PVG': 'Xangai',
            'CDG': 'Paris',
            'DFW': 'Dallas',
            'CGH': 'São Paulo',
            'SDU': 'Rio de Janeiro',
            'POA': 'Porto Alegre',
            'SSA': 'Salvador',
            'CWB': 'Curitiba',
            'BEL': 'Belém',
            'MAO': 'Manaus',
            'VIX': 'Vitória',
            'AMS': 'Amsterdã',
            'FRA': 'Frankfurt',
            'IST': 'Istambul',
            'SIN': 'Singapura',
            'ICN': 'Incheon',
            'BKK': 'Bangkok',
            'HKG': 'Hong Kong'
          };

          const continentsTranslate: { [key: string]: string } = {
            'South America': 'América del Sur',
            'North America': 'América del Norte',
            'Europe': 'Europa',
            'Asia': 'Asia',
            'Africa': 'África',
            'Oceania': 'Oceanía'
          };

          let json: Alert = {
            miles,
            id: '',
            original_message: null,
            affiliates_program: e.Route.Source.toLocaleUpperCase(),
            trip: 'Santiago a ' + airportsCity[e.Route.DestinationAirport],
            route: continentsTranslate[e.Route.OriginRegion] + ' a ' + continentsTranslate[e.Route.DestinationRegion],
            amount: calculateMilesToCurrency(e.Source, Number(miles), 'CLP'),
            type_trip,
            airlines,
            remaining: moment(e.Date).format('L'),
            sent: 'chile_group',
            sent_date: null,
            created_at: null,
            link: null
          };

          if (type_trip == 'Econômica' && Number(json.miles) <= 85000 && !json.airlines?.includes('Sky Airline Chile')) {
            console.log('SAVED SeatsAero')
            console.log(json)
            return new AlertService().createAlert(json)
          }

          if (type_trip == 'Executiva' && Number(json.miles) <= 140000 && !json.airlines?.includes('Sky Airline Chile')) {
            console.log('SAVED SeatsAero')
            console.log(json)
            return new AlertService().createAlert(json)
          }

          if (json.miles != null && source == 'azul' && !json.airlines?.includes('Sky Airline Chile')) {
            console.log('SAVED SeatsAero')
            console.log(json)
            return new AlertService().createAlert(json)
          }
        }
      }
      if (availability.hasMore) {
        skip += take;
      } else {
        console.log('No more pages available for current selection. Restarting...');
        skip = 0;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async getSeatsAeroBrasil() {
    moment.locale('pt-br')
    this.count_execution = this.count_execution + 1;

    console.log(this.count_execution)
    const origins_airports = ['FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'];
    const continents = ['North+America', 'Europe', 'Asia', 'Africa', 'South+America', 'Oceania'];
    const sources = ['smiles', 'azul'];
    console.log('SeatsAero (CHILE) rodando')
    let take = 5000;
    let skip = 0;

    let start_date = new Date();
    let end_date = new Date(start_date);
    end_date.setFullYear(start_date.getFullYear() + 1);
    start_date = randomDate(start_date, end_date, 0, 24);
    end_date = randomDate(start_date, end_date, 0, 24);

    if (end_date.getTime() > end_date.getTime()) {
      const tempDate = start_date;
      start_date = end_date;
      end_date = tempDate;
    }

    const airports_to: string[] = [
      'ATL', 'PEK', 'LAX', 'DXB', 'HND', 'ORD',
      'LHR', 'PVG', 'CDG', 'DFW', 'GRU', 'GIG',
      'BSB', 'CGH', 'SDU', 'POA', 'SSA', 'REC',
      'CWB', 'FOR', 'BEL', 'MAO', 'CNF', 'VIX',
      'MCZ', 'AJU', 'AMS', 'FRA', 'IST', 'SIN',
      'ICN', 'BKK', 'JFK', 'HKG', 'NAT'];

    const source = sources[Math.floor(Math.random() * sources.length)];
    const destination = continents[Math.floor(Math.random() * continents.length)];

    try {
      const response = await engine_v1.get(`/availability?source=${source}&start_date=${formatDate(start_date)}&end_date=${formatDate(end_date)}&origin_region=South+America&destination_region=${destination}&take=${take}&skip=${skip}`);

      // const response = await engine_v1.post('live', {
      //   disable_filters: true,
      //   origin_airport: "SCL",
      //   departure_date: "2024-09-18",
      //   source: "azul",
      //   destination_airport: "MIA"
      // });

      type Route = {
        ID: string;
        OriginAirport: string;
        OriginRegion: string;
        DestinationAirport: string;
        DestinationRegion: string;
        NumDaysOut: number;
        Distance: number;
        Source: string;
      };

      type AvailabilityData = {
        ID: string;
        RouteID: string;
        Route: Route;
        Date: string;
        ParsedDate: string;
        YAvailable: boolean;
        WAvailable: boolean;
        JAvailable: boolean;
        FAvailable: boolean;
        YMileageCost: string;
        WMileageCost: string;
        JMileageCost: string;
        FMileageCost: string;
        YDirectMileageCost: number;
        WDirectMileageCost: number;
        JDirectMileageCost: number;
        FDirectMileageCost: number;
        YRemainingSeats: number;
        WRemainingSeats: number;
        JRemainingSeats: number;
        FRemainingSeats: number;
        YDirectRemainingSeats: number;
        WDirectRemainingSeats: number;
        JDirectRemainingSeats: number;
        FDirectRemainingSeats: number;
        YAirlines: string;
        WAirlines: string;
        JAirlines: string;
        FAirlines: string;
        YDirectAirlines: string;
        WDirectAirlines: string;
        JDirectAirlines: string;
        FDirectAirlines: string;
        YDirect: boolean;
        WDirect: boolean;
        JDirect: boolean;
        FDirect: boolean;
        Source: string;
        CreatedAt: string;
        UpdatedAt: string;
        AvailabilityTrips: null;
      };

      let availability;

      availability = response.data

      console.log('---------------------------')


      if (availability.data.length === 0) {
        console.log('No more data available. Restarting...');
        skip = 0;
      }

      availability.data = availability.data.filter((seat: any) =>
        seat.WRemainingSeats > 4 ||
        seat.JRemainingSeats > 4 ||
        seat.FRemainingSeats > 4 ||
        seat.YRemainingSeats > 4
      );

      for (let i = 0; i < availability.data.length; i++) {
        const e = availability.data[i];

        if (origins_airports.includes(e.Route.OriginAirport) && e.Route.DestinationAirport !== 'PTY' && airports_to.includes(e.Route.DestinationAirport)) {

          let mileageCosts = {
            Y: parseInt(e.YMileageCost),
            W: parseInt(e.WMileageCost),
            J: parseInt(e.JMileageCost),
            F: parseInt(e.FMileageCost)
          };

          let filteredCosts = Object.entries(mileageCosts).filter(([key, value]) => value !== 0);
          let minCostEntry = filteredCosts.reduce((minEntry, currentEntry) => currentEntry[1] < minEntry[1] ? currentEntry : minEntry);

          function deleteRelatedKeys(type: any) {
            for (let key in e) {
              if (key.startsWith(type)) {
                delete e[key as keyof AvailabilityData];
              }
            }
          }

          for (let key in mileageCosts) {
            if (key !== minCostEntry[0]) {
              deleteRelatedKeys(key);
            }
          }

          let miles
          let type_trip;
          let airlines;

          if (e.YMileageCost !== undefined) {
            miles = e.YMileageCost
            type_trip = 'Econômica'
            airlines = e.YAirlines;
          } else if (e.WMileageCost !== undefined) {
            miles = e.WMileageCost
            type_trip = 'Premium Economy'
            airlines = e.WAirlines;
          } else if (e.JMileageCost !== undefined) {
            miles = e.JMileageCost
            type_trip = 'Executiva'
            airlines = e.JAirlines;
          } else {
            miles = e.FMileageCost
            type_trip = 'Primeira Classe'
            airlines = e.FAirlines;
          }
          const airportsCity: { [key: string]: string } = {
            'LIS': 'Lisboa',
            'WAS': 'Washington, D.C.',
            'PAR': 'Paris',
            'SEL': 'Seul',
            'MAD': 'Madri',
            'HND': 'Tóquio',
            'CHI': 'Chicago',
            'LAX': 'Los Angeles',
            'ORL': 'Orlando',
            'NYC': 'Nova York',
            'MIL': 'Milão',
            'BUE': 'Buenos Aires',
            'LON': 'Londres',
            'MIA': 'Miami',
            'IAH': 'Houston',
            'LIM': 'Lima',
            'JFK': 'Nova York',
            'GIG': 'Rio de Janeiro',
            'FOR': 'Fortaleza',
            'NAT': 'Natal',
            'SAO': 'São Paulo',
            'REC': 'Recife',
            'MCZ': 'Maceió',
            'RIO': 'Rio de Janeiro',
            'CNF': 'Belo Horizonte',
            'BSB': 'Brasília',
            'AJU': 'Aracaju',
            'GRU': 'São Paulo',
            'ATL': 'Atlanta',
            'PEK': 'Pequim',
            'DXB': 'Dubai',
            'ORD': 'Chicago',
            'LHR': 'Londres',
            'PVG': 'Xangai',
            'CDG': 'Paris',
            'DFW': 'Dallas',
            'CGH': 'São Paulo',
            'SDU': 'Rio de Janeiro',
            'POA': 'Porto Alegre',
            'SSA': 'Salvador',
            'CWB': 'Curitiba',
            'BEL': 'Belém',
            'MAO': 'Manaus',
            'VIX': 'Vitória',
            'AMS': 'Amsterdã',
            'FRA': 'Frankfurt',
            'IST': 'Istambul',
            'SIN': 'Singapura',
            'ICN': 'Incheon',
            'BKK': 'Bangkok',
            'HKG': 'Hong Kong'
          };

          const continentsTranslate: { [key: string]: string } = {
            'South America': 'América do Sul',
            'North America': 'América do Norte',
            'Europe': 'Europa',
            'Asia': 'Asia',
            'Africa': 'África',
            'Oceania': 'Oceanía'
          };

          let json: Alert = {
            miles,
            id: '',
            original_message: null,
            affiliates_program: e.Route.Source.toLocaleUpperCase(),
            trip: airportsCity[e.Route.OriginAirport] + ' para ' + airportsCity[e.Route.DestinationAirport],
            route: continentsTranslate[e.Route.OriginRegion] + ' a ' + continentsTranslate[e.Route.DestinationRegion],
            amount: calculateMilesToCurrency(e.Source, Number(miles), 'BRL'),
            type_trip,
            airlines,
            remaining: moment(e.Date).format('L'),
            sent: 'brasil_group',
            sent_date: null,
            created_at: null,
            link: null
          };

          if (type_trip == 'Econômica' && Number(json.miles) <= 70000 && !json.airlines?.includes('Sky Airline Chile')) {
            const response = await engine_v1.get(`/trips/${e.ID}`);

            const link = response.data

            json.link = link.booking_links[0].link;

            if (json.link != null) {
              console.log('SAVED SeatsAero')
              console.log(json)
              return new AlertService().createAlert(json)
            }
          }

          if (type_trip == 'Executiva' && Number(json.miles) <= 120000 && !json.airlines?.includes('Sky Airline Chile')) {
            const response = await engine_v1.get(`/trips/${e.ID}`);

            const link = response.data

            json.link = link.booking_links[0].link;

            if (json.link != null) {
              console.log('SAVED SeatsAero')
              console.log(json)
              return new AlertService().createAlert(json)
            }
          }

          if (json.miles != null && source == 'azul' && !json.airlines?.includes('Sky Airline Chile')) {
            const response = await engine_v1.get(`/trips/${e.ID}`);

            const link = response.data

            json.link = link.booking_links[0].link;

            if (json.link != null) {
              console.log('SAVED SeatsAero')
              console.log(json)
              return new AlertService().createAlert(json)
            }
          }
        }
      }
      if (availability.hasMore) {
        skip += take;
      } else {
        console.log('No more pages available for current selection. Restarting...');
        skip = 0;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  getRandomElement(arr: any) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async getTKmilhas() {
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: [
          '--window-size=1920,1080',
          // '--disable-gpu',
          // '--disable-dev-shm-usage',
          // '--disable-setuid-sandbox',
          // '--no-first-run',
          // '--no-sandbox',
          // '--no-zygote',
          // '--single-process',
        ],
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
        protocolTimeout: 0
      });

      const page = await browser.newPage();
      const client = await page.createCDPSession();
      await client.send('Browser.grantPermissions', {
        origin: "https://www.tkmilhas.com/login",
        permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      });

      await page.goto('https://www.tkmilhas.com/login', { timeout: 0 });

      await page.locator('#mui-1').fill('ruan_jtl@hotmail.com');
      await delay(3000);

      await page.locator('#mui-2').fill('Isabel%2936');
      await delay(3000);

      await page.locator('.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeLarge.MuiButton-containedSizeLarge.MuiButton-fullWidth.MuiButtonBase-root.css-1g8e2pa').click();
      await delay(3000);

      const buttonsToClick = ['smiles'];
      const program = this.getRandomElement(buttonsToClick);
      const selector = `button[value="${program}"]`;
      await page.locator(selector).click();
      await delay(1000);

      await page.evaluate(async () => {
        let scrollPosition = 0;
        let documentHeight = document.body.scrollHeight;

        while (documentHeight > scrollPosition) {
          window.scrollBy(0, documentHeight);
          await new Promise(resolve => {
            setTimeout(resolve, 1000);
          });
          scrollPosition = documentHeight;
          documentHeight = document.body.scrollHeight;
        }
      });

      let airports_from: string[] = []

      if (this.change_search == 'BR') {
        airports_from = [
          'FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'
        ];

        this.change_search = 'CH'
      } else if (this.change_search == 'CH') {
        airports_from = [
          'SCL'
        ];

        this.change_search = 'BR'
      }

      const airports_to = [
        'LIS', 'WAS', 'PAR', 'SEL',
        'MAD', 'HND', 'CHI', 'LAX', 'ORL',
        'NYC', 'MIL', 'BUE', 'LON',
        'IAH', 'LIM', 'JFK', 'GIG'
      ];

      const cabin = ['Executive'];

      const from: string = this.getRandomElement(airports_from);
      const to: string = this.getRandomElement(airports_to);

      console.log('\n\nSaindo de: ' + from);
      console.log('Para: ' + to);
      console.log('\nSource: ' + program);

      await page.locator('.MuiInput-root.MuiInput-underline.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-fullWidth.MuiInputBase-formControl.css-3dr76p input[value="5"]').click();
      await page.keyboard.type('30');
      await page.keyboard.press('Enter');
      await delay(1000);

      await page.locator('.MuiAutocomplete-root.airport-input input').fill('');
      await delay(1000);

      await page.locator('#fromAirport').fill(from);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await delay(1000);
      await page.keyboard.type('', { delay: 1000 });
      await delay(3000);

      await page.keyboard.type(to, { delay: 1000 });
      await page.keyboard.press('Enter');
      await delay(3000);

      const cabinSelected = this.getRandomElement(cabin);

      await page.locator('#mui-7').click();
      await page.waitForSelector('ul.MuiMenu-list li', { timeout: 0 });
      await page.click(`ul.MuiMenu-list li[data-value="${cabinSelected}"]`);

      let start_date = new Date();
      let end_date = new Date(start_date);
      end_date.setMonth(start_date.getMonth() + 3);

      start_date = randomDate(start_date, end_date, 0, 24);
      let date = moment(start_date).format('L');

      while (start_date < new Date()) {
        start_date = randomDate(start_date, end_date, 0, 24);
        date = moment(start_date).format('L');
      }

      console.log('Data da Busca: ' + moment(start_date).format('L'));

      await page.locator('#owDate').fill('');
      await delay(3000);
      await page.locator('#owDate').fill(date);
      await delay(3000);

      await page.locator('.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeSmall.MuiButton-containedSizeSmall.MuiButtonBase-root.searchButton.css-1dpvzvp').click();
      console.log('Buscando...');

      await page.waitForFunction(() => !document.querySelector('.MuiSkeleton-root'), { timeout: 0 });

      await page.evaluate(async () => {
        let scrollPosition = 0;
        let documentHeight = document.body.scrollHeight;

        while (documentHeight > scrollPosition) {
          window.scrollBy(0, documentHeight);
          await new Promise(resolve => {
            setTimeout(resolve, 1000);
          });
          scrollPosition = documentHeight;
          documentHeight = document.body.scrollHeight;
        }
      });

      const mileElements = await page.$$eval('.MuiBox-root.css-1yaucul h4:nth-of-type(2)', elements =>
        elements.filter(f => f.innerText !== 'Erro').map(el => parseInt(el.innerText.replace(/\D/g, ''), 10))
      );

      console.log('Fim da busca.');

      if (mileElements.length == 0) {
        console.log('Fim da busca, nada encontrado. Chamando próxima execução');
        await browser.close();
        await delay(2500);
        await this.getTKmilhas();
      }

      const sortedIndices = mileElements
        .map((val, idx) => [val, idx])
        .sort(([val1], [val2]) => val1 - val2)
        .slice(0, 1)
        .map(([, idx]) => idx);

      console.log('Selecionando melhores emissões...');

      const buttons = await page.$$('.MuiBox-root.css-1yaucul');

      for (const index of sortedIndices) {
        await buttons[index].click();
        // await page.waitForSelector('.MuiAccordionDetails-root');

        await page.waitForSelector('div[aria-label="Clique para adicionar no orçamento e emissão."]', { timeout: 0 });

        // Clica na div usando o atributo aria-label
        await page.click('div[aria-label="Clique para adicionar no orçamento e emissão."]');


        const buttonClicked = await page.evaluate(() => {
          const buttonsOptions = Array.from(document.querySelectorAll('button'));
          for (let button of buttonsOptions) {
            if (button.textContent?.includes('Copiar dados Voo')) {
              button.click();
              return true; // Indica que o botão foi encontrado e clicado
            }
          }
          return false; // Indica que o botão não foi encontrado
        });

        await delay(2000);

        const copiedData = await page.evaluate(async () => {
          const text = await navigator.clipboard.readText();
          return text;
        });

        const flightDetails = copiedData.split('\n').map(line => line.trim()).filter(line => line);
        const flightSegments = [];

        for (let i = 0; i < flightDetails.length; i++) {
          if (flightDetails[i].startsWith('Partida:')) {
            const segment = {
              departureTime: flightDetails[i].replace('Partida:', '').trim(),
              arrivalTime: flightDetails[++i].replace('Chegada:', '').trim(),
              airline: flightDetails[++i].replace('Cia:', '').trim(),
              flightNumber: flightDetails[++i].replace('Nº Voo:', '').trim(),
              origin: flightDetails[++i].replace('Origem:', '').trim(),
              destination: flightDetails[++i].replace('Destino:', '').trim(),
              cabin: flightDetails[++i].replace('Cabine:', '').trim(),
            };
            flightSegments.push(segment);
          }
        }

        const flightInfo = await page.evaluate((mile, flightSegments) => {
          const programElement = document.querySelector('.MuiTableHead-root .flight-table-header td:nth-of-type(1)') as any;
          const classElement = document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(1) .MuiTypography-button') as any;
          const departureElement = document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(3) .MuiTypography-button') as any;
          const flightElement = document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(5) .MuiTypography-button') as any;

          return {
            program: programElement ? programElement.innerText : null,
            class: classElement ? classElement.innerText : null,
            departure: departureElement ? departureElement.innerText : null,
            flight: flightElement ? flightElement.innerText : null,
            miles: mile,
            flightSegments
          };
        }, mileElements[index], flightSegments);

        console.log(flightInfo.miles)
        flightInfo.miles = Number(flightInfo.miles)

        switch (program) {
          case 'smiles':
            if ((Number(flightInfo.miles) <= 70000 && cabinSelected == 'Basic') || (Number(flightInfo.miles) <= 120000 && cabinSelected == 'Executive')) {

              const [day, month, year, hour, minute] = flightInfo.departure.match(/\d+/g).map(Number);
              const date = new Date(year, month - 1, day, hour, minute);
              const millisecondsData = date.getTime();


              const link = `https://www.smiles.com.br/mfe/emissao-passagem/?adults=1&cabin=${cabinSelected == 'Basic' ? 'ECONOMIC' : 'BUSINESS'}&children=0&infants=0&isElegible=false&isFlexibleDateChecked=false&searchType=g3&segments=1&originAirportIsAny=true&destinAirportIsAny=true&novo-resultado-voos=true&departureDate=${millisecondsData}&tripType=2&originAirport=${from}&destinationAirport=${to}`;


              new AlertService().createAlert({
                affiliates_program: flightInfo.program,
                trip: flightSegments[0].origin.split('/')[1] + ' a ' + flightSegments[flightSegments.length - 1].destination.split('/')[1],
                route: 'Internacional',
                miles: Math.round(flightInfo.miles).toString(),
                amount: Math.round(Number(calculateMilesToCurrency('smiles', Number(flightInfo.miles), from === 'SCL' ? 'CLP' : 'BRL'))).toString(),
                airlines: flightSegments[0].airline,
                sent: from === 'SCL' ? 'chile_group' : 'brasil_group',
                type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
                remaining: flightInfo.departure,
                link
              });
            }
            break;
          case 'multiplus':
            if ((Number(flightInfo.miles) <= 85000 && cabinSelected == 'Basic') || Number(flightInfo.miles) <= 120000 && cabinSelected == 'Executive') {
              new AlertService().createAlert({
                affiliates_program: flightInfo.program,
                trip: flightSegments[0].origin.split('/')[1] + ' a ' + flightSegments[flightSegments.length - 1].destination.split('/')[1],
                route: 'Internacional',
                miles: Math.round(flightInfo.miles).toString(),
                amount: Math.round(Number(calculateMilesToCurrency('latam', Number(flightInfo.miles), from === 'SCL' ? 'CLP' : 'BRL'))).toString(),
                airlines: flightSegments[0].airline,
                sent: from === 'SCL' ? 'chile_group' : 'brasil_group',
                type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
                remaining: flightInfo.departure
              });
            }
            break;

          default:
            break;
        }

        await browser.close();
        await delay(5000);
        await this.getTKmilhas();

      }

    } catch (error) {
      console.log('Erro na execução crawler' + error);
      await delay(5000);
      await browser?.close();
      await this.getTKmilhas();
    }
  }
}

export default engineV1