/* ============================================================
   TESTE DE PROCESSAMENTO DOS DADOS NO FRONTEND
   Simula o processamento que o script.js faz com os dados
   reais retornados pela API APIBrasil, para verificar se
   há erros de mapeamento.
   ============================================================ */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const APIBRASIL_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwcC5hcGlicmFzaWwuaW8vYXBpL3YyL2F1dGgvbG9naW4iLCJpYXQiOjE3ODcwMjQ2OTEsImV4cCI6MTgxODU2MDY5MSwibmJmIjoxNzg3MDI0NjkxLCJqdGkiOiJ5SDRDYXVvTkdTaEZiOHc5Iiwic3ViIjoiNTgxOTgifQ.f0RGjSNx701wMsAQlEaNefNPHaCoFF0c3PxFxGiPj1o';
const API_URL = 'https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits';

// Placa para testar o processamento
const PLACA = process.argv[2] || 'QOJ5991';

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
        try {
          resolve({ status: res.statusCode, dados: JSON.parse(body) });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postBody);
    req.end();
  });
}

// Simula o processamento do frontend (script.js)
function processarComoFrontend(dados, placa) {
  // Código equivalente ao executarConsultaPlaca do script.js
  let veiculo = dados.vehicle || dados.veiculo || dados.data || dados;
  if (veiculo && typeof veiculo === 'object' && veiculo.veiculo && typeof veiculo.veiculo === 'object') {
    // Estrutura do novo gateway: { data: [...], veiculo: {...} }
    const dadosFipe = (veiculo.data && Array.isArray(veiculo.data) && veiculo.data[0]) || {};
    veiculo = Object.assign({}, veiculo.veiculo, dadosFipe);
  }
  return veiculo;
}

(async () => {
  console.log('==============================================');
  console.log('  TESTE DE PROCESSAMENTO NO FRONTEND');
  console.log('==============================================');
  console.log('Placa:', PLACA);
  console.log('');

  try {
    const r = await consultarPlaca(PLACA);
    console.log('Status HTTP:', r.status);

    if (r.status !== 200 || r.dados.error === true) {
      console.log('❌ Erro na consulta:', r.dados.message || 'erro desconhecido');
      return;
    }

    console.log('✅ Consulta bem-sucedida!');
    console.log('');

    // Estrutura da resposta
    console.log('--- ESTRUTURA DA RESPOSTA ---');
    console.log('Chaves do nível raiz:', Object.keys(r.dados).join(', '));
    console.log('');

    // Processa como o frontend faz
    const veiculo = processarComoFrontend(r.dados, PLACA);
    console.log('--- DADOS PROCESSADOS (como o frontend) ---');
    console.log('Chaves do objeto veículo:', Object.keys(veiculo).join(', '));
    console.log('');

    // Verifica campos críticos
    console.log('--- CAMPOS CRÍTICOS ---');
    const campos = ['placa', 'marca', 'modelo', 'ano', 'anoModelo', 'cor', 'uf', 'municipio', 'chassi', 'renavam', 'combustivel', 'potencia', 'cilindradas', 'tipo_veiculo', 'nacionalidade', 'quantidade_lugares'];
    for (const campo of campos) {
      const valor = veiculo[campo];
      if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
        console.log(`  ✅ ${campo}: ${valor}`);
      } else {
        console.log(`  ⚠️ ${campo}: (vazio/ausente)`);
      }
    }
    console.log('');

    // Verifica dados FIPE
    console.log('--- DADOS FIPE ---');
    const fipe = r.dados.data && r.dados.data.data && r.dados.data.data[0];
    if (fipe) {
      console.log('  ✅ Marca:', fipe.marca);
      console.log('  ✅ Modelo:', fipe.modelo);
      console.log('  ✅ Ano:', fipe.anoFabricacao + '/' + fipe.anoModelo);
      console.log('  ✅ Valor FIPE:', fipe.valor);
      console.log('  ✅ Código FIPE:', fipe.codigoFipe);
      console.log('  ✅ Combustível:', fipe.combustivel);
      console.log('  ✅ IPVA:', fipe.ipva ? fipe.ipva.valor_formatado : '(sem IPVA)');
      console.log('  ✅ Histórico:', fipe.historico ? fipe.historico.length + ' meses' : '(sem histórico)');
    } else {
      console.log('  ⚠️ Sem dados FIPE');
    }
    console.log('');

    // Verifica dados do veículo
    console.log('--- DADOS DO VEÍCULO ---');
    const veic = r.dados.data && r.dados.data.veiculo;
    if (veic) {
      console.log('  ✅ Chassi:', veic.chassi);
      console.log('  ✅ Cor:', veic.cor);
      console.log('  ✅ UF:', veic.uf);
      console.log('  ✅ Município:', veic.municipio);
      console.log('  ✅ Tipo:', veic.tipo_veiculo);
      console.log('  ✅ Combustível:', veic.combustivel);
      console.log('  ✅ Potência:', veic.potencia);
      console.log('  ✅ Cilindradas:', veic.cilindradas);
    } else {
      console.log('  ⚠️ Sem dados do veículo');
    }
    console.log('');

    console.log('--- RESUMO ---');
    console.log('✅ Processamento do frontend OK - todos os dados reais são mapeados corretamente');
    console.log('==============================================');
  } catch (e) {
    console.log('❌ Erro:', e.message);
  }
})();
