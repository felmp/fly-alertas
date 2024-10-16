import puppeteer from 'puppeteer';
import delay from "../../../util/delay";
import { randomElement } from "../../../util/random-element";
import { randomDate } from "../../../util/random-date";
import moment from "moment";
import { AlertService } from "../../../services/alert.service";
import calculateMilesToCurrency from "../../../util/conversor";
import { brasilAeroportos } from "../util";
import { formatDate } from "../../../util/format-date";
import { addWeeks, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { proxiesLista } from '../config/latam.config';

async function getTKmilhas() {
  let browser
  let change_search
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--window-size=1920,1080',
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

    const buttonsToClick = ['multiplus', 'smiles'];
    const program = randomElement(buttonsToClick);
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

    airports_from = [
      'FOR', 'NAT', 'REC', 'CPV', 'MCZ', 'SLZ', 'THE', 'AJU', 'FEN', 'SSA', 'JPA'
    ];

    const airports_to = [
      "GRU", "GIG", "BSB", "CGH", "SDU", "VCP", "POA", "CNF", "REC", "SSA", "FOR", "CWB", "FLN",
      "MAO", "NAT", "BEL", "MCZ", "SLZ", "CGB", "AJU", "VIX", "JPA", "IGU", "STM", "TFF", "THE",
      "MCP", "BVB", "PVH", "RBR", "PPB", "UDI", "LDB", "MGF", "SJP", "VDC", "IOS", "CPV", "RAO",
      "CAW", "XAP"
    ];

    const cabin = ['Executive'];

    const from: string = randomElement(airports_from);
    const to: string = randomElement(airports_to);

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

    const cabinSelected = randomElement(cabin);

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
      getTKmilhas();
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

      await page.waitForSelector('div[aria-label="Clique para adicionar no orçamento e emissão."]', { timeout: 0 });

      await page.click('div[aria-label="Clique para adicionar no orçamento e emissão."]');

      const buttonClicked = await page.evaluate(() => {
        const buttonsOptions = Array.from(document.querySelectorAll('button'));
        for (let button of buttonsOptions) {
          if (button.textContent?.includes('Copiar dados Voo')) {
            button.click();
            return true;
          }
        }
        return false;
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

            new AlertService().createAlert({
              affiliates_program: flightInfo.program,
              trip: flightSegments[0].origin.split('/')[1] + ' a ' + flightSegments[flightSegments.length - 1].destination.split('/')[1],
              route: from + ' -> ' + to,
              miles: Math.round(flightInfo.miles).toString(),
              amount: Math.round(Number(calculateMilesToCurrency('smiles', Number(flightInfo.miles), from === 'SCL' ? 'CLP' : 'BRL'))).toString(),
              airlines: flightSegments[0].airline,
              sent: from === 'SCL' ? 'chile_group' : 'brasil_group',
              type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
              remaining: flightInfo.departure,
              link: ''
            });
          }
          break;
        case 'multiplus':
          if ((Number(flightInfo.miles) <= 44000 && cabinSelected == 'Basic') || Number(flightInfo.miles) <= 120000 && cabinSelected == 'Executive') {

            new AlertService().createAlert({
              affiliates_program: flightInfo.program,
              trip: flightSegments[0].origin.split('/')[1] + ' a ' + flightSegments[flightSegments.length - 1].destination.split('/')[1],
              route: from + ' -> ' + to,
              miles: Math.round(flightInfo.miles).toString(),
              amount: Math.round(Number(calculateMilesToCurrency('latam', Number(flightInfo.miles), from === 'SCL' ? 'CLP' : 'BRL'))).toString(),
              airlines: flightSegments[0].airline,
              sent: from === 'SCL' ? 'chile_group' : 'brasil_group',
              type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
              remaining: flightInfo.departure,
              link: ''
            });
          }
          break;

        default:
          break;
      }

      await browser.close();
      await delay(5000);
      await getTKmilhas();

    }

  } catch (error) {
    console.log('Erro na execução crawler' + error);
    await delay(5000);
    await browser?.close();
    await getTKmilhas();
  }
}

function gerarPeriodoAleatorio() {
  // Data atual
  const hoje = new Date();

  // Adicionar 5 meses à data atual
  const dataLimite = new Date();
  dataLimite.setMonth(hoje.getMonth() + 10);

  // Gerar uma data aleatória entre hoje e a data limite
  const dataInicioAleatoria = new Date(hoje.getTime() + Math.random() * (dataLimite.getTime() - hoje.getTime()));

  // Adicionar 15 dias à data de início
  const dataFimAleatoria = new Date(dataInicioAleatoria);
  dataFimAleatoria.setDate(dataFimAleatoria.getDate() + 15);

  return {
    inicio: dataInicioAleatoria.toISOString().split('T')[0], // Retorna no formato YYYY-MM-DD
    fim: dataFimAleatoria.toISOString().split('T')[0]        // Retorna no formato YYYY-MM-DD
  };
}


