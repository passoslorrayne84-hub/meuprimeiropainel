/* Extrai os links de consultas de veículos da página da Infosimples */
'use strict';
const https = require('https');

const url = 'https://infosimples.com/consultas/';
const req = https.request(url, {
  method: 'GET',
  headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    // Extrai todos os links href
    const linkRegex = /href="([^"]*)"/g;
    const links = [];
    let m;
    while ((m = linkRegex.exec(d)) !== null) {
      links.push(m[1]);
    }
    // Filtra links de veículos/consultas
    const filtrados = links.filter(l => /veiculo|detran|denatran|placa|renavam|chassi|consulta|fipe/i.test(l));
    console.log('=== LINKS DE VEÍCULOS/CONSULTAS ===');
    const unicos = Array.from(new Set(filtrados));
    unicos.forEach(l => console.log(' - ' + l));
    console.log('Total:', unicos.length);
  });
});
req.on('error', (e) => console.log('ERRO', e.message));
req.end();
