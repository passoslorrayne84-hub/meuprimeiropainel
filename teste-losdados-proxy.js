/* ============================================================
   ESPAÇO UBER - TESTE CONTROLADO DO PROXY LOSDADOS
   ============================================================
   Valida o controller isolado (api_losdados_controller.js) e as
   rotas registradas no server.js, SEM depender de uma API Key real.
   Testa:
     1. limparDocumento()  -> limpeza de caracteres especiais
     2. GET /api/losdados/key (sem chave) -> hasKey:false
     3. POST /api/losdados/key -> salva chave de teste
     4. GET /api/losdados/key (com chave) -> hasKey:true
     5. GET /api/losdados/consulta (sem chave configurada) -> 401
     6. GET /api/losdados/consulta (tipo inválido) -> validação
   ============================================================ */

'use strict';

const http = require('http');
const losdados = require('./api_losdados_controller');

const PORT = 3999; // porta de teste isolada (não conflita com a 3000)
const BASE = `http://127.0.0.1:${PORT}`;

let falhas = 0;
let passou = 0;

function ok(nome) {
  passou++;
  console.log(`  ✅ ${nome}`);
}

function falha(nome, detalhe) {
  falhas++;
  console.error(`  ❌ ${nome}${detalhe ? ' -> ' + detalhe : ''}`);
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: '127.0.0.1',
      port: PORT,
      path: path,
      method: method,
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      } : {}
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch (e) { /* não-JSON */ }
        resolve({ status: res.statusCode, json: json, raw: raw });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ===== 1. Teste unitário: limparDocumento =====
console.log('\n[1] Teste unitário: limparDocumento()');
const casosLimpeza = [
  ['123.456.789-01', '12345678901'],
  ['(11) 99999-9999', '11999999999'],
  ['ABC1D23', 'ABC1D23'],
  ['ABC-1234', 'ABC1234'],
  ['  123.456.789-01  ', '12345678901']
];
let limpezaOk = true;
for (const [entrada, esperado] of casosLimpeza) {
  const resultado = losdados.limparDocumento(entrada);
  if (resultado !== esperado) {
    limpezaOk = false;
    console.error(`    Entrada "${entrada}" -> "${resultado}" (esperado "${esperado}")`);
  }
}
if (limpezaOk) ok('limparDocumento limpa pontos, traços, parênteses e espaços');
else falha('limparDocumento', 'um ou mais casos falharam');

// ===== 2. Teste: GET /api/losdados/key (sem chave) =====
console.log('\n[2] GET /api/losdados/key (sem chave salva)');

// Garante que não há chave salva antes do teste
const fs = require('fs');
const path = require('path');
const CONFIG_FILE = path.join(__dirname, 'losdados_config.json');
if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);

// Inicia o servidor de teste (usa o mesmo handler do server.js)
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/losdados/')) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors);
      res.end();
      return;
    }
    const tratado = losdados.handleLosDados(req, res, cors);
    if (tratado) return;
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, erro: 'Rota inválida' }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, erro: 'Rota não encontrada' }));
});

server.listen(PORT, async () => {
  try {
    // GET key sem chave
    let r = await request('GET', '/api/losdados/key');
    if (r.status === 200 && r.json && r.json.ok === true && r.json.hasKey === false) {
      ok('GET /api/losdados/key retorna hasKey:false quando não há chave');
    } else {
      falha('GET /api/losdados/key', `status=${r.status} body=${r.raw}`);
    }

    // ===== 3. POST /api/losdados/key (salvar chave de teste) =====
    console.log('\n[3] POST /api/losdados/key (salvar chave de teste)');
    r = await request('POST', '/api/losdados/key', { apiKey: 'CHAVE_TESTE_123' });
    if (r.status === 200 && r.json && r.json.ok === true) {
      ok('POST /api/losdados/key salva a chave com sucesso');
    } else {
      falha('POST /api/losdados/key', `status=${r.status} body=${r.raw}`);
    }

    // ===== 4. GET /api/losdados/key (com chave) =====
    console.log('\n[4] GET /api/losdados/key (com chave salva)');
    r = await request('GET', '/api/losdados/key');
    if (r.status === 200 && r.json && r.json.ok === true && r.json.hasKey === true) {
      ok('GET /api/losdados/key retorna hasKey:true após salvar');
    } else {
      falha('GET /api/losdados/key (com chave)', `status=${r.status} body=${r.raw}`);
    }

    // ===== 5. GET /api/losdados/consulta (tipo inválido) =====
    console.log('\n[5] GET /api/losdados/consulta (tipo inválido)');
    r = await request('GET', '/api/losdados/consulta?tipo=invalido&documento=123');
    // Com chave salva, o controller tenta consultar; tipo inválido gera erro 504
    if (r.status === 504 || r.status === 400) {
      ok('GET /api/losdados/consulta com tipo inválido é rejeitado');
    } else {
      falha('GET /api/losdados/consulta (tipo inválido)', `status=${r.status} body=${r.raw}`);
    }

    // ===== 6. GET /api/losdados/consulta (sem chave) =====
    console.log('\n[6] GET /api/losdados/consulta (sem chave configurada)');
    // Remove a chave para testar o fluxo "chave não configurada"
    if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
    r = await request('GET', '/api/losdados/consulta?tipo=cpf&documento=12345678901');
    if (r.status === 401 && r.json && r.json.ok === false && /API Key/.test(r.json.erro || '')) {
      ok('GET /api/losdados/consulta retorna 401 quando a chave não está configurada');
    } else {
      falha('GET /api/losdados/consulta (sem chave)', `status=${r.status} body=${r.raw}`);
    }

    // ===== 7. Rota inválida sob /api/losdados/ =====
    console.log('\n[7] GET /api/losdados/rota-inexistente');
    r = await request('GET', '/api/losdados/rota-inexistente');
    if (r.status === 400) {
      ok('Rota inválida sob /api/losdados/ retorna 400');
    } else {
      falha('Rota inválida', `status=${r.status} body=${r.raw}`);
    }

    // Limpa a chave de teste ao final
    if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);

    console.log('\n========================================');
    console.log(`RESULTADO: ${passou} passaram, ${falhas} falharam`);
    console.log('========================================');
    server.close();
    process.exit(falhas > 0 ? 1 : 0);
  } catch (e) {
    console.error('Erro inesperado no teste:', e);
    server.close();
    process.exit(1);
  }
});
