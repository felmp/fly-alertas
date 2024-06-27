import { FastifyInstance } from "fastify";
import { formatMessageText } from "./util/format-model";
import { GroupMessage } from "./models/group-message.model";
import { wpp } from "./axios";

export async function routes(fastify: FastifyInstance) {
  fastify.post('/webhook', async (request, res) => {
    const payload = request.body as GroupMessage;

    console.log(payload);

    if (payload.contact.friendly_name == 'Flyalertas Diretoria \ud83d\uddfa\ufe0f' || payload.contact.friendly_name == 'Flyalertas Diretoria') {

      if (payload.message.text == '/bot') {
        var data = JSON.stringify({
          "to_group_uuid": "WAG24e12bd3-a970-4272-9ebc-dcded2a5c6e1",
          "from_number": "+5579920012363",
          "text": 'Como posso ajudar?'
        });

        wpp.post('open/whatsapp/send-message', data)
          .then(function (response) {
            res.send(JSON.stringify(response.data))
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    }

    const padrao = /(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n((.*?)📈|📈)(.*?)\n🛫(.*?)\n/
    const padrao2 = /(.*?)\n(🌍|🌎)(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n/

    const verifica_padrao = padrao.test(payload.message.text) || padrao2.test(payload.message.text);
    if (verifica_padrao && payload.contact.friendly_name == 'Espelho Emissões Y1') {

      await formatMessageText(payload.message.text)
    }

  })
}