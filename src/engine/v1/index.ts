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
import calculateMilesToCLP from '../../util/conversor';
import 'moment/locale/pt-br'

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

class engineV1 {
  interval: any;
  is_running: boolean;
  count_execution: number;

  constructor() {
    this.is_running = false;
    this.count_execution = 0;
    this.interval = null;
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

    let limitExecutiva = 15 - countExecutiva;
    let limitEconomica = 15 - countEconomica;

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

        sendDefaultMessage(formattedText, 'WAG21643897-66e9-45a7-8886-7040c803db73');

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
      // setInterval(() => this.processQueueTK(), 5000);
      // setInterval(() => this.processQueueSeatsAero(), 1800000);
      // setInterval(() => this.processQueueSeatsAeroChile(), 5000);
      setInterval(() => this.processQueueSeatsAeroChileFreeGroup(), 1800000);
      this.processQueueSeatsAeroChileFreeGroup()
      // this.processQueueSeatsAeroChileFreeGroup()
      // setInterval(() => this.processQueueSeatsAeroChileFreeGroup(), 5000);

      // setInterval(() => this.getSeatsAero(), 60000);
      setInterval(() => this.getSeatsAeroChile(), 60000);
      this.getSeatsAeroChile()
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
    const continents = ['Europe', 'South+America','North+America'];
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

    const airports_to = [
      'LIS', 'WAS', 'PAR', 'SEL',
      'MAD', 'HND', 'CHI', 'LAX', 'ORL',
      'NYC', 'MIL', 'BUE', 'LON', 'MIA',
      'IAH', 'LIM', 'JFK', 'GIG'
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
            amount: calculateMilesToCLP(e.Source, Number(miles)),
            type_trip,
            airlines,
            remaining: moment(e.Date).format('L'),
            sent: 'chile_group',
            sent_date: null,
            created_at: null
          };

          if (type_trip == 'Econômica' && Number(json.miles) <= 85000) {
            console.log('SAVED SeatsAero')
            console.log(json)
            return new AlertService().createAlert(json)
          }

          if (type_trip == 'Executiva' && Number(json.miles) <= 140000) {
            console.log('SAVED SeatsAero')
            console.log(json)
            return new AlertService().createAlert(json)
          }

          if (json.miles != null && source == 'azul') {
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

  // async getSeatsAero() {

  //   const origins_airports = ['FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'];
  //   const continents = ['North+America', 'Europe', 'Asia', 'Africa', 'South+America', 'Oceania'];
  //   const sources = ['american', 'azul', 'smiles'];
  //   console.log('SeatsAero rodando')
  //   let take = 3000;
  //   let skip = 0;

  //   let start_date = new Date();
  //   let end_date = new Date(start_date);
  //   end_date.setFullYear(start_date.getFullYear() + 1);
  //   start_date = randomDate(start_date, end_date, 0, 24);
  //   end_date = randomDate(start_date, end_date, 0, 24);

  //   if (end_date.getTime() > end_date.getTime()) {
  //     const tempDate = start_date;
  //     start_date = end_date;
  //     end_date = tempDate;
  //   }

  //   const source = sources[Math.floor(Math.random() * sources.length)];
  //   const destination = continents[Math.floor(Math.random() * continents.length)];

  //   try {
  //     const response = await engine_v1.get(`/availability?source=${source}&start_date=${formatDate(start_date)}&end_date=${formatDate(end_date)}&origin_region=South+America&destination_region=${destination}&take=${take}&skip=${skip}`);

  //     const availability = response.data;

  //     if (availability.data.length === 0) {
  //       console.log('No more data available. Restarting...');
  //       skip = 0;
  //     }

  //     availability.data = availability.data.filter((seat: any) =>
  //       seat.WRemainingSeats > 4 ||
  //       seat.JRemainingSeats > 4 ||
  //       seat.FRemainingSeats > 4
  //     );

  //     for (let i = 0; i < availability.data.length; i++) {
  //       const e = availability.data[i];
  //       if (origins_airports.includes(e.Route.OriginAirport) && (e.WAvailable === true || e.JAvailable === true || e.FAvailable === true)) {

  //         // Remover todas as chaves que começam com 'Y'
  //         for (let key in e) {
  //           if (key.startsWith('Y')) {
  //             delete e[key];
  //           }
  //         }

  //         // Extrair os valores de milhas
  //         let mileageCosts = {
  //           W: parseInt(e.WMileageCost),
  //           J: parseInt(e.JMileageCost),
  //           F: parseInt(e.FMileageCost)
  //         };

  //         // Filtrar valores diferentes de 0 e encontrar o menor valor
  //         let filteredCosts = Object.entries(mileageCosts).filter(([key, value]) => value !== 0);
  //         let minCostEntry = filteredCosts.reduce((minEntry, currentEntry) => currentEntry[1] < minEntry[1] ? currentEntry : minEntry);

  //         // Função para deletar chaves relacionadas a um tipo específico
  //         function deleteRelatedKeys(type: any) {
  //           for (let key in e) {
  //             if (key.startsWith(type)) {
  //               delete e[key];
  //             }
  //           }
  //         }

  //         // Deletar chaves relacionadas aos tipos de milhagem que não possuem o menor valor
  //         for (let key in mileageCosts) {
  //           if (key !== minCostEntry[0]) {
  //             deleteRelatedKeys(key);
  //           }
  //         }

  //         // console.log('BUSCA SEATSAERO - RETORNO')
  //         // console.log('------------------------------------------')
  //         // console.log(e)
  //         // console.log('------------------------------------------')

  //         const data_gpt = {
  //           "model": "gpt-3.5-turbo",
  //           "messages": [
  //             {
  //               "role": "system",
  //               "content": `Você é um analista de passagens aéreas. 
  //               Seu objetivo é analisar e filtrar apenas passagens de classe Executiva, Primeira Classe e Premium Economy. 
  //               Vou lhe mandar um objeto para análise, e você deve retornar um JSON organizado com os dados fornecidos, contendo os seguintes campos:

  //               - affiliates_program: Identifique o programa de afiliados no JSON que enviar e coloque nesse campo em caixa alta.
  //               - trip: Coloque a origem e o destino com os nomes das cidades por extenso no formato (origem para destino).
  //               - route: Coloque a rota dos continentes no formato 'América do Sul para América do Norte'.
  //               - miles: Identifique o menor custo de milhas entre as classes Executiva, Primeira Classe e Premium Economy e coloque nesse campo com a pontuação adequada (ex: 151000 -> 151.000). Ignore passagens com milhas igual a 0. Coloque como um texto
  //               - type_trip: Baseado nas milhas mais baratas das classes permitidas, identifique a classe do voo JMileageCost = Executiva, FMileageCost = Primeira Classe ou WMileageCost = Premium Economy e coloque nesse campo. Ignore passagens econômicas.
  //               - airlines: Identifique a companhia aérea e coloque nesse campo.
  //               - remaining: Data de embarque no formato DD/MM/YYYY.
  //               - sent: 'brasil_group'.
  //               - amount: Com base no valor em milhas, converta usando a tabela abaixo para a cada 1000 milhas. Coloque como texto em duas casas decimais sem vírgula.

  //               Tabela para conversão em reais:
  //               - SMILES: valor da milha = 21.00
  //               - LATAM PASS: valor da milha = 32.50
  //               - LATAMPASS: valor da milha = 32.50
  //               - LATAM PASS - TABELA FIXA: valor da milha = 32.50
  //               - TUDO AZUL: valor da milha = 28.00
  //               - AADVANTAGE - AMERICAN AIRLINES: valor da milha = 117.00
  //               - MILES&GO - TAP: valor da milha = 39.00
  //               - MILES&amp;GO - TAP: valor da milha = 39.00
  //               - AZUL FIDELIDADE - AZUL PELO MUNDO: valor da milha = 21.00
  //               - AZUL FIDELIDADE: valor da milha = 21.00
  //               - IBERIA PLUS - IBERIA: valor da milha = 78.00
  //               - AEROPLAN: valor da milha = 110.00
  //               - CONNECT MILES: valor da milha = 85.00`
  //             },
  //             {
  //               "role": "user",
  //               "content": "Por favor, analise o seguinte objeto JSON e retorne os dados organizados conforme as instruções fornecidas, excluindo passagens econômicas e selecionando a milha mais barata entre Executiva, Primeira Classe e Premium Economy. Formate as milhas no formato de mil com a pontuação adequada (ex: 151000 -> 151.000). Ignore milhas igual a 0."
  //             },
  //             {
  //               "role": "user",
  //               "content": JSON.stringify(e)
  //             }
  //           ]
  //         };

  //         const message = await gpt.post('chat/completions', data_gpt);

  //         let json = JSON.parse(message.data.choices[0].message.content) as Alert;
  //         json.miles = json.miles?.toString() as any

  //         const lasts = await new AlertService().verifyLast(json.trip as string);

  //         if (json.type_trip = 'JMileageCost') {
  //           json.type_trip = 'Executiva';
  //         } else if (json.type_trip = 'FMileageCost') {
  //           json.type_trip = 'Primeira Classe';
  //         } else if (json.type_trip = 'WMileageCost') {
  //           json.type_trip = 'Premium Economy';
  //         }


  //         if (json.miles != null && (Number(json.miles) <= 150.000 || json.miles <= '150000') && lasts.length < 1 && source == 'smiles') {
  //           console.log('SAVED SeatsAero')
  //           console.log(json)
  //           // return
  //           return new AlertService().createAlert(json)
  //         }

  //         if (json.miles != null && (Number(json.miles) <= 150.000 || json.miles <= '150000') && lasts.length < 1 && source == 'tudoazul') {
  //           console.log('SAVED SeatsAero')
  //           console.log(json)
  //           // return
  //           return new AlertService().createAlert(json)
  //         }

  //         if (json.miles != null && (Number(json.miles) <= 90.000 || json.miles <= '90000') && lasts.length < 1 && source == 'american') {
  //           console.log('SAVED SeatsAero')
  //           console.log(json)
  //           // return
  //           return new AlertService().createAlert(json)
  //         }
  //       }
  //     }
  //     if (availability.hasMore) {
  //       skip += take;
  //     } else {
  //       console.log('No more pages available for current selection. Restarting...');
  //       skip = 0;
  //     }
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   }
  // }

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

      const buttonsToClick = ['multiplus'];
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

      const airports_from = [
        'SCL'
      ];

      const airports_to = [
        'LIS', 'WAS', 'PAR', 'SEL',
        'MAD', 'HND', 'CHI', 'LAX', 'ORL',
        'NYC', 'MIL', 'BUE', 'LON',
        'MIA', 'IAH', 'LIM', 'JFK', 'GIG'
      ];

      const cabin = ['Executive', 'Basic'];

      const from = this.getRandomElement(airports_from);
      const to = this.getRandomElement(airports_to);

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
        await page.waitForSelector('.MuiAccordionDetails-root', { timeout: 0 });

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

        if (flightInfo.miles <= 120000) {
          console.log('ALERTA CAPTURADOS');
          console.log(flightInfo);

          new AlertService().createAlert({
            affiliates_program: flightInfo.program,
            trip: 'Internacional',
            route: flightSegments[0].origin.split('/')[1] + ' para ' + flightSegments[flightSegments.length - 1].destination.split('/')[1],
            miles: `A partir de ${flightInfo.miles} milhas trecho + taxas`,
            airlines: flightSegments[0].airline,
            sent: 'tk',
            type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
            remaining: flightInfo.departure
          });
        }

        console.log('Nada bom encontrado.\n\n');

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