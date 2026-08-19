// Testa rotas de veículo por estado no padrão {orgao}/{consulta}
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
  const estados = ['ac','al','am','ap','ba','ce','df','es','go','ma','mg','ms','mt','pa','pb','pe','pi','pr','rj','rn','ro','rr','rs','sc','se','sp','to'];
  const consultas = ['veiculo', 'veiculo-completa', 'veiculo-por-placa', 'placa', 'veiculo-por-placa-e-renavam'];

  const rotas = [];
  for (const uf of estados) {
    for (const c of consultas) {
      rotas.push(`/api/v2/consultas/detran-${uf}/${c}`);
      rotas.push(`/api/v2/consultas/detran/${uf}/${c}`);
      rotas.push(`/api/v2/consultas/detran-${uf}-${c}`);
    }
  }

  console.log('Testando', rotas.length, 'rotas...');
  let encontrou = false;
  for (const rota of rotas) {
    try {
      const r = await post(rota, { token: TOKEN, placa: 'ABC1234' });
      let parsed = null;
      try { parsed = JSON.parse(r.body); } catch (e) {}
      const code = parsed ? parsed.code : 'N/A';
      if (code !== 602) {
        console.log(`*** ${r.status} | ${rota} | code=${code} | ${parsed ? parsed.code_message : ''}`);
        encontrou = true;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!encontrou) {
    console.log('Nenhuma rota de Detran por estado retornou código diferente de 602.');
  }
})();
