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

  start() {
    if (!this.is_running) {
      this.is_running = true;
      this.interval = setInterval(() => queues.processQueue(), 5000);
      setInterval(() => queues.processQueueSeatsAero(), 3600000);
      setInterval(() => seatsAero.getSeatsAeroBrasil(), 2200000);
      seatsAero.getSeatsAeroBrasil()
      // crawlers.getTKmilhas();

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
}

export default engineV1