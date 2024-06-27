import { FastifyInstance } from "fastify";
import { formatMessageText } from "./util/format-model";
import { GroupMessage } from "./models/group-message.model";
import { wpp } from "./axios";

export async function routes(fastify: FastifyInstance) {
  const sessions = {};

  fastify.post('/webhook', async (request, res) => {
    const payload = request.body as GroupMessage;

    /* Verifica se a mensagem recebida é da Flyalertas Diretoria e contém '/bot'
    if (payload.contact.friendly_name.includes('Flyalertas Diretoria') && payload.message.text.trim() === '/bot') {
      // Cria uma sessão para este número específico
      sessions[payload.contact.number] = {
        active: true,
        stage: 'menu'
      };

      const menu = "—————— MENU ENGINE V1 ——————\n\n"
        + "  1. Criar alerta manual\n\n"
        + "————————————————————————————";

      console.log(menu);

      // Aqui você pode enviar a mensagem de menu para o grupo ou para o número específico
      // Exemplo de envio para o grupo
      // var data = JSON.stringify({
      //     "to_group_uuid": "WAG24e12bd3-a970-4272-9ebc-dcded2a5c6e1",
      //     "from_number": payload.contact.number,
      //     "text": menu
      // });

      // wpp.post('open/whatsapp/send-message', data)
      //   .then(function (response) {
      //     res.send(JSON.stringify(response.data));
      //   })
      //   .catch(function (error) {
      //     console.log(error);
      //   });

    } else if (sessions[payload.contact.number] && sessions[payload.contact.number].active) {
      // Se há uma sessão ativa para este número, processa a mensagem de acordo com o estágio atual

      switch (sessions[payload.contact.number].stage) {
        case 'menu':
          // Aqui você pode adicionar lógica para processar outras opções do menu, caso necessário
          break;
        default:
          break;
      }

      // Verifica se a mensagem recebida é para sair da sessão
      if (payload.message.text.trim() === '/sair') {
        // Finaliza a sessão para este número
        delete sessions[payload.contact.number];
        console.log(`Sessão finalizada para ${payload.contact.number}`);
        // Pode enviar uma confirmação de saída, se necessário
      }
    }
    */
    const padrao = /(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n((.*?)📈|📈)(.*?)\n🛫(.*?)\n/
    const padrao2 = /(.*?)\n(🌍|🌎)(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n/

    const verifica_padrao = padrao.test(payload.message.text) || padrao2.test(payload.message.text);
    if (verifica_padrao && payload.contact.friendly_name == 'Espelho Emissões Y1') {

      await formatMessageText(payload.message.text)
    }
  })
}
