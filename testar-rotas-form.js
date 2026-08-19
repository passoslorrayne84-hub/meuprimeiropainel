// Testa várias rotas de serviço com encoding application/x-www-form-urlencoded
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

(async () => {
  const rotas = [
    '/api/v2/consultas/detran-rj-veiculo',
    '/api/v2/consultas/detran-sp-veiculo',
    '/api/v2/consultas/detran-veiculo',
    '/api/v2/consultas/veiculo',
    '/api/v2/consultas/veiculos',
    '/api/v2/consultas/placa',
    '/api/v2/consultas/placa-veiculo',
    '/api/v2/consultas/veiculo-placa',
    '/api/v2/consultas/detran/veiculo',
    '/api/v2/consultas/detran/placa',
    '/api/v2/consultas/denatran/veiculo',
    '/api/v2/consultas/denatran/placa',
    '/api/v2/consultas/senatran/veiculo',
    '/api/v2/consultas/senatran/placa',
    '/api/v2/consultas/detran-veiculo-completa',
    '/api/v2/consultas/detran-rj-veiculo-completa',
    '/api/v2/consultas/detran-restricoes',
    '/api/v2/consultas/detran-restricoes-veiculo',
    '/api/v2/consultas/veiculo-detran',
    '/api/v2/consultas/consulta-veiculo',
    '/api/v2/consultas/consulta-placa',
    '/api/v2/consultas/consultar-placa',
    '/api/v2/consultas/consultar-veiculo',
    '/api/v2/consultas/veiculo-por-placa',
    '/api/v2/consultas/placa-veiculo-detran',
  ];

  for (const rota of rotas) {
    try {
      const r = await post(rota, { token: TOKEN, placa: 'ABC1234' });
      let parsed = null;
      try { parsed = JSON.parse(r.body); } catch (e) {}
      const code = parsed ? parsed.code : 'N/A';
      const msg = parsed ? parsed.code_message : r.body.slice(0, 80);
      if (code !== 602) {
        console.log(`*** ${r.status} | ${rota} | code=${code} | ${msg}`);
      } else {
        console.log(`    ${r.status} | ${rota} | code=${code}`);
      }
    } catch (e) {
      console.log(`ERR | ${rota} | ${e.message}`);
    }
  }
})();