async function getTKmilhasNordeste() {
  let browser: any; // Declara o tipo de 'browser'

  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: [
        '--window-size=1920,1080',
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

    await page.locator('#mui-1').fill('potiguar.passagens@gmail.com');
    await delay(3000);

    await page.locator('#mui-2').fill('#Bob1234');
    await delay(3000);

    await page.locator('.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeLarge.MuiButton-containedSizeLarge.MuiButton-fullWidth.MuiButtonBase-root.css-1g8e2pa').click();
    await delay(3000);

    const buttonsToClick = ['azul', 'multiplus', 'smiles'];

    for (const program of buttonsToClick) {
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
        'FOR', 'NAT', 'REC', 'CPV', 'MCZ', 'SLZ', 'THE', 'AJU', 'FEN', 'SSA', 'JPA'
      ]

      const cabin = ['Basic'];
      const from: string = randomElement(brasilAeroportos);
      const to: string = randomElement(brasilAeroportos);

      console.log('-------------------------------');
      console.log('\n\nSaindo de: ' + from);
      console.log('Para: ' + to);
      console.log('Source: ' + program);

      if(from == to) {
        await page.locator(`button[value="${program}"]`).click();
        await delay(1000);
        continue;
      }

      await page.locator('.MuiInput-root.MuiInput-underline.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-fullWidth.MuiInputBase-formControl.css-3dr76p input[value="5"]').click();
      await page.keyboard.type('5');
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

      const cabinSelected = randomElement(cabin);

      await page.locator('#mui-7').click();
      await page.waitForSelector('ul.MuiMenu-list li', { timeout: 0 });
      await page.click(`ul.MuiMenu-list li[data-value="${cabinSelected}"]`);


      const month = randomElement([10, 11, 12, 1, 2, 3])

      const firstDayOfMonth = startOfMonth(new Date(month < 10 ? 2025 : 2024, month));

      const { inicio, fim } = gerarPeriodoAleatorio();
      // const endFirstWeek = endOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
      console.log('Periodo de viagem: ' + format(inicio, 'dd/MM/yyyy', { locale: ptBR }) + ' até ' + format(fim, 'dd/MM/yyyy', { locale: ptBR }))
      console.log('Data da busca: ' + format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }))

      await page.evaluate(() => {
        const buttons = document.querySelectorAll('.MuiToggleButtonGroup-root button');
        for (let button of buttons) {
          if (button.textContent?.trim() === 'ida e volta') {
            (button as HTMLElement).click();
            break;
          }
        }
      });
      await delay(3000);

      await page.locator('#abc').fill('');
      await delay(3000);
      await page.locator('#abc').fill(format(inicio, 'dd/MM/yyyy', { locale: ptBR }));
      await delay(3000);
      await page.locator('#bcd').fill('');
      await delay(3000);
      await page.locator('#bcd').fill(format(fim, 'dd/MM/yyyy', { locale: ptBR }));
      await delay(3000);

      await page.locator('.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeSmall.MuiButton-containedSizeSmall.MuiButtonBase-root.searchButton.css-1dpvzvp').click();
      console.log('Buscando...');

      await page.waitForFunction(() => !document.querySelector('.MuiSkeleton-root'), { timeout: 0 });

      const noFlightsFound = await page.evaluate(() => {
        const element = document.querySelector('.jss1') || document.querySelector('.jss49') || document.querySelector('.jss25');
        return element && element.textContent?.includes('Nenhum voo encontrado.');
      });

      if (noFlightsFound) {
        console.log('Nenhum voo encontrado para ' + program);
        await page.locator(`button[value="${program}"]`).click();
        await delay(1000);
        continue;
      }

      await page.waitForFunction(() => document.querySelector('.MuiAccordionSummary-gutters.css-1iji0d4'), { timeout: 0 });

      const mileElements = await page.$$eval('.MuiBox-root.css-1yaucul h4:nth-of-type(2)', (elements: any) =>
        elements.filter((f: any) => f.innerText !== 'Erro').map((el: any) => parseInt(el.innerText.replace(/\D/g, ''), 10))
      );

      console.log('Fim da busca.');

      if (mileElements.length == 0) {
        console.log('Nenhum voo encontrado para ' + program);
        await page.locator(`button[value="${program}"]`).click();
        await delay(1000);
        continue;
      }

      const flightSegments = await page.evaluate(async () => {
        const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

        const mileElements = document.querySelectorAll('.css-1iji0d4');

        const filteredElements = Array.from(mileElements).filter((element) => {
          const h4Elements = element.querySelectorAll('h4');

          return h4Elements[1]?.textContent !== 'Erro';
        });

        const allFlightSegments = [];

        for (let mileElement of filteredElements) {
          await delay(2000);

          (mileElement as HTMLElement).click();

          console.log(mileElement)
          const selector = 'div[aria-label="Clique para adicionar no orçamento e emissão."]';
          const addToBudgetButton = await new Promise((resolve) => {
            const interval = setInterval(() => {
              const button = document.querySelector(selector);
              if (button) {
                clearInterval(interval);
                resolve(button);
              }
            }, 100);
          });

          if (addToBudgetButton) {
            (addToBudgetButton as HTMLElement).click();
          } else {
            continue;
          }


          const buttonClicked = (() => {
            const buttonsOptions = Array.from(document.querySelectorAll('button'));
            for (let button of buttonsOptions) {
              if (button.textContent?.includes('Copiar dados Voo')) {
                (button as HTMLElement).click();
                return true;
              }
            }
            return false;
          })();


          if (!buttonClicked) {
            continue;
          }

          const copiedData = await navigator.clipboard.readText();

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

          const flightInfo = {
            program: (document.querySelector('.MuiTableHead-root .flight-table-header td:nth-of-type(1)') as any)?.innerText || null,
            class: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(1) .MuiTypography-button') as any)?.innerText || null,
            departure: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(3) .MuiTypography-button') as any)?.innerText || null,
            flight: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(5) .MuiTypography-button') as any)?.innerText || null,
            miles: mileElement.textContent?.split('2024')[1] || mileElement.textContent?.split('2025')[1] || null,
            flightSegments
          };

          allFlightSegments.push(flightInfo);

          (mileElement as HTMLElement).click();
        }

        return allFlightSegments;
      });

      console.log(flightSegments)

      let dateFrom = 'IDA: \n\n';
      let dateTo = 'VOLTA: \n\n';

      let smallestElement = flightSegments[0];

      for (let index = 0; index < flightSegments.length; index++) {
        const element = flightSegments[index];

        const miles = element.miles.replace('.', '')

        switch (program) {
          case 'azul':
            if (Number(miles) <= 8000) {
              if (index <= 5) {
                dateFrom += `${element.departure} (${element.miles} milhas)\n`
              } else {
                dateTo += `${element.departure} (${element.miles} milhas)\n`
              }
            }

            break;
          case 'multiplus':
            if (Number(miles) <= 10000) {
              if (index <= 5) {
                dateFrom += `${element.departure} (${element.miles} milhas)\n`
              } else {
                dateTo += `${element.departure} (${element.miles} milhas)\n`
              }
            }

            break;
          case 'smiles':
            if (Number(miles) <= 18000) {
              if (index <= 5) {
                dateFrom += `${element.departure} (${element.miles} milhas)\n`
              } else {
                dateTo += `${element.departure} (${element.miles} milhas)\n`
              }
            }

            break;

          default:
            break;
        }

        if (element.miles && smallestElement.miles && parseInt(element.miles) < parseInt(smallestElement.miles)) {
          smallestElement = element;
        }
      }
      if (smallestElement.miles) {

        const miles = smallestElement.miles.replace('.', '')

        switch (program) {
          case 'azul':
            if (Number(miles) <= 8000) {
              const json = {
                affiliates_program: program,
                trip: from + ' -> ' + to,
                route: 'Nacional',
                miles: smallestElement.miles,
                amount: Math.round(Number(calculateMilesToCurrency(program, Number(miles), 'BRL'))).toString(),
                airlines: smallestElement.flightSegments[0].airline,
                sent: 'brasil_group',
                type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
                remaining: dateFrom + '\n' + dateTo,
                link: ''
              }
              new AlertService().createAlert(json);

              console.log(json)
            }

            break;
          case 'multiplus':
            if (Number(miles) <= 10000) {
              const json = {
                affiliates_program: program,
                trip: from + ' -> ' + to,
                route: 'Nacional',
                miles: smallestElement.miles,
                amount: Math.round(Number(calculateMilesToCurrency(program, Number(miles), 'BRL'))).toString(),
                airlines: smallestElement.flightSegments[0].airline,
                sent: 'brasil_group',
                type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
                remaining: dateFrom + '\n' + dateTo,
                link: ''
              }
              new AlertService().createAlert(json);

              console.log(json)
            }

            break;
          case 'smiles':
            if (Number(miles) <= 18000) {
              const json = {
                affiliates_program: program,
                trip: from + ' -> ' + to,
                route: 'Nacional',
                miles: smallestElement.miles,
                amount: Math.round(Number(calculateMilesToCurrency(program, Number(miles), 'BRL'))).toString(),
                airlines: smallestElement.flightSegments[0].airline,
                sent: 'brasil_group',
                type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
                remaining: dateFrom + '\n' + dateTo,
                link: ''
              }
              new AlertService().createAlert(json);

              console.log(json)
            }

            break;

          default:
            break;
        }

      }


      await page.locator(`button[value="${program}"]`).click();

      await delay(1000);
    }

    await browser.close();
    await delay(5000);
    await getTKmilhasNordeste();


  } catch (error) {
    console.log('Erro na execução crawler' + error);
    await delay(5000);
    await browser?.close();
    await getTKmilhasNordeste();
  }
}


