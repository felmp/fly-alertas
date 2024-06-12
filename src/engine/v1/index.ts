import { createServer } from 'http';

export default function engineV1() {

  const intervalo = 30 * 60 * 1000;

  setInterval(minhaFuncao, intervalo);

  const server = createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Engine rodando\n');
  });

  server.listen(3002, '0.0.0.0', () => {
    console.log('Engine V1 - Iniciada');
  });

  minhaFuncao();
}

function minhaFuncao() {
  console.log('Função executada!', new Date());
}