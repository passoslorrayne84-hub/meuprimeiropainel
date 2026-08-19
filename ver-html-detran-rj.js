// Mostra o HTML completo da página detran-rj-veiculo
const https = require('https');

function get(hostname, path) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } };
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
  const r = await get('infosimples.com', '/consultas/detran-rj-veiculo/');
  console.log('STATUS', r.status, 'LEN', r.body.length);
  console.log(r.body);
})();