async function getTKmilhasEndpoint(from: string, to: string, cabin: string, date_departure: string, date_return: string) {
  moment.locale('pt-br')

  let browser;
  try {


    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--window-size=1920,1080',
      ],
      executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
      protocolTimeout: 0,
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

    const buttonsToClick = ['multiplus', 'smiles'];
    const program = randomElement(buttonsToClick);
    const selector = `button[value="${program}"]`;
    await page.locator(selector).click();
    await delay(1000);

    // Scroll down the page to load more content
    await page.evaluate(async () => {
      let scrollPosition = 0;
      let documentHeight = document.body.scrollHeight;

      while (documentHeight > scrollPosition) {
        window.scrollBy(0, documentHeight);
        await new Promise(resolve => setTimeout(resolve, 1000));
        scrollPosition = documentHeight;
        documentHeight = document.body.scrollHeight;
      }
    });

    console.log('\n\nSaindo de: ' + from);
    console.log('Para: ' + to);
    console.log('\nSource: ' + program);

    await page.locator('.MuiInput-root.MuiInput-underline.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-fullWidth.MuiInputBase-formControl.css-3dr76p input[value="5"]').click();
    await page.keyboard.type('5');
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

    const cabinSelected = cabin === 'economy' ? 'Basic' : 'Executive';
    console.log('Selecionado: ' + cabin);

    await page.locator('#mui-7').click();
    await page.waitForSelector('ul.MuiMenu-list li', { timeout: 0 });
    await page.click(`ul.MuiMenu-list li[data-value="${cabinSelected}"]`);

    console.log('Data da Busca: ' + moment(date_departure).format('L') + ' até ' + moment(date_return).format('L'));

    await page.evaluate(() => {
      const buttons = document.querySelectorAll('.MuiToggleButtonGroup-root button');
      for (let button of buttons) {
        if (button.textContent?.trim() === 'ida e volta') {
          (button as HTMLElement).click();
          break;
        }
      }
    });
    await delay(3000);

    await page.locator('#abc').fill('');
    await delay(3000);
    await page.locator('#abc').fill(moment(date_departure).format('L'));
    await delay(3000);
    await page.locator('#bcd').fill('');
    await delay(3000);
    await page.locator('#bcd').fill(moment(date_return).format('L'));
    await delay(3000);

    await page.locator('.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeSmall.MuiButton-containedSizeSmall.MuiButtonBase-root.searchButton.css-1dpvzvp').click();
    console.log('Buscando...');

    await page.waitForFunction(() => !document.querySelector('.MuiSkeleton-root'), { timeout: 0 });

    await page.waitForFunction(() => document.querySelector('.MuiAccordionSummary-gutters.css-1iji0d4'), { timeout: 0 });


    const flightSegments = await page.evaluate(async () => {
      const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

      const mileElements = document.querySelectorAll('.css-1iji0d4');
      const allFlightSegments = [];

      for (let mileElement of mileElements) {
        await delay(2000);

        (mileElement as HTMLElement).click();

        console.log(mileElement)
        const selector = 'div[aria-label="Clique para adicionar no orçamento e emissão."]';
        const addToBudgetButton = await new Promise((resolve) => {
          const interval = setInterval(() => {
            const button = document.querySelector(selector);
            if (button) {
              clearInterval(interval);
              resolve(button);
            }
          }, 100);
        });

        if (addToBudgetButton) {
          (addToBudgetButton as HTMLElement).click();
        } else {
          continue;
        }


        const buttonClicked = (() => {
          const buttonsOptions = Array.from(document.querySelectorAll('button'));
          for (let button of buttonsOptions) {
            if (button.textContent?.includes('Copiar dados Voo')) {
              (button as HTMLElement).click();
              return true;
            }
          }
          return false;
        })();


        if (!buttonClicked) {
          continue;
        }

        const copiedData = await navigator.clipboard.readText();

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

        const flightInfo = {
          program: (document.querySelector('.MuiTableHead-root .flight-table-header td:nth-of-type(1)') as any)?.innerText || null,
          class: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(1) .MuiTypography-button') as any)?.innerText || null,
          departure: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(3) .MuiTypography-button') as any)?.innerText || null,
          flight: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(5) .MuiTypography-button') as any)?.innerText || null,
          miles: mileElement.textContent?.split('2024')[1] || null,
          flightSegments
        };

        allFlightSegments.push(flightInfo);

        (mileElement as HTMLElement).click();
      }

      return allFlightSegments;
    });

    console.log(flightSegments)

    let dateFrom = 'IDA: \n\n';
    let dateTo = 'VOLTA: \n\n';

    let smallestElement = flightSegments[0];

    for (let index = 0; index < flightSegments.length; index++) {
      const element = flightSegments[index];

      if (index <= 5) {
        dateFrom += `${element.departure} (${element.miles} mil milhas)\n`
      } else {
        dateTo += `${element.departure} (${element.miles} mil milhas)\n`
      }

      if (element.miles && smallestElement.miles && parseInt(element.miles) < parseInt(smallestElement.miles)) {
        smallestElement = element;
      }
    }
    if (smallestElement.miles) {

      const miles = smallestElement.miles.replace('.', '')

      if (Number(miles) <= 10000) {
        const json = {
          affiliates_program: smallestElement.program,
          trip: from + '->' + to,
          route: 'Nacional',
          miles: smallestElement.miles,
          amount: Math.round(Number(calculateMilesToCurrency('multiplus', Number(smallestElement.miles), 'BRL'))).toString(),
          airlines: smallestElement.flightSegments[0].airline,
          sent: 'brasil_group',
          type_trip: cabinSelected == 'Basic' ? 'Econômica' : 'Executiva',
          remaining: dateFrom + '\n' + dateTo,
          link: ''
        }
        new AlertService().createAlert(json);

        console.log(json)
      }
    }
  } catch (error) {
    console.log('Erro na execução crawler: ' + error);
    await delay(5000);
    await browser?.close();
  }
}

