import fastify, { FastifyInstance } from "fastify";
import { wpp } from "./axios";
import { sendDefaultMessage } from "./message-senders/sender-group-default";
import { sendMoneyMessage } from "./message-senders/sender-group-money";
import { GroupMessage } from "./models/group-message";
import { formatMessageText } from "./util/format-model";
import { formatMoneyMessageText } from "./util/format-model-money";

export async function routes(fastify: FastifyInstance) {
  fastify.post('/webhook', async (request, res) => {
    const payload = request.body as GroupMessage;

    const padrao = /(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n((.*?)📈|📈)(.*?)\n🛫(.*?)\n/
    const padrao2 = /(.*?)\n(🌍|🌎)(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n/

    const resultado = padrao.test(payload.message.text) || padrao2.test(payload.message.text);
    console.log(payload.message.text)
    if (resultado && payload.contact.friendly_name == 'Espelho Emissões Y1') {
      const formattedTextMoney = formatMoneyMessageText(payload.message.text)
      const formattedText = formatMessageText(payload.message.text)

      setTimeout(() => {
        sendDefaultMessage(formattedText, res)
      }, 1000)

      setTimeout(() => {
        sendMoneyMessage(formattedTextMoney, res)
      }, 5000)

    } else if (payload.contact.friendly_name != 'Espelho Emissões Y1') {
      console.log(payload.message.text)
    }
  })
}