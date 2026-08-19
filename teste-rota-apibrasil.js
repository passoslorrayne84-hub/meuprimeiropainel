/* ============================================================
   VERIFICAÇÃO DE ROTAS DA API APIBRASIL
   Testa várias variações de URL para confirmar qual é a rota
   correta de consulta de veículos.
   ============================================================ */

'use strict';

const https = require('https');

// Token configurado no server.js
const APIBRASIL_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwcC5hcGlicmFzaWwuaW8vYXBpL3YyL2F1dGgvbG9naW4iLCJpYXQiOjE3ODcwMjQ2OTEsImV4cCI6MTgxODU2MDY5MSwibmJmIjoxNzg3MDI0NjkxLCJqdGkiOiJ5SDRDYXVvTkdTaEZiOHc5Iiwic3ViIjoiNTgxOTgifQ.f0RGjSNx701wMsAQlEaNefNPHaCoFF0c3PxFxGiPj1o';

// Placa real para teste
const PLACA = 'BRA2E19';

// Lista de URLs a testar
const URLS = [
  // URL fornecida pelo usuário
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits',
  // Variações comuns
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculo/credits',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculo',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos/placa',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos/placa/credits',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos/fipe',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos/fipe/credits',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos/consulta',
  'https://gateway.apibrasil.io/api/v2/consulta/veiculos/consulta/credits',
  // Variações com /v1/
  'https://gateway.apibrasil.io/api/v1/consulta/veiculos/credits',
  'https://gateway.apibrasil.io/api/v1/consulta/veiculos',
  // Domínio antigo
  'https://app.apibrasil.io/api/v2/consulta/veiculos/credits',
  'https://app.apibrasil.io/api/v2/consulta/veiculos',
  // Sem /api/
  'https://gateway.apibrasil.io/consulta/veiculos/credits',
  'https://gateway.apibrasil.io/v2/consulta/veiculos/credits'
];

function testarURL(url, metodo, corpo) {
  return new Promise((resolve) => {
    const headers = {
      'Authorization': 'Bearer ' + APIBRASIL_TOKEN,
      'Accept': 'application/json'
    };
    let body = null;
    if (corpo) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(corpo);
      body = corpo;
    }
    const req = https.request(url, { method: metodo, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let resumo = '';
        try {
          const j = JSON.parse(data);
          resumo = j.error === true
            ? '❌ ERRO: ' + (j.message || 'erro desconhecido')
            : '✅ OK: ' + (j.message || 'sucesso');
        } catch (e) {
          resumo = '⚠️ Não-JSON: ' + data.substring(0, 100);
        }
        resolve({ url, metodo, status: res.statusCode, resumo });
      });
    });
    req.on('error', (e) => {
      resolve({ url, metodo, status: 'ERRO', resumo: e.message });
    });
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  console.log('==============================================');
  console.log('  VERIFICAÇÃO DE ROTAS DA API APIBRASIL');
  console.log('==============================================');
  console.log('Placa de teste:', PLACA);
  console.log('');

  const corpo = JSON.stringify({ placa: PLACA, tipo: 'fipe' });

  for (const url of URLS) {
    console.log('--- Testando URL ---');
    console.log('URL:', url);

    // Testa POST primeiro (método usado para consulta)
    const rPost = await testarURL(url, 'POST', corpo);
    console.log(`  POST → HTTP ${rPost.status}: ${rPost.resumo}`);

    // Se POST falhar com 405, testa GET
    if (rPost.status === 405) {
      const rGet = await testarURL(url, 'GET');
      console.log(`  GET  → HTTP ${rGet.status}: ${rGet.resumo}`);
    }
    console.log('');
  }

  console.log('==============================================');
  console.log('  FIM DA VERIFICAÇÃO');
  console.log('==============================================');
})();
