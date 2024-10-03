import moment from "moment";
import { randomDate } from "../../../util/random-date";
import { engine_v1 } from "../../../axios";
import { formatDate } from "../../../util/format-date";
import calculateMilesToCurrency from "../../../util/conversor";
import { AlertService } from "../../../services/alert.service";
import axios from "axios";
import { Alert } from "../../../models/alert.model";
import { AvailabilityData } from "../../../models/seats-aero.model";
import { airportsCity, continentsTranslate } from "../util";
import { randomElement } from "../../../util/random-element";

let take = 5000;
let skip = 0;

const origins_airports = "GRU,GIG,CNF,BSB,FOR,MAO,POA";
const destination_airport = "ATL,PEK,LAX,DXB,HND,ORD,LHR,PVG,CDG,AMS,FRA,IST,SIN,ICN,BKK,JFK,HKG,EZE,LIS,MAD,MXP,ORY,AUH,MIA,LAS,YYZ,YUL";

let url = `/search?take=${take}&skip=${skip}&start_date=${moment().format('YYYY-MM-DD')}&end_date=2025-10-03&origin_airport=${origins_airports}&destination_airport=${destination_airport}&order_by=lowest_mileage&cabin=business`;
async function getSeatsAeroBrasil() {
  moment.locale('pt-br')

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


  try {
    const response = await engine_v1.get(url);
    skip = skip + take;

    console.log(url);

    let availability;

    availability = response.data

    if (availability.hasMore !== false) {
      url = availability.moreURL.split('/partnerapi/')[1];
    } else {
      take = 5000;
      skip = 0;
      url = `/search?take=${take}&skip=${skip}&start_date=${moment().format('YYYY-MM-DD')}&end_date=2025-10-03&origin_airport=${origins_airports}&destination_airport=${destination_airport}&order_by=lowest_mileage&cabin=business`;
    }

    availability.data = availability.data.filter((seat: any) =>
      seat.Source === 'azul' ||
      seat.WRemainingSeats > 0 ||
      seat.JRemainingSeats > 0 ||
      seat.FRemainingSeats > 0 ||
      seat.YRemainingSeats > 0
    );
    console.log(availability.data.length)

    const alertGroups: { [key: string]: Alert[] } = {};

    availability.data.forEach(async (e: any) => {
      if (e.Source === 'smiles' || e.Source === 'azul' || e.Source === 'american') {
        let mileageCosts = {
          Y: parseInt(e.YMileageCost),
          W: parseInt(e.WMileageCost),
          J: parseInt(e.JMileageCost),
          F: parseInt(e.FMileageCost)
        };

        if (e.Source === 'azul') {
          console.log(e)
          return
        }

        let filteredCosts = Object.entries(mileageCosts)
          .filter(([key, value]) => key !== "Y" && value !== 0);

        let minCostEntry;
        if (filteredCosts.length > 0) {
          minCostEntry = filteredCosts.reduce((minEntry, currentEntry) =>
            currentEntry[1] < minEntry[1] ? currentEntry : minEntry
          );
        } else {
          return;
        }

        function deleteRelatedKeys(type: any) {
          for (let key in e) {
            if (key.startsWith(type)) {
              delete e[key as keyof AvailabilityData];
            }
          }
        }

        for (let key in mileageCosts) {
          if (key === "Y" || key !== minCostEntry[0]) {
            deleteRelatedKeys(key);
          }
        }

        let miles
        let type_trip;
        let airlines;
        let remainingSeats;

        if (e.YMileageCost !== undefined) {
          miles = e.YMileageCost
          type_trip = 'Econômica'
          airlines = e.YAirlines;
          remainingSeats = e.YRemainingSeats;
        } else if (e.WMileageCost !== undefined) {
          miles = e.WMileageCost
          type_trip = 'Premium Economy'
          airlines = e.WAirlines;
          remainingSeats = e.WRemainingSeats;
        } else if (e.JMileageCost !== undefined) {
          miles = e.JMileageCost
          type_trip = 'Executiva'
          airlines = e.JAirlines;
          remainingSeats = e.JRemainingSeats;
        } else {
          miles = e.FMileageCost
          type_trip = 'Primeira Classe'
          airlines = e.FAirlines;
          remainingSeats = e.FRemainingSeats;
        }

        let json: Alert = {
          miles,
          id: '',
          original_message: null,
          affiliates_program: e.Route.Source.toLocaleUpperCase(),
          trip: airportsCity[e.Route.OriginAirport] + ' para ' + airportsCity[e.Route.DestinationAirport],
          route: continentsTranslate[e.Route.OriginRegion] + ' a ' + continentsTranslate[e.Route.DestinationRegion],
          amount: Math.round(Number(calculateMilesToCurrency(e.Source, Number(miles), 'BRL'))).toString(),
          type_trip,
          airlines,
          remaining: '\n' + moment(e.Date).format('L') + ' -> ' + 'Assentos restantes: ' + remainingSeats,
          sent: 'brasil_group',
          sent_date: null,
          created_at: null,
          link: null
        };

        if (json.trip !== null && remainingSeats > 0 && json.miles !== null && json.type_trip !== 'Premium Economy') {
          const groupKey = `${json.trip}-${json.affiliates_program}`;

          if (!alertGroups[groupKey]) {
            alertGroups[groupKey] = [];
          }

          alertGroups[groupKey].push(json);
        }
      }
    })

    Object.keys(alertGroups).forEach(async (groupKey) => {
      const alerts = alertGroups[groupKey];

      const combinedAlert = alerts.reduce((acc, curr) => {
        acc.remaining += `\n${curr.remaining}`;
        return acc;
      }, { ...alerts[0] });

      setTimeout(async () => {
        const milesNumber = Number(combinedAlert.miles);

        if (combinedAlert.trip === null) return;
        if (combinedAlert.miles === null) return;
        if (combinedAlert.affiliates_program === null) return;

        const returnLast = await new AlertService().verifyLast(combinedAlert.trip, combinedAlert.miles, combinedAlert.affiliates_program);

        if (returnLast >= 1) {
          console.log(`Já existem ${returnLast} alertas para a viagem ${combinedAlert.trip} nas últimas 24 horas. Não será criado um novo alerta.`);
          return;
        }

        if (combinedAlert.affiliates_program == 'SMILES') {
          switch (combinedAlert.trip) {
            case 'São Paulo para Buenos Aires':
              if (milesNumber <= 60000) {
                new AlertService().createAlert(combinedAlert);
              }
              break;
            case 'Belo Horizonte para Panamá':
              if (milesNumber <= 125000) {
                new AlertService().createAlert(combinedAlert);
              }
              break;
            case 'Rio de Janeiro para Miami':
              if (milesNumber <= 270000) {
                new AlertService().createAlert(combinedAlert);
              }
              break;
            case 'São Paulo para Dallas':
              if (milesNumber <= 211000) {
                new AlertService().createAlert(combinedAlert);
              }
              break;
            default:
              if (milesNumber <= 300000) {
                new AlertService().createAlert(combinedAlert);
                break;
              }
          }
        }

        if (combinedAlert.affiliates_program == 'AZUL' && milesNumber <= 80000) {
          console.log(combinedAlert);
          return new AlertService().createAlert(combinedAlert);
        }

        if (combinedAlert.affiliates_program == 'AMERICAN' && combinedAlert.type_trip == 'Executiva') {

          if (combinedAlert.airlines?.includes('QR') && milesNumber <= 90000) {
            return new AlertService().createAlert(combinedAlert);
          }

          if (milesNumber <= 50000) {
            return new AlertService().createAlert(combinedAlert);
          }
        }
      }, 2000);
    });

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// async function getSeatsAeroChile() {
//   moment.locale('pt-br')

//   const origins_airports = ['SCL'];
//   const continents = ['Europe', 'South+America', 'North+America'];
//   const sources = ['smiles', 'azul'];
//   console.log('SeatsAero (CHILE) rodando')
//   let take = 5000;
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

//   const airports_to: string[] = [
//     'ATL', 'PEK', 'LAX', 'DXB', 'HND', 'ORD', 'LHR', 'PVG', 'CDG',
//     'DFW', 'GRU', 'GIG', 'BSB', 'CGH', 'SDU', 'POA', 'SSA', 'REC',
//     'CWB', 'FOR', 'BEL', 'MAO', 'CNF', 'VIX', 'NAT', 'MCZ', 'AJU',
//     'AMS', 'FRA', 'IST', 'SIN', 'ICN', 'BKK', 'JFK', 'HKG', 'LIS', 'WAS',
//     'PAR', 'SEL', 'MAD', 'CHI', 'ORL', 'NYC', 'MIL', 'BUE', 'LON', 'IAH', 'LIM',
//   ];


//   const source = sources[Math.floor(Math.random() * sources.length)];
//   const destination = continents[Math.floor(Math.random() * continents.length)];

//   try {
//     const response = await engine_v1.get(`/search?origin_airport=${origins_airports}&destination_airport=${destination}&order_by=lowest_mileage&take=${take}&skip=${skip}`);

//     type Route = {
//       ID: string;
//       OriginAirport: string;
//       OriginRegion: string;
//       DestinationAirport: string;
//       DestinationRegion: string;
//       NumDaysOut: number;
//       Distance: number;
//       Source: string;
//     };

//     type AvailabilityData = {
//       ID: string;
//       RouteID: string;
//       Route: Route;
//       Date: string;
//       ParsedDate: string;
//       YAvailable: boolean;
//       WAvailable: boolean;
//       JAvailable: boolean;
//       FAvailable: boolean;
//       YMileageCost: string;
//       WMileageCost: string;
//       JMileageCost: string;
//       FMileageCost: string;
//       YDirectMileageCost: number;
//       WDirectMileageCost: number;
//       JDirectMileageCost: number;
//       FDirectMileageCost: number;
//       YRemainingSeats: number;
//       WRemainingSeats: number;
//       JRemainingSeats: number;
//       FRemainingSeats: number;
//       YDirectRemainingSeats: number;
//       WDirectRemainingSeats: number;
//       JDirectRemainingSeats: number;
//       FDirectRemainingSeats: number;
//       YAirlines: string;
//       WAirlines: string;
//       JAirlines: string;
//       FAirlines: string;
//       YDirectAirlines: string;
//       WDirectAirlines: string;
//       JDirectAirlines: string;
//       FDirectAirlines: string;
//       YDirect: boolean;
//       WDirect: boolean;
//       JDirect: boolean;
//       FDirect: boolean;
//       Source: string;
//       CreatedAt: string;
//       UpdatedAt: string;
//       AvailabilityTrips: null;
//     };

//     let availability;

//     availability = response.data

//     if (availability.data.length === 0) {
//       console.log('No more data available. Restarting...');
//       skip = 0;
//     }

//     availability.data = availability.data.filter((seat: any) =>
//       seat.WRemainingSeats > 4 ||
//       seat.JRemainingSeats > 4 ||
//       seat.FRemainingSeats > 4 ||
//       seat.YRemainingSeats > 4
//     );

//     for (let i = 0; i < availability.data.length; i++) {
//       const e = availability.data[i];

//       if (origins_airports.includes(e.Route.OriginAirport) && e.Route.DestinationAirport !== 'PTY' && airports_to.includes(e.Route.DestinationAirport)) {

//         let mileageCosts = {
//           Y: parseInt(e.YMileageCost),
//           W: parseInt(e.WMileageCost),
//           J: parseInt(e.JMileageCost),
//           F: parseInt(e.FMileageCost)
//         };

//         let filteredCosts = Object.entries(mileageCosts).filter(([key, value]) => value !== 0);
//         let minCostEntry = filteredCosts.reduce((minEntry, currentEntry) => currentEntry[1] < minEntry[1] ? currentEntry : minEntry);

//         function deleteRelatedKeys(type: any) {
//           for (let key in e) {
//             if (key.startsWith(type)) {
//               delete e[key as keyof AvailabilityData];
//             }
//           }
//         }

//         for (let key in mileageCosts) {
//           if (key !== minCostEntry[0]) {
//             deleteRelatedKeys(key);
//           }
//         }

//         let miles
//         let type_trip;
//         let airlines;

//         if (e.YMileageCost !== undefined) {
//           miles = e.YMileageCost
//           type_trip = 'Econômica'
//           airlines = e.YAirlines;
//         } else if (e.WMileageCost !== undefined) {
//           miles = e.WMileageCost
//           type_trip = 'Premium Economy'
//           airlines = e.WAirlines;
//         } else if (e.JMileageCost !== undefined) {
//           miles = e.JMileageCost
//           type_trip = 'Executiva'
//           airlines = e.JAirlines;
//         } else {
//           miles = e.FMileageCost
//           type_trip = 'Primeira Classe'
//           airlines = e.FAirlines;
//         }

//         const airportsCity: { [key: string]: string } = {
//           'LIS': 'Lisboa',
//           'WAS': 'Washington, D.C.',
//           'PAR': 'Paris',
//           'SEL': 'Seul',
//           'MAD': 'Madri',
//           'HND': 'Tóquio',
//           'CHI': 'Chicago',
//           'LAX': 'Los Angeles',
//           'ORL': 'Orlando',
//           'NYC': 'Nova York',
//           'MIL': 'Milão',
//           'BUE': 'Buenos Aires',
//           'LON': 'Londres',
//           'MIA': 'Miami',
//           'IAH': 'Houston',
//           'LIM': 'Lima',
//           'JFK': 'Nova York',
//           'GIG': 'Rio de Janeiro',
//           'FOR': 'Fortaleza',
//           'NAT': 'Natal',
//           'SAO': 'São Paulo',
//           'REC': 'Recife',
//           'MCZ': 'Maceió',
//           'RIO': 'Rio de Janeiro',
//           'CNF': 'Belo Horizonte',
//           'BSB': 'Brasília',
//           'AJU': 'Aracaju',
//           'GRU': 'São Paulo',
//           'ATL': 'Atlanta',
//           'PEK': 'Pequim',
//           'DXB': 'Dubai',
//           'ORD': 'Chicago',
//           'LHR': 'Londres',
//           'PVG': 'Xangai',
//           'CDG': 'Paris',
//           'DFW': 'Dallas',
//           'CGH': 'São Paulo',
//           'SDU': 'Rio de Janeiro',
//           'POA': 'Porto Alegre',
//           'SSA': 'Salvador',
//           'CWB': 'Curitiba',
//           'BEL': 'Belém',
//           'MAO': 'Manaus',
//           'VIX': 'Vitória',
//           'AMS': 'Amsterdã',
//           'FRA': 'Frankfurt',
//           'IST': 'Istambul',
//           'SIN': 'Singapura',
//           'ICN': 'Incheon',
//           'BKK': 'Bangkok',
//           'HKG': 'Hong Kong'
//         };

//         const continentsTranslate: { [key: string]: string } = {
//           'South America': 'América del Sur',
//           'North America': 'América del Norte',
//           'Europe': 'Europa',
//           'Asia': 'Asia',
//           'Africa': 'África',
//           'Oceania': 'Oceanía'
//         };

//         let json: Alert = {
//           miles,
//           id: '',
//           original_message: null,
//           affiliates_program: e.Route.Source.toLocaleUpperCase(),
//           trip: 'Santiago a ' + airportsCity[e.Route.DestinationAirport],
//           route: continentsTranslate[e.Route.OriginRegion] + ' a ' + continentsTranslate[e.Route.DestinationRegion],
//           amount: Math.round(Number(calculateMilesToCurrency(e.Source, Number(miles), 'CLP'))).toString(),
//           type_trip,
//           airlines,
//           remaining: moment(e.Date).format('L'),
//           sent: 'chile_group',
//           sent_date: null,
//           created_at: null,
//           link: null
//         };


//         if (json.trip !== null) {

//           const returnLast = await new AlertService().verifyLast(json.trip);

//           if (returnLast <= 2 && json.miles !== null) {
//             if (json.type_trip == 'Econômica' && json.miles <= '85000' && !json.airlines?.includes('Sky Airline Chile')) {
//               console.log('SAVED SeatsAero')
//               console.log(json)
//               return new AlertService().createAlert(json)
//             }

//             if (json.type_trip == 'Executiva' && json.miles <= '140000' && !json.airlines?.includes('Sky Airline Chile')) {
//               console.log('SAVED SeatsAero')
//               console.log(json)
//               return new AlertService().createAlert(json)
//             }

//             if (e.Source == 'azul' && json.miles <= '100000' && !json.airlines?.includes('Sky Airline Chile')) {
//               console.log('SAVED SeatsAero')
//               console.log(json)
//               return new AlertService().createAlert(json)
//             }
//           }
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

async function cachedSearch(from: string, to: string, cabin: string, date_departure: string, date_return: string) {
  const response = await engine_v1.get(`/search?origin_airport=${to}&destination_airport=${from}&order_by=lowest_mileage&take=${5000}&start_date=${moment(date_departure).format('YYYY-MM-DD')}&end_date=${moment(date_return).format('YYYY-MM-DD')}`);

  if (response.data) {
    console.log(response.data)
    // response.data.forEach((element: any) => {
    //   console.log(element)
    // });
  }

}


export default { getSeatsAeroBrasil, cachedSearch } 
