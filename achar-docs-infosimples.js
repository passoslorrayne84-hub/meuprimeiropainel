// Procura links de documentação/API no site Infosimples
const https = require('https');

function get(hostname, path) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const r = await get('infosimples.com', '/');
  const html = r.body;
  console.log('STATUS', r.status, 'LEN', html.length);

  // Todos os links href
  const links = html.match(/href=["']([^"']*)["']/gi) || [];
  const hrefs = links.map(l => l.replace(/href=["']|["']$/gi, ''));
  const uniq = [...new Set(hrefs)];
  console.log('\n=== LINKS ===');
  uniq.forEach(h => {
    if (/api|doc|dev|painel|login|consult/i.test(h)) {
      console.log('  ', h);
    }
  });

  // Procurar por "API" no texto
  const apiMentions = html.match(/[^<>]{0,60}API[^<>]{0,60}/gi) || [];
  console.log('\n=== MENTIONS API ===');
  apiMentions.slice(0, 20).forEach(m => console.log('  ', m.trim().slice(0, 150)));
})();