async function getAzul() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--window-size=1920,1080',
    ],
    executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
    protocolTimeout: 0
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Browser.grantPermissions', {
    origin: "https://passagens.voeazul.com.br/pt/buscador-de-precos#comparador",
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  });

  await page.goto('https://passagens.voeazul.com.br/pt/buscador-de-precos#comparador', { timeout: 0 });

  await page.waitForSelector('#sfm-origin-667b2ae631c61602ee016857-input');
  await page.type('#sfm-origin-667b2ae631c61602ee016857-input', 'NAT');
  await page.keyboard.press("Enter")

  // await page.waitForSelector('#sfm-destination-667b2ae631c61602ee016857-input');
  // await page.type('#sfm-destination-667b2ae631c61602ee016857-input', 'GRU');
  await page.waitForSelector('div[data-test="card-container"]');

  const flightData = await page.$$eval('div[data-test="card-container"]', cards => {
    return cards.map(card => {
      const origin = (card.querySelector('p[data-test="origin-text"]') as any)?.innerText || '';
      const destination = (card.querySelector('div[data-test="destination-text"]') as any)?.innerText || '';
      const date = (card.querySelector('div[data-test="dates"]') as any)?.innerText.trim() || '';
      const flightType = (card.querySelector('p[data-test="flight-type"]') as any)?.innerText || '';
      const travelClass = (card.querySelector('p[data-test="travel-class"]') as any)?.innerText || '';
      const price = (card.querySelector('div[data-test="price"]') as any)?.innerText.replace('*', '').trim() || '';
      const lastSeen = (card.querySelector('div[data-test="last-seen"]') as any)?.innerText.replace('Visto:', '').trim() || '';

      return {
        origin,
        destination,
        date,
        flightType,
        travelClass,
        price,
        lastSeen
      };
    });
  });

  console.log(flightData);

}

