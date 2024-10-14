import { brasilAeroportos } from "../../../util";
import config from "./config";

const puppeteer = require('puppeteer');
const fs = require("fs")
const path = require("path")


function teste() {

  return "Testado";

}

async function formatar(dados: any) {

  let resultado = []

  let valorPorMilhereiro = await converteMilhas() as number;

  for (let i in dados) {

    let result: any = {};
    let procura = resultado.find(obj => obj.type_trip === dados[i].classe);

    let from = dados[i].fromTo;








    if (!procura) {
      // console.log(dados[i])

      result.affiliates_program = "Multiplus"
      result.trip = from.replace("to", "->")
      result.route = isNacional(from)
      result.miles = valorPorMilhereiro * converteValor(dados[i].price)
      result.amount = converteValor(dados[i].price)
      result.airlines = "LATAM"
      result.sent = result.route == "Nacional" ? "brasil_group" : ""
      result.type_trip = dados[i].classe
      result.remaining = [`${dados[i].data} ${dados[i].depart} (${valorPorMilhereiro * converteValor(dados[i].price)})`]

      resultado.push(result)
    } else {
      procura.remaining.push(`${dados[i].data} ${dados[i].depart} (${valorPorMilhereiro * converteValor(dados[i].price)})`);

    }




  }

  //console.log(resultado);



  return resultado;


}

function isNacional(dado: any) {
  let cont = 0;
  let novaArr = dado.split(" to ");
  for (let a = 0; a < 2; a++) {

    for (let i in brasilAeroportos) {
      //console.log(i)
      if (novaArr[a] == brasilAeroportos[i]) {

        cont++;

      }



    }


  }

  if (cont === 1) {

    //console.log("Internacional")
    return "Internacional";
  } else {
    //console.log("Nacional")
    return "Nacional";

  }

  // Se os 2 elementos pertecem ao array é nacional 
  // Se 1 não pertencer então é internacional 
}

function converteValor(valor: any) {

  valor = valor.replace('R$', '').trim();

  valor = valor.replace(/\./g, '');

  valor = valor.replace(',', '.');

  return parseFloat(valor);

}

async function converteMilhas() {

  let browser;
  let valor: any;
  let result;
  try {

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://cotacaomilhas.com.br/', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.brz-row__container');

    const milhasInfo = await page.evaluate(() => {
      const info: { airline: string; programa: string; preco: string; qtdMilhas: number; }[] = [];
      const columns = document.querySelectorAll('.brz-column__items');

      columns.forEach(column => {
        const airline = column.querySelector('h2') ? column.querySelector('h2')?.innerText : null;
        const programa = column.querySelector('h6') ? column.querySelector('h6')?.innerText : null;
        const preco = column.querySelector('p') ? column.querySelector('p')?.innerText : null;
        const qtdMilhas = 10000

        if (airline && programa && preco) {
          info.push({
            airline,
            programa,
            preco,
            qtdMilhas
          });
        }
      });

      return info;
    });

    for (let i in milhasInfo) {
      if (milhasInfo[i].airline === "Latam") {
        valor = converteValor(milhasInfo[i].preco);
      }
    }


    await browser.close();
    result = (valor * 1000) / 10000;

    return result;

  } catch (erro) {

    console.error(` Erro ao consultar as milhas: ${erro}`);


    // return { erro: `Erro ao consultar milhas: ${erro}`, code: 500 };



  } finally {

    if (browser) await browser.close()
  }



}


//multiproxies
async function iceBerg(origem: any, destino: any, data: any, url: any, proxies: string | any[], index_voo = 0) {


  let dadosFinais = [];


  let maxTentativas = proxies.length;
  let tentativas = 0;
  let deuCerto = false;



  while (!deuCerto && tentativas < maxTentativas) {

    try {

      const proxy = proxies[tentativas];
      tentativas++;



      const result = await consultaVoos(origem, destino, data, url, proxy, index_voo);

      if (result.status === "Ok") {
        deuCerto = true;

        dadosFinais.push(result.dados);

        return await formatar(dadosFinais[0]);

      }


    } catch (erro) {

      // console.error(`Tentativa ${tentativas} falhou: ${erro.message}`);


      // Se atingiu o número máximo de tentativas, retorna o erro
      if (tentativas >= maxTentativas) {
        return { erro: 'Falha ao consultar voos após várias tentativas.', code: 500 };
      }

    }



  }





}

