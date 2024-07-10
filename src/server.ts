import fastify from 'fastify';
import { routes } from './routes';
import engineV1 from './engine/v1';
require('dotenv').config();

const app = fastify();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.register(routes)
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

engine_v1.crawlerTKMilhas()

// engine_v1.getSeatsAero();
// engine_v1.start()
// engine_v1.maintenance();