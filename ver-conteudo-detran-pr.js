/* Mostra o conteúdo da página de detalhes do serviço DETRAN PR Veículo Completa */
'use strict';
const https = require('https');

const url = 'https://infosimples.com/consultas/detran-pr-veiculo-completa/';
const req = https.request(url, {
  method: 'GET',
  headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    console.log('HTTP', res.statusCode, 'Tamanho:', d.length);
    const texto = d.replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Mostra o trecho que contém "Parâmetros"
    const idx = texto.indexOf('Parâmetros');
    if (idx !== -1) {
      console.log(texto.substring(idx, idx + 800));
    } else {
      console.log(texto.substring(0, 1500));
    }
  });
});
req.on('error', (e) => console.log('ERRO', e.message));
req.end();
