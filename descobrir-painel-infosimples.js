// Descobre os serviços disponíveis no painel Infosimples para o token
const https = require('https');

const TOKEN = 'h-2m0ZAWgHMsmWDHR6vuIRviOjkj1EtX5ojIr-8z';

function post(path, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const opts = {
      hostname: 'api.infosimples.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(hostname, path) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method: 'GET' };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log('=== 1. Testando endpoints de listagem de serviços ===');
  const endpoints = [
    '/api/v2/consultas/',
    '/api/v2/consultas',
    '/api/v2/servicos',
    '/api/v2/servicos/',
    '/api/v2/',
    '/api/v2',
    '/api/v1/consultas/',
    '/api/v1/servicos',
    '/api/v2/consultas/disponiveis',
    '/api/v2/consultas/lista',
    '/api/v2/consultas/servicos',
    '/api/v2/consultas/categorias',
    '/api/v2/consultas/meus-servicos',
    '/api/v2/consultas/meusservicos',
    '/api/v2/consultas/token',
    '/api/v2/consultas/status',
    '/api/v2/consultas/planos',
    '/api/v2/consultas/saldo',
    '/api/v2/consultas/creditos',
    '/api/v2/consultas/account',
    '/api/v2/consultas/conta',
    '/api/v2/consultas/perfil',
    '/api/v2/consultas/me',
    '/api/v2/consultas/meus-dados',
    '/api/v2/consultas/meusdados',
    '/api/v2/consultas/veiculos',
    '/api/v2/consultas/veiculo',
    '/api/v2/consultas/veiculos/',
    '/api/v2/consultas/placa',
    '/api/v2/consultas/placas',
    '/api/v2/consultas/detran',
    '/api/v2/consultas/detran/',
    '/api/v2/consultas/denatran',
    '/api/v2/consultas/denatran/',
    '/api/v2/consultas/senatran',
    '/api/v2/consultas/senatran/',
  ];
  for (const ep of endpoints) {
    try {
      const r = await post(ep, { token: TOKEN });
      let parsed = null;
      try { parsed = JSON.parse(r.body); } catch (e) {}
      const code = parsed ? parsed.code : 'N/A';
      const msg = parsed ? parsed.code_message : r.body.slice(0, 100);
      console.log(`${r.status} | ${ep} | code=${code} | ${msg}`);
    } catch (e) {
      console.log(`ERR | ${ep} | ${e.message}`);
    }
  }

  console.log('\n=== 2. Testando painel ===');
  const paineis = [
    ['painel.infosimples.com', '/'],
    ['app.infosimples.com', '/'],
    ['admin.infosimples.com', '/'],
    ['www.infosimples.com', '/painel/'],
    ['infosimples.com', '/painel/'],
    ['infosimples.com', '/login/'],
    ['infosimples.com', '/api/'],
    ['infosimples.com', '/documentacao/'],
    ['infosimples.com', '/documentacao-api/'],
    ['infosimples.com', '/docs/'],
    ['infosimples.com', '/api/v2/'],
    ['infosimples.com', '/api/v2/documentacao/'],
    ['infosimples.com', '/api/v2/docs/'],
  ];
  for (const [h, p] of paineis) {
    try {
      const r = await get(h, p);
      console.log(`${r.status} | https://${h}${p} | len=${r.body.length}`);
    } catch (e) {
      console.log(`ERR | https://${h}${p} | ${e.message}`);
    }
  }
})();
