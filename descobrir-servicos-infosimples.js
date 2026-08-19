/* Descobre os serviços de veículos disponíveis na Infosimples consultando
   os endpoints de listagem/documentação da API (sem adivinhar rotas de consulta). */
'use strict';
const https = require('https');

const TOKEN = 'h-2m0ZAWgHMsmWDHR6vuIRviOjkj1EtX5ojIr-8z';
const BASE = 'https://api.infosimples.com/api/v2';

// Endpoints de listagem/documentação a testar (para descobrir os serviços)
const ENDPOINTS = [
  '/consultas/servicos',
  '/consultas/servicos/',
  '/servicos',
  '/servicos/',
  '/consultas/documentacao',
  '/documentacao',
  '/consultas',
  '/consultas/',
  '/consultas/listar',
  '/consultas/disponiveis',
  '/consultas/categorias',
  '/consultas/veiculos',
  '/consultas/veiculos/',
  '/consultas/veiculo',
  '/consultas/veiculo/'
];

function testar(endpoint) {
  return new Promise((resolve) => {
    const url = BASE + endpoint;
    const body = JSON.stringify({ token: TOKEN });
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let resumo = '';
        try {
          const j = JSON.parse(d);
          if (j.code === 602) resumo = '602 (serviço inválido)';
          else if (j.data && Array.isArray(j.data) && j.data.length > 0) resumo = '✅ ' + j.data.length + ' itens';
          else if (j.data && typeof j.data === 'object') resumo = '✅ objeto com chaves: ' + Object.keys(j.data).slice(0, 10).join(',');
          else resumo = 'code=' + j.code + ' msg=' + (j.code_message || '');
        } catch (e) {
          resumo = 'não-JSON: ' + d.substring(0, 80);
        }
        resolve({ endpoint, status: res.statusCode, resumo });
      });
    });
    req.on('error', (e) => resolve({ endpoint, status: 'ERRO', resumo: e.message }));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('=== DESCOBRINDO SERVIÇOS DE VEÍCULOS NA INFOSIMPLES ===');
  for (const ep of ENDPOINTS) {
    const r = await testar(ep);
    console.log(`  ${r.endpoint} → HTTP ${r.status}: ${r.resumo}`);
  }
  console.log('=== FIM ===');
})();