async function consultaVoos(aero1: any, aero2: any, data: any, url: any, proxy: any, index = 0) {
  let browser;

  try {


    browser = await puppeteer.launch({ headless: false, args: [`${proxy}`] });
    const page = await browser.newPage();


    await page.goto(url);

    await page.waitForSelector("#mat-tab-label-0-1", { timeout: 2000 })

    await page.click("#mat-tab-label-0-1");


    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.type('#mat-mdc-chip-list-input-2', aero1); // Origem
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.type('#mat-mdc-chip-list-input-3', aero2); // Destino
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.type('#mat-input-12', data);
    await page.keyboard.press("Enter")

    await page.waitForSelector('mat-select[formcontrolname="cabin"]');

    await page.click('mat-select[formcontrolname="cabin"]');


    await page.waitForSelector('mat-option');


    const options = await page.$$('mat-option');

    let contador = 0;


    for (let option of options) {

      if (contador === index) {

        await option.click();

        const selectedValue = await page.$eval('.mat-mdc-select-value-text span', (el: { textContent: any; }) => el.textContent);
        console.log("Valor selecionado: ", selectedValue);

        await page.click('mat-select[formcontrolname="cabin"]');



        await page.waitForSelector('mat-option');
      }

      contador++;

    }

    await page.keyboard.press("Enter")
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.click('button[type="submit"]');

    await page.waitForSelector("table tr", { timeout: 60000 })
    await new Promise(resolve => setTimeout(resolve, 1000));

    //const classes = ["Econômica", "Econômica Premium", "Executiva", "Primeira Classe"];

    const tabelaDados = await page.evaluate((indexNum: string | number, date: any, classe: { [x: string]: any; }) => {

      const rows = document.querySelectorAll("table tr");
      let dados: {}[] = [];


      rows.forEach(row => {

        const cells = row.querySelectorAll("td");
        let rowDados: any = {};

        if (cells.length > 0) {


          if (cells[0].innerText != "" && cells[1].innerText === "LATAM") {
            rowDados.price = cells[0].innerText;
            rowDados.airline = cells[1].innerText;
            rowDados.depart = cells[2].innerText;
            rowDados.arrive = cells[3].innerText;
            rowDados.duration = cells[4].innerText;
            rowDados.fromTo = cells[5].innerText;
            rowDados.stops = cells[6].innerText;
            rowDados.advisory = cells[7].innerText;
            rowDados.classe = classe[indexNum];
            rowDados.data = date
            //rowDados.teste = `${classes[indexNum]}-`



            dados.push(rowDados);

          }
        }
      });

      return dados;
    }, index, data, config.classes);

    //console.log(tabelaDados);

    await browser.close()



    return { dados: tabelaDados, status: "Ok", mensage: "Tudo_OK", code: 200 };

  } catch (Oerro) {

    console.log(Oerro)

    return { dados: 0, status: "ERRO", mensage: Oerro, code: 500 }

  } finally {
    if (browser) await browser.close()

  }


}

async function logs(dado: any, setor: any) {

  let setorr = setor
  let aData = `${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}T${new Date().getHours()}-${new Date().getMinutes()}-${new Date().getSeconds()}`

  let nome = `log-${setorr}-${aData}`

  const pastaLogs = path.join(__dirname, `logs/`);

  if (!fs.existsSync(pastaLogs)) {
    fs.mkdirSync(pastaLogs, { recursive: true });
  }

  let novaPasta = path.join(pastaLogs, nome)

  await criarArquivoJSON(dado, novaPasta)





}

async function criarArquivoJSON(dado: any, nomeArquivo: any) {


  const dadosJson = JSON.stringify(dado, null, 2);

  fs.writeFile(`${nomeArquivo}.txt`, dadosJson, (err: any) => {
    if (err) {
      console.log("ERRO ao salvar o arquivo: ", err);
      return err;

    } else {
      //console.log("Criado com sucesso!");
      return 200;
    }
  })


}



export default {
  formatar,
  isNacional,
  converteValor,
  converteMilhas,
  iceBerg,
  consultaVoos,
  logs,
  criarArquivoJSON
}
