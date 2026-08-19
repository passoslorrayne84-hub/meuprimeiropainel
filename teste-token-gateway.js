/* ============================================================
   TESTE DO TOKEN E CONSULTA DE PLACA - APIBRASIL GATEWAY
   Verifica se o token está validado e se a consulta de placa
   retorna dados reais da API.
   ============================================================ */

'use strict';

const https = require('https');

// Token configurado no server.js
const APIBRASIL_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwcC5hcGlicmFzaWwuaW8vYXBpL3YyL2F1dGgvbG9naW4iLCJpYXQiOjE3ODcwMjQ2OTEsImV4cCI6MTgxODU2MDY5MSwibmJmIjoxNzg3MDI0NjkxLCJqdGkiOiJ5SDRDYXVvTkdTaEZiOHc5Iiwic3ViIjoiNTgxOTgifQ.f0RGjSNx701wMsAQlEaNefNPHaCoFF0c3PxFxGiPj1o';

// URL do gateway
const API_URL = 'https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits';

// Placa para teste (pode ser alterada)
const PLACA_TESTE = process.argv[2] || 'ABC1D23';

// ===== 1. DECODIFICAR O JWT PARA VERIFICAR VALIDADE =====
function decodificarJWT(token) {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) {
      return { valido: false, erro: 'Token não tem 3 partes (header.payload.signature)' };
    }
    const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf-8'));
    return { valido: true, payload };
  } catch (e) {
    return { valido: false, erro: 'Erro ao decodificar JWT: ' + e.message };
  }
}

// ===== 2. CONSULTAR CRÉDITOS (GET) =====
function consultarCreditos() {
  return new Promise((resolve, reject) => {
    const req = https.request(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + APIBRASIL_TOKEN,
        'Accept': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (e) => reject(e));
    req.end();
  });
}

// ===== 3. CONSULTAR PLACA (POST) =====
function consultarPlaca(placa) {
  return new Promise((resolve, reject) => {
    const postBody = JSON.stringify({ placa: placa, tipo: 'fipe' });
    const req = https.request(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + APIBRASIL_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (e) => reject(e));
    req.write(postBody);
    req.end();
  });
}

// ===== EXECUÇÃO PRINCIPAL =====
(async () => {
  console.log('==============================================');
  console.log('  TESTE APIBRASIL GATEWAY');
  console.log('==============================================');
  console.log('URL:', API_URL);
  console.log('Placa de teste:', PLACA_TESTE);
  console.log('');

  // Passo 1: Verificar token
  console.log('--- 1. VERIFICAÇÃO DO TOKEN ---');
  const jwt = decodificarJWT(APIBRASIL_TOKEN);
  if (!jwt.valido) {
    console.log('❌ Token INVÁLIDO:', jwt.erro);
    return;
  }

  const payload = jwt.payload;
  const agora = Math.floor(Date.now() / 1000);
  const iat = payload.iat || 0;
  const exp = payload.exp || 0;
  const nbf = payload.nbf || 0;

  console.log('✅ Token decodificado com sucesso!');
  console.log('   - Emitido em (iat):', new Date(iat * 1000).toLocaleString('pt-BR'));
  console.log('   - Expira em (exp):', new Date(exp * 1000).toLocaleString('pt-BR'));
  console.log('   - Válido a partir de (nbf):', new Date(nbf * 1000).toLocaleString('pt-BR'));
  console.log('   - Subject (sub):', payload.sub);
  console.log('   - Issuer (iss):', payload.iss);

  const agoraStr = new Date(agora * 1000).toLocaleString('pt-BR');
  console.log('   - Agora:', agoraStr);

  if (agora < nbf) {
    console.log('❌ Token ainda NÃO é válido (nbf no futuro).');
    return;
  }
  if (agora > exp) {
    console.log('❌ Token EXPIRADO!');
    return;
  }
  const diasRestantes = Math.floor((exp - agora) / 86400);
  console.log('✅ Token VÁLIDO! Expira em ' + diasRestantes + ' dias.');
  console.log('');

  // Passo 2: Consultar créditos
  console.log('--- 2. CONSULTA DE CRÉDITOS (GET) ---');
  try {
    const cred = await consultarCreditos();
    console.log('Status HTTP:', cred.status);
    try {
      const dados = JSON.parse(cred.body);
      console.log('Resposta:', JSON.stringify(dados, null, 2));
    } catch (e) {
      console.log('Resposta (texto):', cred.body);
    }
  } catch (e) {
    console.log('❌ Erro ao consultar créditos:', e.message);
  }
  console.log('');

  // Passo 3: Consultar placa
  console.log('--- 3. CONSULTA DE PLACA (POST) ---');
  console.log('Consultando placa:', PLACA_TESTE);
  try {
    const placa = await consultarPlaca(PLACA_TESTE);
    console.log('Status HTTP:', placa.status);
    try {
      const dados = JSON.parse(placa.body);
      console.log('Resposta completa:');
      console.log(JSON.stringify(dados, null, 2));
    } catch (e) {
      console.log('Resposta (texto):', placa.body);
    }
  } catch (e) {
    console.log('❌ Erro ao consultar placa:', e.message);
  }
  console.log('');
  console.log('==============================================');
  console.log('  FIM DO TESTE');
  console.log('==============================================');
})();
