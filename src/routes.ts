import { FastifyInstance, FastifyRequest } from "fastify";
import { formatMessageText } from "./util/format-model";
import { GroupMessage } from "./models/group-message.model";
import { AlertService } from "./services/alert.service";
import { wpp } from "./axios";
import engineV1 from "./engine/v1";

export async function routes(fastify: FastifyInstance) {
  fastify.post('/webhook', async (request, res) => {
    const payload = request.body as GroupMessage;

    const padrao = /(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n((.*?)📈|📈)(.*?)\n🛫(.*?)\n/
    const padrao2 = /(.*?)\n(🌍|🌎)(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n/

    const verifica_padrao = padrao.test(payload.message.text) || padrao2.test(payload.message.text);
    if (verifica_padrao && payload.contact.friendly_name == 'Espelho Emissões Y1') {
      await formatMessageText(payload.message.text)
    }
  })

  fastify.get('/alerts', async (req, res) => {
    const alerts = await new AlertService().getAlerts();

    res.send(alerts);
  })

  fastify.get('/alerts/total', async (req, res) => {
    const total_alerts = await new AlertService().getTotalAlerts();

    res.send(total_alerts)
  })

  fastify.get('/participants/total', async (req, res) => {
    wpp.get('open/whatsapp/group/WAGb20bcd1c-1bfd-447a-bc33-594a10952708').then((response) => {
      res.send(response.data)
    })
  })

  interface SearchRequestBody {
    origin: string;
    destination: string;
    date: {
      from: string;
      to: string;
    };
    cabin: string;
  }

  fastify.post('/search', async (req, res) => {
    const body = req.body as SearchRequestBody;

    const engine_v1 = new engineV1();
    // engine_v1.getTKmilhasEndpoint(body.origin, body.destination, body.cabin, body.date.from, body.date.to)
    // res.send(alert)
  })
}
