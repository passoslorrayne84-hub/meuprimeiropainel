/* ============================================================
   TESTE CONTROLADO - INTEGRAÇÃO INFOSIMPLES
   Valida a consulta de veículo por placa na Infosimples.
   ============================================================
   REGRAS OBRIGATÓRIAS:
   1. Método POST
   2. Token enviado DENTRO do corpo da requisição (campo "token")
   3. Rota oficial: /api/v2/consultas/detran/placa
   4. NÃO adivinhar rotas
   ============================================================ */

'use strict';

const https = require('https');

// ===== CONFIGURAÇÃO =====
const INFOSIMPLES_BASE = 'https://api.infosimples.com/api/v2/consultas';
const INFOSIMPLES_TOKEN = 'h-2m0ZAWgHMsmWDHR6vuIRviOjkj1EtX5ojIr-8z';
const PLACA_ROTA = '/detran/placa';

// Placa para teste (pode ser alterada via argumento)
const PLACA_TESTE = (process.argv[2] || 'BRA2E19').toUpperCase();

// ===== FUNÇÃO: CONSULTAR PLACA NA INFOSIMPLES =====
function consultarPlaca(placa) {
  return new Promise((resolve, reject) => {
    const url = INFOSIMPLES_BASE + PLACA_ROTA;

    // O token vai DENTRO do corpo (body), junto com a placa.
    // NÃO vai nos headers — a Infosimples exige o token no body.
    const postBody = JSON.stringify({
      token: INFOSIMPLES_TOKEN,
      placa: placa
    });

    console.log('URL   :', url);
    console.log('Método: POST');
    console.log('Body  :', postBody);
    console.log('');

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body });
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
  console.log('  TESTE CONTROLADO - INTEGRAÇÃO INFOSIMPLES');
  console.log('==============================================');
  console.log('Placa de teste:', PLACA_TESTE);
  console.log('');

  try {
    const resultado = await consultarPlaca(PLACA_TESTE);
    console.log('Status HTTP:', resultado.status);

    // Tenta interpretar a resposta como JSON
    let dados = null;
    try {
      dados = JSON.parse(resultado.body);
    } catch (e) {
      dados = null;
    }

    if (resultado.status >= 200 && resultado.status < 300) {
      console.log('✅ SUCESSO! A Infosimples respondeu HTTP ' + resultado.status + ' OK.');
      console.log('');
      if (dados) {
        console.log('Resposta (JSON formatado):');
        console.log(JSON.stringify(dados, null, 2));
      } else {
        console.log('Resposta (texto):');
        console.log(resultado.body);
      }
    } else {
      console.log('❌ FALHA! A Infosimples respondeu HTTP ' + resultado.status + '.');
      console.log('');
      if (dados) {
        console.log('Resposta (JSON formatado):');
        console.log(JSON.stringify(dados, null, 2));
      } else {
        console.log('Resposta (texto):');
        console.log(resultado.body);
      }
      console.log('');
      console.log('Dica: Se o erro for 602 (serviço não encontrado), a rota');
      console.log('      pode estar incorreta. Verifique a documentação oficial.');
    }
  } catch (e) {
    console.log('❌ ERRO DE REDE:', e.message);
  }

  console.log('');
  console.log('==============================================');
  console.log('  FIM DO TESTE');
  console.log('==============================================');
})();
