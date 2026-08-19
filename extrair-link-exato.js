/* Extrai o link exato e o texto de um serviço de veículo da página de consultas */
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
    // Busca o trecho que contém "detran-sp-veiculo" ou "senatran"
    const alvos = ['detran-sp-veiculo', 'senatran-meus-veiculos-info', 'detran-pr-veiculo-completa'];
    for (const alvo of alvos) {
      const idx = d.indexOf(alvo);
      if (idx !== -1) {
        console.log('=== ' + alvo + ' ===');
        console.log(d.substring(Math.max(0, idx - 150), idx + 250).replace(/\n/g, ' '));
        console.log('');
      } else {
        console.log('=== ' + alvo + ' NÃO ENCONTRADO ===');
      }
    }
  });
});
req.on('error', (e) => console.log('ERRO', e.message));
req.end();
