import fastify, { FastifyInstance } from "fastify";
import { wpp } from "./axios";
import { sendDefaultMessage } from "./message-senders/sender-group-default";
import { sendMoneyMessage } from "./message-senders/sender-group-money";
import { formatMessageText } from "./util/format-model";
import { formatMoneyMessageText } from "./util/format-model-money";
import { GroupMessage } from "./models/group-message.model";
import prismaClient from "./prisma";
import { AlertService } from "./services/alert.service";

export async function routes(fastify: FastifyInstance) {
  fastify.post('/api/ws-hook', async (request, res) => {
    const payload = request.body as GroupMessage;

    const padrao = /(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n((.*?)📈|📈)(.*?)\n🛫(.*?)\n/
    const padrao2 = /(.*?)\n(🌍|🌎)(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n/

    const resultado = padrao.test(payload.message.text) || padrao2.test(payload.message.text);
    console.log(payload.message.text)
    if (resultado && payload.contact.friendly_name == 'Espelho Emissões Y1') {
      const idPayload = new AlertService().savePayload(payload.message.text)
      
      // await formatMoneyMessageText(payload.message.text, await idPayload)
      const saveFormatted = await formatMessageText(payload.message.text, await idPayload)
      console.log(await saveFormatted)

      // await sentPayload

      // setTimeout(() => {
      //   sendDefaultMessage(formattedText, res)
      // }, 1000)

      // setTimeout(() => {
      //   sendMoneyMessage(formattedTextMoney, res)
      // }, 5000)

    }
  })
}