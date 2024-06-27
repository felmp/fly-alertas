import { FastifyInstance } from "fastify";
import { formatMessageText } from "./util/format-model";
import { GroupMessage } from "./models/group-message.model";
import { wpp } from "./axios";
import { AlertService } from "./services/alert.service";

export async function routes(fastify: FastifyInstance) {
  let sessions = {} as any;

  fastify.post('/webhook', async (request, res) => {
    const payload = request.body as GroupMessage;

    if (payload.contact.friendly_name.includes('Flyalertas Diretoria') && payload.message.text.trim() === '/bot') {
      sessions[payload.participant.phone_number] = {
        active: true,
        stage: 'menu'
      };

      const menu = "—————— MENU ENGINE V1 ——————\n\n"
        + "  1. Criar alerta manual\n\n"
        + "————————————————————";

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
            const send_manual_alert = "—————— CRIAR ALERTA MANUAL ——————\n\n"
              + "  ENVIE UM ALERTA COM O SEGUINTE PADRÃO\n\n"
              + "  *(Programa de Afiliados)* ex: LATAM PASS\n"
              + "  *(Rota)* ex: Brasil > Europa\n"
              + "  *(Viagem)* ex: Salvador para Madri\n"
              + "  *(Milhas)* ex: 128.750\n"
              + "  *(Valor em reais)* ex: 178.34\n"
              + "  *(Classe)* ex: Econômica\n"
              + "  *(Companhia Aerea)* ex: Latam\n"
              + "  *(Datas)* ex: novembro/24\n\n\n\n"
              + "  digite /sair para cancelar"
              + "————————————————————";

            var data = JSON.stringify({
              "to_group_uuid": "WAG24e12bd3-a970-4272-9ebc-dcded2a5c6e1",
              "from_number": '+5579920012363',
              "text": send_manual_alert
            });

            wpp.post('open/whatsapp/send-message', data)
              .then(function (response) {
                res.send(JSON.stringify(response.data));
              })
              .catch(function (error) {
                console.log(error);
              });

            sessions[payload.participant.phone_number].stage = 'awaiting_manual_alert';

          }
          break;
        case 'awaiting_manual_alert':
          if (payload.message.text.trim() === '/sair') {
            delete sessions[payload.participant.phone_number];
            console.log(`Sessão finalizada para ${payload.participant.phone_number}`);
          }

          const arraySplitted = payload.message.text.split("\n")
          const affiliates_program = arraySplitted[0]
          const trip = arraySplitted[1]
          const route = arraySplitted[2]
          const miles = arraySplitted[3]
          const amount = arraySplitted[4]
          const type_trip = arraySplitted[5]
          const airlines = arraySplitted[6]
          let remaining = ''

          for (let i = 7; i < arraySplitted.length; i++) {
            remaining += `${arraySplitted[i].replace(/🗓️ \s?Datas?:/g, '')}\n`;
          }

          const save = new AlertService().createAlert({
            affiliates_program,
            trip,
            route,
            miles,
            type_trip,
            airlines,
            remaining,
            sent: 'waiting',
            amount
          })

          var data = JSON.stringify({
            "to_group_uuid": "WAG24e12bd3-a970-4272-9ebc-dcded2a5c6e1",
            "from_number": '+5579920012363',
            "text": "Alerta enviado com sucesso!"
          });

          wpp.post('open/whatsapp/send-message', data)
            .then(function (response) {
              res.send(JSON.stringify(response.data));
            })
            .catch(function (error) {
              console.log(error);
            });

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