// async function getLatam() {

//   let dadosFinais = [];

//   let maxTentativas = proxiesLista.length;
//   let tentativas = 0;
//   let deuCerto = false;


//   while (!deuCerto && tentativas < maxTentativas) {

//     try {

//       const proxy = proxiesLista[tentativas];
//       tentativas++;
//       const result = await this.consultaVoos(origem, destino, data, url, proxy, index_voo);

//       if (result.status === "Ok") {
//         deuCerto = true;
//         dadosFinais.push(result.dados);
//         return await this.formatar(dadosFinais[0]);
//       }

//     } catch (erro) {
//       console.error(`Tentativa ${tentativas} falhou: ${erro.message}`);
//       if (tentativas >= maxTentativas) {
//         return { erro: 'Falha ao consultar voos após várias tentativas.', code: 500 };
//       }
//     }
//   }
// }

// async function consultaVoosLatam(aero1: string, aero2: string, data: string, url: string, proxy: string, index = 0) {
//   let browser;

//   try {

//     browser = await puppeteer.launch({ headless: false, args: [`${proxy}`] });
//     const page = await browser.newPage();

//     await page.goto(url);

//     await page.waitForSelector("#mat-tab-label-0-1", { timeout: 2000 })

//     await page.click("#mat-tab-label-0-1");


