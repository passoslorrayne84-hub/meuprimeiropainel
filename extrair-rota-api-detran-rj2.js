// Extrai TODAS as referências de API/serviço da página detran-rj-veiculo
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
  const html = r.body;
  console.log('STATUS', r.status, 'LEN', html.length);

  // Procurar por padrões de API
  const patterns = [
    /api\.infosimples\.com[^"'\s]*/gi,
    /api\/v\d\/[a-z0-9\/_-]+/gi,
    /consultas\/[a-z0-9\/_-]+/gi,
    /"service"\s*:\s*"[^"]*"/gi,
    /"servico"\s*:\s*"[^"]*"/gi,
    /service\s*=\s*["'][^"']*["']/gi,
    /servico\s*=\s*["'][^"']*["']/gi,
    /data-service[^>]*/gi,
    /data-servico[^>]*/gi,
    /action\s*=\s*["'][^"']*["']/gi,
    /form[^>]*action[^>]*/gi,
    /fetch\([^)]*\)/gi,
    /axios[^;]*/gi,
    /\.post\([^)]*\)/gi,
    /\.get\([^)]*\)/gi,
    /url\s*:\s*["'][^"']*["']/gi,
    /endpoint[^"'\s]*/gi,
    /rota[^"'\s]*/gi,
    /slug[^"'\s]*/gi,
    /detran[_-][a-z0-9_-]*/gi,
    /veiculo[_-][a-z0-9_-]*/gi,
  ];

  for (const p of patterns) {
    const matches = html.match(p) || [];
    const uniq = [...new Set(matches)];
    if (uniq.length) {
      console.log('\n--- PADRÃO:', p, '---');
      uniq.slice(0, 30).forEach(m => console.log('  ', m.slice(0, 200)));
    }
  }

  // Procurar por script tags e seus conteúdos
  const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log('\n=== SCRIPTS:', scripts.length, '===');
  scripts.forEach((s, i) => {
    if (/api|consult|servic|veicul|detran/i.test(s)) {
      console.log(`--- SCRIPT ${i} ---`);
      console.log(s.slice(0, 1500));
    }
  });
})();
