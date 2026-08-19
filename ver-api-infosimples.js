// Acessa o portal da API Infosimples para descobrir os serviços
const https = require('https');

function get(hostname, path, redirects = 0) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } };
    const req = https.request(opts, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
        const loc = res.headers.location;
        console.log('REDIRECT', res.statusCode, '->', loc);
        let h = hostname, p = loc;
        if (loc.startsWith('http')) {
          const u = new URL(loc);
          h = u.hostname;
          p = u.pathname + u.search;
        }
        res.resume();
        return get(h, p, redirects + 1).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const r = await get('api.infosimples.com', '/');
  console.log('STATUS', r.status, 'LEN', r.body.length);
  console.log('HEADERS', JSON.stringify(r.headers, null, 2).slice(0, 1000));
  console.log('\n=== BODY (primeiros 3000) ===');
  console.log(r.body.slice(0, 3000));
})();
