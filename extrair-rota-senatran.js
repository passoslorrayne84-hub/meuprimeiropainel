/* Extrai a rota da API do serviço Senatran Meus Veículos */
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
    console.log('HTTP', res.statusCode, 'Tamanho:', d.length);
    // Busca por referências à rota da API
    const apiRefs = d.match(/api\.infosimples\.com\/api\/v2\/consultas\/[a-zA-Z0-9_\/-]+/g) || [];
    console.log('Rotas da API encontradas:', apiRefs.slice(0, 20));
    // Busca por menções de "service" ou "servico"
    const servico = d.match(/servi[çc]o[^<]{0,80}/gi) || [];
    console.log('Menções de serviço:', servico.slice(0, 20));
    // Busca por "senatran" e contexto
    const idx = d.indexOf('senatran');
    if (idx !== -1) {
      console.log('Contexto senatran:', d.substring(Math.max(0, idx - 100), idx + 200).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
    }
  });
});
req.on('error', (e) => console.log('ERRO', e.message));
req.end();
