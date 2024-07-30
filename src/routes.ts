import { FastifyInstance } from "fastify";
import { formatMessageText } from "./util/format-model";
import { GroupMessage } from "./models/group-message.model";
import { wpp } from "./axios";
import { AlertService } from "./services/alert.service";

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

  fastify.post('/webhook-teste', async (request, res) => {
    const payload = request.body;

    console.log(payload)

  })
}
