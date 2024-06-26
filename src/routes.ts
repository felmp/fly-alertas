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

    const verifica_padrao = padrao.test(payload.message.text) || padrao2.test(payload.message.text);
    if (verifica_padrao && payload.contact.friendly_name == 'Espelho Emissões Y1') {

      await formatMessageText(payload.message.text)
    }

    console.log(payload.channel_phone_number)
  })
}