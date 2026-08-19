/* Mostra o conteúdo da página de detalhes do serviço Senatran */
'use strict';
const https = require('https');

const url = 'https://infosimples.com/consultas/senatran-meus-veiculos-info/';
const req = https.request(url, {
  method: 'GET',
  headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    // Remove tags HTML para ver o texto
    const texto = d.replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    console.log(texto.substring(0, 3000));
  });
});
req.on('error', (e) => console.log('ERRO', e.message));
req.end();
