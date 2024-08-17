import fastify from 'fastify';
import cors from '@fastify/cors'
import { routes } from './routes';
import engineV1 from './engine/v1';
import calculateMilesToCurrency from './util/conversor';
require('dotenv').config();

const app = fastify();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.register(routes)
app.register(cors, {
  allowedHeaders: [''],
  origin: '*'
})
app.get('/', function (req, reply) {
  reply.send('API Running');
})

app.listen({
  host: '0.0.0.0',
  port
}).then(() => {
  console.log("Servidor rodando na porta " + port)
})

const engine_v1 = new engineV1();

engine_v1.start();

// console.log(Math.round(Number(calculateMilesToCurrency('smiles', 100000, 'CLP'))))