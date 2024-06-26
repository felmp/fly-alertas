import fastify from 'fastify';
import { routes } from './routes';
import path from 'path';
import engineV1 from './engine/v1';
require('dotenv').config();

const app = fastify();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.register(routes)
app.get('/', function (req, reply) {
  reply.send('API Running');
})

const engine_v1 = new engineV1();

engine_v1.start()
  
app.listen({
  host: '0.0.0.0',
  port
}).then(() => {
  console.log("Servidor rodando na porta " + port)
})