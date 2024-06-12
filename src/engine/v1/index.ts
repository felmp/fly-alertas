import { createServer } from 'http';

export default function engineV1() {
  const server = createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Engine rodando\n');
  });

  server.listen(3002, '0.0.0.0', () => {
    console.log('Engine V1 - Iniciada');
  });

  const interval = 120000;

  setInterval(run, interval);
}

function run() {
  console.log('Engine trabalhando corretamente na data hora de ', new Date());
}