//     await new Promise(resolve => setTimeout(resolve, 2000));
//     await page.type('#mat-mdc-chip-list-input-2', aero1); // Origem
//     await page.keyboard.press("ArrowDown")
//     await page.keyboard.press("Enter")
//     await new Promise(resolve => setTimeout(resolve, 2000));
//     await page.type('#mat-mdc-chip-list-input-3', aero2); // Destino
//     await page.keyboard.press("ArrowDown")
//     await page.keyboard.press("Enter")
//     await new Promise(resolve => setTimeout(resolve, 2000));
//     await page.type('#mat-input-12', data);
//     await page.keyboard.press("Enter")

//     await page.waitForSelector('mat-select[formcontrolname="cabin"]');

//     await page.click('mat-select[formcontrolname="cabin"]');


//     await page.waitForSelector('mat-option');


//     const options = await page.$$('mat-option');

//     let contador = 0;


//     for (let option of options) {

//       if (contador === index) {

//         await option.click();

//         const selectedValue = await page.$eval('.mat-mdc-select-value-text span', el => el.textContent);
//         console.log("Valor selecionado: ", selectedValue);

//         await page.click('mat-select[formcontrolname="cabin"]');



//         await page.waitForSelector('mat-option');
//       }

//       contador++;

//     }

//     await page.keyboard.press("Enter")
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     await page.click('button[type="submit"]');

//     await page.waitForSelector("table tr", { timeout: 60000 })
//     await new Promise(resolve => setTimeout(resolve, 1000));

//     //const classes = ["Econômica", "Econômica Premium", "Executiva", "Primeira Classe"];

//     const tabelaDados = await page.evaluate((indexNum, date, classe) => {

//       const rows = document.querySelectorAll("table tr");
//       let dados = [];


//       rows.forEach(row => {

//         const cells = row.querySelectorAll("td");
//         let rowDados = {};

//         if (cells.length > 0) {


//           if (cells[0].innerText != "" && cells[1].innerText === "LATAM") {
//             rowDados.price = cells[0].innerText;
//             rowDados.airline = cells[1].innerText;
//             rowDados.depart = cells[2].innerText;
//             rowDados.arrive = cells[3].innerText;
//             rowDados.duration = cells[4].innerText;
//             rowDados.fromTo = cells[5].innerText;
//             rowDados.stops = cells[6].innerText;
//             rowDados.advisory = cells[7].innerText;
//             rowDados.classe = classe[indexNum];
//             rowDados.data = date
//             //rowDados.teste = `${classes[indexNum]}-`



//             dados.push(rowDados);

//           }
//         }
//       });

//       return dados;
//     }, index, data, classes);

//     //console.log(tabelaDados);

//     await browser.close()



//     return { dados: tabelaDados, status: "Ok", mensage: "Tudo_OK", code: 200 };

//   } catch (Oerro) {

//     console.log(Oerro)

//     return { dados: 0, status: "ERRO", mensage: Oerro, code: 500 }

//   } finally {
//     if (browser) await browser.close()

//   }
// }

export default { getTKmilhas, getTKmilhasEndpoint, getTKmilhasNordeste, getAzul }