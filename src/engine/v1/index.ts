import { wpp } from '../../axios';
import { AlertService } from '../../services/alert.service';
import seatsAero from './resources/seats-aero';
import queues from './resources/queues';
import crawlers from './resources/crawlers';

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

  // await page.locator('#mui-1').fill('ruan_jtl@hotmail.com');
  // await page.locator('#mui-1').fill('potiguar.passagens@gmail.com');

  // await page.locator('#mui-2').fill('Isabel%2936');
  // await page.locator('#mui-2').fill('#Bob1234');

  start() {
    if (!this.is_running) {
      this.is_running = true;
      // this.interval = setInterval(() => queues.processQueue(), 5000);
      setInterval(() => queues.processQueueSeatsAero(), 3600000);
      setInterval(() => seatsAero.getSeatsAeroBrasil(), 2200000);
      queues.processQueueSeatsAero()

      // crawlers.getTKmilhasNordeste();
      // crawlers.getAzul();
      // this.maintenance()
      console.log('Fila de alertas iniciada.');
    }

  }

  async test() {
    new AlertService().createAlert({
      affiliates_program: 'Aeroplan',
      trip: 'Belo Horizonte para Curacao',
      route: 'Internacional',
      miles: '50000',
      amount: '',
      airlines: 'Air Canada',
      sent: 'brasil_group',
      type_trip: 'Executiva',
      remaining: '21/12/2024',
      link: 'link'
    });
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
      "to_group_uuid": "WAG2a2d7898-305f-4b21-8528-b26f36f3a342",
      "from_number": "+5579920012363",
      "text": `🚨 Aviso de Manutenção 🚨
Olá, viajantes!

Só um aviso rápido: estamos preparando algumas melhorias no nosso sistema de alertas de milhas para trazer novidades incríveis! Por isso, teremos uma manutenção, a partir das 16:00. Durante esse tempinho, os alertas de milhas podem dar uma pausa, mas fique tranquilo(a), será por uma boa causa! 😉

Assim que terminarmos, você pode esperar por excelentes alertas de viagens que estamos preparando especialmente para você.

Obrigado pela paciência e continue de olho para não perder as melhores oportunidades! ✈️

Abraços,
Equipe FlyAlertas`
    });

    wpp.post('open/whatsapp/send-message', data)
      .then(function (response) {
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}

export default engineV1