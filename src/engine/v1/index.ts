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
import console from 'console';


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

      sendMoneyMessage(formattedText)

      //       setTimeout(() => {
      //         const formattedText = `
      // ⚠️ *OPORTUNIDADE @FLYALERTAS*

      // 🚨 Programa de Afiliados: ${alert.affiliates_program?.trim()}
      // ✈️  Rota: ${alert.trip?.trim()} / ${alert.route?.trim()}
      // 💰 A partir de ${formatter.format(Number(alert.amount))} trecho + taxas
      // 🛫 Companhia Aérea: ${alert.airlines?.trim()}
      // 💺 Classe: ${alert.type_trip?.trim()}
      // 🗓️  Alerta de Data : ${alert.remaining}
      // _Não tem milhas ? Nós te ajudamos com essa emissão !_`;

      //         sendMoneyMessage(formattedText)

      //       }, 4000);

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
      // setInterval(() => this.processQueueTK(), 1000);
      // this.crawlerTKMilhas()
      setInterval(() => this.getSeatsAero(), 500000);
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
      "to_group_uuid": "WAGb20bcd1c-1bfd-447a-bc33-594a10952708",
      "from_number": "+5579920012363",
      "text": `
⚠️ Manutenção Programada ⚠️

Olá pessoal do grupo Fly Alertas! Estamos realizando uma pequena manutenção para trazer novidades fresquinhas nos nossos alertas. Fiquem ligados para novas oportunidades incríveis que estamos preparando para vocês!

Em breve estaremos de volta com tudo! ✈️🌟

Atenciosamente,
Equipe Fly Alertas`
    });

    wpp.post('open/whatsapp/send-message', data)
      .then(function (response) {
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  async getSeatsAero() {

    const origins_airports = ['FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'];
    const continents = ['North+America', 'Europe', 'Asia'];
    const sources = ['american', 'azul', 'aeroplan', 'smiles'];
    console.log('SeatsAero rodando')
    let take = 1000;
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
                  "Mostre apenas numeros referentes a viagens EXECUTIVAS" +
                  "vou lhe mandar um objeto você vai analisar e vai retornar pra mim um " +
                  "JSON que contenha os dados que mandei pra você organizado. o json é" +
                  "affiliates_program: voce vai identificar o programa de afiliados no json que enviar e colocar nesse campo em caixa alta " +
                  "trip: aqui voce vai colocar de onde será a origem e de onde será o destino, coloque o nome das cidades por extenso no formato (origem para destino) " +
                  "route: coloque a rota dos continentes Exemplo: América do Sul para América do Norte" +
                  "miles: identifique o menor custo de milhas e coloque nesse campo com pontuação duas casas decimais sem usar virgula e como texto." +
                  "type_trip: com base nas milhas mais baratas identifique em qual classe está o voo dessas milhas e coloque nesse campo" +
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
          console.log(json);
          json.miles = json.miles?.toString() as any

          const lasts = await new AlertService().verifyLast(json.trip as string);

          if (json.miles != null && json.miles <= '250000' && lasts.length < 2) {
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

  getRandomElement(arr: any) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async crawlerTKMilhas() {

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--window-size=1920,1080'],
      protocolTimeout: 0
    });


    const page = await browser.newPage();
    const client = await page.createCDPSession();
    await client.send('Browser.grantPermissions', {
      origin: "https://www.tkmilhas.com/login",
      permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    });

    await page.goto('https://www.tkmilhas.com/login'); // Altere para a URL real da sua aplicação

    await page.locator('#mui-1').fill('potiguarpassagens@gmail.com');
    await delay(3000)

    await page.locator('#mui-2').fill('#Daniel55');
    await delay(3000)

    await page.locator('.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeLarge.MuiButton-containedSizeLarge.MuiButton-fullWidth.MuiButtonBase-root.css-1g8e2pa').click();

    await delay(3000)
    // 'azul', 'interline', 'copa', [em testes]
    // [em testes]
    const buttonsToClick = ['multiplus', 'smiles', 'iberia', 'aa', 'tap'];

    const program = this.getRandomElement(buttonsToClick);

    const selector = `button[value="${program}"]`;
    await page.locator(selector).click();
    await delay(1000)

    await page.evaluate(async () => {
      let scrollPosition = 0
      let documentHeight = document.body.scrollHeight

      while (documentHeight > scrollPosition) {
        window.scrollBy(0, documentHeight)
        await new Promise(resolve => {
          setTimeout(resolve, 1000)
        })
        scrollPosition = documentHeight
        documentHeight = document.body.scrollHeight
      }
    })

    const airports_from = [
      'FOR', 'NAT', 'SAO', 'REC', 'MCZ',
      'RIO', 'CNF', 'BSB', 'AJU', 'GRU',
      'GIG'
    ];

    const airports_to = [
      'LIS', 'WAS', 'PAR', 'SEL',
      'MAD', 'HND', 'CHI', 'LAX', 'ORL',
      'NYC', 'MIL', 'BUE', 'LON'
    ]

    // const combinations = new Set();

    const from = this.getRandomElement(airports_from);
    const to = this.getRandomElement(airports_to);

    // const combination = `${from}-${to}`;
    // if (combinations.has(combination)) continue;
    // combinations.add(combination);

    console.log('Saindo de: ' + from);
    console.log('Para: ' + to);

    await page.locator('.MuiInput-root.MuiInput-underline.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-fullWidth.MuiInputBase-formControl.css-3dr76p input[value="5"]').click();
    await page.keyboard.type('5');
    await page.keyboard.press('Enter');
    await delay(1000);

    await page.locator('.MuiAutocomplete-root.airport-input input').fill('');
    await delay(1000);

    await page.locator('.MuiAutocomplete-root.airport-input input').fill(from);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await delay(1000);
    await page.keyboard.type('', { delay: 1000 });
    await delay(3000);

    await page.keyboard.type(to, { delay: 1000 });
    await page.keyboard.press('Enter');
    await delay(3000);

    let start_date = new Date();
    let end_date = new Date(start_date);
    end_date.setMonth(start_date.getMonth() + 3)

    console.log(start_date, end_date)

    start_date = randomDate(start_date, end_date);

    let date = moment(start_date).format('L');

    while (date < moment().format('L')) {
      start_date = randomDate(start_date, end_date);
      date = moment(start_date).format('L');

    }

    console.log('Data preenchida: ' + date);
    await page.locator('#owDate').fill('');
    await delay(3000);
    await page.locator('#owDate').fill(date);
    await delay(3000);


    await page.locator('.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeSmall.MuiButton-containedSizeSmall.MuiButtonBase-root.searchButton.css-1dpvzvp').click();

    await page.waitForFunction(() => !document.querySelector('.MuiSkeleton-root'), { timeout: 0 });

    const mileElements = await page.$$eval('.MuiBox-root.css-1yaucul h4:nth-of-type(2)', elements =>
      elements.filter(f => f.innerText !== 'Erro').map(el => parseInt(el.innerText.replace(/\D/g, ''), 10))
    );

    console.log(mileElements)

    const sortedIndices = mileElements
      .map((val, idx) => [val, idx])
      .sort(([val1], [val2]) => val1 - val2)
      .slice(0, 1)
      .map(([, idx]) => idx);

    const buttons = await page.$$('.MuiBox-root.css-1yaucul');

    for (const index of sortedIndices) {
      await buttons[index].click();
      await page.waitForSelector('.MuiAccordionDetails-root', { timeout: 0 });
      console.log('Botao clicado voo clicado')

      await page.evaluate(() => {
        const budgetButton = Array.from(document.querySelectorAll('div')).find(div => div.innerText.includes('Clique para adicionar no orçamento e emissão.'));
        if (budgetButton) {
          budgetButton.click();
        }
      });

      await delay(2000);

      await page.evaluate(() => {
        const copyButton = Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('Copiar dados Voo'));
        if (copyButton) {
          copyButton.click();
        }
      });

      await delay(2000); // Delay to allow for any transitions/animations

      // Obtenha os dados da área de transferência
      const copiedData = await page.evaluate(async () => {
        const text = await navigator.clipboard.readText();
        return text;
      });

      console.log('Dados copiados: ' + copiedData)

      // Extraia os nomes das cidades e as companhias aéreas dos dados copiados
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
          flightSegments: flightSegments

        };
      }, mileElements[index], flightSegments);

      new AlertService().createAlert({
        affiliates_program: flightInfo.program,
        trip: 'Internacional',
        route: from + ' para ' + to,
        miles: `A partir de ${flightInfo.miles} milhas trecho + taxas`,
        airlines: '-',
        sent: 'tk',
        type_trip: 'Econômica',
        remaining: flightInfo.departure
      })

      // await browser.close();

      await delay(10000);
    }

    await delay(5000);

    await delay(5000);

  }
}

export default engineV1