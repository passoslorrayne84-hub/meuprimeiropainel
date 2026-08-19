/* Extrai os parâmetros e a rota da API de consulta de veículo do Detran-SP */
'use strict';
const https = require('https');

const url = 'https://infosimples.com/consultas/detran-sp-veiculo/';
const req = https.request(url, {
  method: 'GET',
  headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    console.log('HTTP', res.statusCode, 'Tamanho:', d.length);
    // Busca por menções de parâmetros e rota da API
    const mencoes = d.match(/placa|renavam|chassi|token|api\/v2|consultas|detran|veiculo|par[âa]metro|POST|GET/gi) || [];
    console.log('Menções:', mencoes.slice(0, 60).join(', '));
    console.log('');
    // Extrai trechos que mencionam a rota da API
    const apiRefs = d.match(/api\.infosimples\.com[^"'\s<]*/g) || [];
    console.log('Referências à API:', apiRefs.slice(0, 20));
    console.log('');
    // Extrai trechos com "placa" e contexto
    const placaIdx = d.indexOf('placa');
    if (placaIdx !== -1) {
      console.log('Contexto "placa":', d.substring(Math.max(0, placaIdx - 200), placaIdx + 300).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
    }
  });
});
req.on('error', (e) => console.log('ERRO', e.message));
req.end();
