/* Extrai a rota da API do serviço DETRAN RJ Veículo do HTML da página */
'use strict';
const https = require('https');

const url = 'https://infosimples.com/consultas/detran-rj-veiculo/';
const req = https.request(url, {
  method: 'GET',
  headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    // Busca por referências à rota da API (api.infosimples.com/api/v2/consultas/...)
    const apiRefs = d.match(/api\.infosimples\.com\/api\/v2\/consultas\/[a-zA-Z0-9_\/.-]+/g) || [];
    console.log('=== ROTAS DA API ENCONTRADAS ===');
    apiRefs.forEach(r => console.log(' -', r));

    // Busca por "service" ou "servico" no HTML
    const servico = d.match(/["']service["']\s*:\s*["'][^"']*["']/g) || [];
    console.log('=== SERVICE ===');
    servico.forEach(s => console.log(' -', s));

    // Busca por "detran-rj-veiculo" e contexto
    const idx = d.indexOf('detran-rj-veiculo');
    if (idx !== -1) {
      console.log('=== CONTEXTO detran-rj-veiculo ===');
      console.log(d.substring(Math.max(0, idx - 200), idx + 300).replace(/\n/g, ' '));
    }

    // Busca por "consultas/" no HTML
    const consultas = d.match(/consultas\/[a-zA-Z0-9_\/.-]+/g) || [];
    console.log('=== REFERÊNCIAS consultas/ ===');
    Array.from(new Set(consultas)).slice(0, 30).forEach(c => console.log(' -', c));
  });
});
req.on('error', (e) => console.log('ERRO', e.message));
req.end();
