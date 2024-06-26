import { engine_v1 } from '../../axios';
import { sendDefaultMessage } from '../../message-senders/sender-group-default';
import prismaClient from '../../prisma';

class engineV1 {
  interval: any;
  is_running: boolean;

  constructor() {
    this.is_running = false;
    this.interval = null;
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
💰 ${alert.miles?.trim()}
🛫 Companhia Aérea: ${alert.airlines?.trim()}
💺 Classe: ${alert.type_trip?.trim()}
🗓️  Alerta de Data : ${alert.remaining}
_Não tem milhas ? Nós te ajudamos com essa emissão !_`;


      sendDefaultMessage(formattedText)

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

  // async getSeatsAero() {
  //   engine_v1.get
  // }

  
}

export default engineV1