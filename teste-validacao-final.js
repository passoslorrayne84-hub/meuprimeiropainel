// ============================================================
// TESTE DE VALIDAÇÃO FINAL - INTEGRAÇÃO INFOSIMPLES
// Faz uma chamada controlada à rota oficial detran/{uf}/veiculo
// usando a codificação application/x-www-form-urlencoded.
// ============================================================
const https = require('https');

const TOKEN = 'h-2m0ZAWgHMsmWDHR6vuIRviOjkj1EtX5ojIr-8z';
const PLACA = 'ABC1234'; // placa de teste (pode ser substituída)
const UF = 'rj';

const apiUrl = `https://api.infosimples.com/api/v2/consultas/detran/${UF}/veiculo`;

// Corpo no formato application/x-www-form-urlencoded
const postBody = new URLSearchParams({
  token: TOKEN,
  placa: PLACA
}).toString();

console.log('==============================================');
console.log('TESTE DE VALIDAÇÃO - INFOSIMPLES');
console.log('==============================================');
console.log('URL   :', apiUrl);
console.log('Método: POST');
console.log('Body  :', postBody);
console.log('----------------------------------------------');

const req = https.request(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(postBody)
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status HTTP:', res.statusCode);
    console.log('----------------------------------------------');
    console.log('Resposta:');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(body);
    }
    console.log('==============================================');
  });
});

req.on('error', (e) => {
  console.error('Erro na requisição:', e.message);
  process.exit(1);
});

req.write(postBody);
req.end();
