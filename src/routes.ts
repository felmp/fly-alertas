import { FastifyInstance } from "fastify";
import { formatMessageText } from "./util/format-model";
import { GroupMessage } from "./models/group-message.model";
import { wpp } from "./axios";

export async function routes(fastify: FastifyInstance) {
  let sessions = {} as any;

  fastify.post('/webhook', async (request, res) => {
    const payload = request.body as GroupMessage;

    console.log(sessions)

    if (payload.contact.friendly_name.includes('Flyalertas Diretoria') && payload.message.text.trim() === '/bot') {
      sessions[payload.participant.phone_number] = {
        active: true,
        stage: 'menu'
      };

      const menu = "—————— MENU ENGINE V1 ——————\n\n"
        + "  1. Criar alerta manual\n\n"
        + "—————————————————————";

      var data = JSON.stringify({
        "to_group_uuid": "WAG24e12bd3-a970-4272-9ebc-dcded2a5c6e1",
        "from_number": '+5579920012363',
        "text": menu
      });

      wpp.post('open/whatsapp/send-message', data)
        .then(function (response) {
          res.send(JSON.stringify(response.data));
        })
        .catch(function (error) {
          console.log(error);
        });

    } else if (sessions[payload.participant.phone_number] && sessions[payload.participant.phone_number].active) {
      switch (sessions[payload.participant.phone_number].stage) {
        case 'menu':
          if (payload.message.text == '1') {
            var data = JSON.stringify({
              "to_group_uuid": "WAG24e12bd3-a970-4272-9ebc-dcded2a5c6e1",
              "from_number": '+5579920012363',
              "text": "⚠️ EM MANUTENÇÃO"
            });

            wpp.post('open/whatsapp/send-message', data)
              .then(function (response) {
                res.send(JSON.stringify(response.data));
              })
              .catch(function (error) {
                console.log(error);
              });
          }
          break;
        default:
          break;
      }

      if (payload.message.text.trim() === '/sair') {
        delete sessions[payload.participant.phone_number];
        console.log(`Sessão finalizada para ${payload.participant.phone_number}`);
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
