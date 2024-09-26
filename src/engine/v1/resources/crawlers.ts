import puppeteer from "puppeteer";
import delay from "../../../util/delay";
import { randomElement } from "../../../util/random-element";
import { randomDate } from "../../../util/random-date";
import moment from "moment";
import axios from "axios";
import { AlertService } from "../../../services/alert.service";
import calculateMilesToCurrency from "../../../util/conversor";

async function getTKmilhas() {
  let browser
  let change_search
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

    // airports_from = [
    //       'CWB', 
    //     ];

    // if (change_search == 'BR') {
    //   airports_from = [
    //     'FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'
    //   ];

    //   change_search = 'CH'
    // } else if (change_search == 'CH') {
    //   airports_from = [
    //     'SCL'
    //   ];

    //   change_search = 'BR'
    // }

    airports_from = [
      'FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU', 'GIG'
    ];

    const airports_to = [
      'LIS', 'WAS', 'PAR', 'SEL',
      'MAD', 'HND', 'CHI', 'LAX', 'ORL',
      'NYC', 'MIL', 'BUE', 'LON',
      'IAH', 'LIM', 'JFK', 'GIG',
      'FOR', 'NAT', 'SAO', 'REC', 'MCZ', 'RIO', 'CNF', 'BSB', 'AJU', 'GRU'
    ];

    const cabin = ['Executive', 'Basic'];

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

            // const link = `https://www.smiles.com.br/mfe/emissao-passagem/?adults=1&cabin=${cabinSelected == 'Basic' ? 'ECONOMIC' : 'BUSINESS'}&children=0&infants=0&isElegible=false&isFlexibleDateChecked=false&searchType=g3&segments=1&originAirportIsAny=true&destinAirportIsAny=true&novo-resultado-voos=true&departureDate=${millisecondsData}&tripType=2&originAirport=${from}&destinationAirport=${to}`;

            // const response = await axios.post('https://api.encurtador.dev/encurtamentos', { "url": link })

            // if (response.data) {
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
            // }

          }
          break;
        case 'multiplus':
          if ((Number(flightInfo.miles) <= 85000 && cabinSelected == 'Basic') || Number(flightInfo.miles) <= 120000 && cabinSelected == 'Executive') {
            // const departureDate = moment(flightInfo.departure, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD');

            // const link = `https://www.latamairlines.com/br/pt/oferta-voos?origin=${from}&outbound=${departureDate}T00:00:00.000Z&destination=${to}&inbound=undefined&adt=1&chd=0&inf=0&trip=OW&cabin=${cabinSelected == 'Basic' ? 'Economy' : 'Business'}&redemption=true&sort=RECOMMENDED`

            // const response = await axios.post('https://api.encurtador.dev/encurtamentos', { "url": link })

            // if (response.data) {
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
            // }
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

async function getTKmilhasEndpoint(from: string, to: string, cabin: string, date_departure: string, date_return: string) {
  moment.locale('pt-br')

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
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

    const buttonsToClick = ['smiles'];
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
      const mileElements = document.querySelectorAll('.css-1iji0d4');
      const allFlightSegments = [];

      for (let mileElement of mileElements) {
        (mileElement as HTMLElement).click();

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

        // Certifique-se de que está criando um novo objeto `flightInfo` para cada iteração
        const flightInfo = {
          program: (document.querySelector('.MuiTableHead-root .flight-table-header td:nth-of-type(1)') as any)?.innerText || null,
          class: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(1) .MuiTypography-button') as any)?.innerText || null,
          departure: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(3) .MuiTypography-button') as any)?.innerText || null,
          flight: (document.querySelector('.MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:nth-of-type(5) .MuiTypography-button') as any)?.innerText || null,
          miles: mileElement.textContent?.split('2024')[1] || null,
          flightSegments
        };

        allFlightSegments.push(flightInfo); // Armazena o objeto clonado em vez de sobrescrever o original
      }

      return allFlightSegments;
    });

    return flightSegments

  } catch (error) {
    console.log('Erro na execução crawler: ' + error);
    await delay(5000);
    await browser?.close();
  }
}

export default { getTKmilhas, getTKmilhasEndpoint }