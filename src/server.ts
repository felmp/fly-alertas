import fastify from 'fastify';
import { routes } from './routes';
import engineV1 from './engine/v1';
import path from 'path';
require('dotenv').config();

const app = fastify({
  logger: true
});
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.register(routes)
app.register(require("@fastify/static"), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/'
})

app.get('/another/path', function (req, reply) {
  reply.send() // serving path.join(__dirname, 'public', 'myHtml.html') directly
})
// engineV1()

app.listen({
  host: '0.0.0.0',
  port
}).then(() => {
  console.log("Servidor rodando na porta " + port)
})