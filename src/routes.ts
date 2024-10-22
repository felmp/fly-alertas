import { FastifyInstance } from "fastify";
import { formatMessageText } from "./util/format-model";
import { GroupMessage } from "./models/group-message.model";
import { AlertService } from "./services/alert.service";
import { gpt, wpp } from "./axios";
import crawlers from "./engine/v1/resources/crawlers";

import fs from 'fs';
import path from 'path';

const mediaControlFilePath = path.join(__dirname, 'mediaControl.json');

function readMediaControl() {
  try {
    const data = fs.readFileSync(mediaControlFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export async function routes(fastify: FastifyInstance) {
  fastify.post('/webhook', async (request, res) => {
    const payload = request.body as GroupMessage;


    const padrao = /(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n((.*?)📈|📈)(.*?)\n🛫(.*?)\n/
    const padrao2 = /(.*?)\n(🌍|🌎)(.*?)\n✈️(.*?)\n📍(.*?)\n💰(.*?)\n💺(.*?)\n/

    const verifica_padrao = padrao.test(payload.message.text) || padrao2.test(payload.message.text);
    if (verifica_padrao && payload.contact.friendly_name == 'Espelho Emissões Y1') {
      await formatMessageText(payload.message.text)
    }

    //AUTOMAÇÃO PARA DANIEL 
    if (payload.contact.friendly_name == 'TESTE CONTROLE DE MENSAGENS E MÍDIA') {
      const phoneNumber = payload.participant.phone_number;
      const currentDate = new Date().toISOString().split('T')[0]; // Data no formato YYYY-MM-DD
      const message = payload.message;

      if (message.media) {
        const mediaControl = readMediaControl();

        if (!mediaControl[phoneNumber]) {
          mediaControl[phoneNumber] = {};
        }

        if (!mediaControl[phoneNumber][currentDate]) {
          mediaControl[phoneNumber][currentDate] = 0;
        }

        const mediaCount = mediaControl[phoneNumber][currentDate];

        if (mediaCount >= 5) {
          console.log(`Usuário ${phoneNumber} já enviou 5 mídias hoje. Bloqueando novos envios.`);

          const data = JSON.stringify({
            "to_number": phoneNumber,
            "from_number": payload.channel_phone_number,
            "text": 'Você atingiu o limite de 5 mídias por hoje. Tente novamente amanhã.'
          });

          wpp.post('open/whatsapp/send-message', data)
            .then(function (response) {
              console.log('Mensagem de bloqueio enviada com sucesso:', response);
            })
            .catch(function (error) {
              console.log('Erro ao enviar mensagem de bloqueio:', error);
            });
        }

        if (mediaCount === 3) {
          const data = JSON.stringify({
            "to_number": phoneNumber,
            "from_number": payload.channel_phone_number,
            "text": `Pessoal, para manter a organização e facilitar a leitura das mensagens importantes, estamos limitando o envio de imagens da seguinte forma:

✅ Máximo de 3 imagens por vez (por mensagem ou envio consecutivo)
✅ No maximo 5 imagens por dia( 24 hrs )
✅ Evitar imagens repetidas ou irrelevantes
✅ Sempre que possível, usar links ou PDFs compactos para evitar excesso de arquivos
✅ Foco no conteúdo relevante para todos os membros

⚠️ Mensagens com grande volume de imagens poderão ser removidas para evitar sobrecarga no grupo.

Contamos com a colaboração de todos para manter o grupo organizado e funcional!`});

          wpp.post('open/whatsapp/send-message', data)
            .then(function (response) {
              console.log('Mensagem de bloqueio enviada com sucesso:', response);
            })
            .catch(function (error) {
              console.log('Erro ao enviar mensagem de bloqueio:', error);
            });
        } else {
          mediaControl[phoneNumber][currentDate]++;

          fs.writeFileSync(mediaControlFilePath, JSON.stringify(mediaControl, null, 2), 'utf8');

          console.log(`Mídia recebida do usuário ${phoneNumber}. Total de mídias hoje: ${mediaControl[phoneNumber][currentDate]}`);
        }
      }
    }
  })

  fastify.get('/alerts', async (_, res) => {
    const alerts = await new AlertService().getAlerts();

    res.send(alerts);
  })

  fastify.get('/alerts/semi-automatic', async (_, res) => {
    const alerts = await new AlertService().getAlertsSemiAutomatic();

    res.send(alerts);
  })

  fastify.get('/alerts/total', async (_, res) => {
    const total_alerts = await new AlertService().getTotalAlerts();

    res.send(total_alerts)
  })

  fastify.get('/participants/total', async (_, res) => {
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

    const response = await crawlers.getTKmilhasEndpoint(body.origin, body.destination, body.cabin, body.date.from, body.date.to)
    res.send(response)
  })

  interface SendMessageGPT {
    command: string;
  }

  fastify.post('/send-message/gpt', async (req, res) => {
    const { command } = req.body as SendMessageGPT

    const prompt = `
PEGUE OS DADOS QUE ENVIEI E RETIRE AS INFORMAÇÕES NECESSÁRIAS PARA COMPOR ESSE MODELO 

⚠️ *OPORTUNIDADE @FLYALERTAS*

🚨 Programa de Afiliados: Programa de Afiliados XYZ
✈️  Rota: São Paulo - Nova York / GRU-JFK
💰 A partir de R$ 2.500,00 trecho + taxas
🛫 Companhia Aérea: LATAM
💺 Classe: Executiva
🗓️  Alerta de Data: 10/10/2024 a 20/10/2024

_Não tem milhas? Nós te ajudamos com essa emissão!_`;

    const data_gpt = {
      "model": "gpt-4",
      "messages": [
        {
          "role": "system",
          "content": prompt
        },
        {
          "role": "user",
          "content": JSON.stringify(command)
        }
      ]
    };

    const messageGPT = await gpt.post('chat/completions', data_gpt);

    res.send(messageGPT.data.choices[0].message.content)
  })

  interface SaveAlert {
    returnAlert: string;
  }

  fastify.post('/save-alert', async (req, res) => {
    const { returnAlert } = req.body as SaveAlert

    if (returnAlert) {
      const alert = await new AlertService().createAlert({
        original_message: JSON.stringify(returnAlert) as string,
        sent: 'semi_automatic_brasil_group'
      })

      res.send(alert)
    }
  })
}
