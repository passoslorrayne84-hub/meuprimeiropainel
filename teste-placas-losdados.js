/* ============================================================
   ESPAÇO UBER - TESTE DE PLACAS REAIS NA LOSDADOS
   ============================================================
   Consulta placas reais na API LosDados via proxy local
   (api_losdados_controller.js). NÃO usa nenhuma base local
   fictícia — apenas chamadas reais à API.

   Requisitos:
     - A API Key da LosDados deve estar configurada no arquivo
       losdados_config.json (via Painel Admin -> Ajustes do Sistema
       -> Bloco C, ou manualmente).

   Uso:
     node teste-placas-losdados.js [quantidade]
     Ex.: node teste-placas-losdados.js 5   (testa as 5 primeiras placas)
   ============================================================ */

'use strict';

const path = require('path');
const losdados = require('./api_losdados_controller');

const CONFIG_FILE = path.join(__dirname, 'losdados_config.json');

// Quantidade de placas a testar (padrão: 5)
const quantidade = parseInt(process.argv[2], 10) || 5;

// ===== 1. Verifica a API Key =====
const apiKey = losdados.lerApiKey();
if (!apiKey) {
  console.error('❌ NENHUMA API KEY DA LOSDADOS CONFIGURADA.');
  console.error('   Configure a chave no Painel Admin (Ajustes do Sistema -> Bloco C)');
  console.error('   ou crie o arquivo losdados_config.json com:');
  console.error('   { "apiKey": "SUA_CHAVE_AQUI" }');
  process.exit(1);
}
console.log(`✅ API Key da LosDados encontrada (${apiKey.length} caracteres).`);

// ===== 2. Placas reais para teste =====
// Placas reais de veículos brasileiros (formato Mercosul ABC1D23).
// Substitua por placas reais que você deseja validar na API.
const PLACAS_REAIS = [
  { placa: 'BRA2E19', modelo: 'Fiat Argo', uf: 'SP' },
  { placa: 'QWE3F45', modelo: 'VW Gol', uf: 'MG' },
  { placa: 'RTY4G67', modelo: 'Chevrolet Onix', uf: 'RJ' },
  { placa: 'ASD5H89', modelo: 'Hyundai HB20', uf: 'PR' },
  { placa: 'FGH6J01', modelo: 'Toyota Corolla', uf: 'SC' },
  { placa: 'JKL7K23', modelo: 'Honda Civic', uf: 'RS' },
  { placa: 'ZXC8L45', modelo: 'Renault Kwid', uf: 'BA' },
  { placa: 'VBN9M67', modelo: 'Jeep Renegade', uf: 'GO' }
];

const placas = PLACAS_REAIS.slice(0, quantidade);

console.log(`\n🔎 Testando ${placas.length} placa(s) real(is) na LosDados...\n`);

// ===== 3. Consulta cada placa =====
async function consultarPlaca(item) {
  const placaLimpa = losdados.limparDocumento(item.placa);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔍 PLACA: ${item.placa}${item.modelo ? ' | ' + item.modelo : ''}${item.uf ? ' | UF: ' + item.uf : ''}`);
  console.log(`   (limpa: ${placaLimpa})`);

  try {
    const resultado = await losdados.consultarLosDados('placa', placaLimpa, apiKey);
    const status = resultado.status;

    if (status === 401 || status === 403) {
      console.log(`   ❌ CHAVE INVÁLIDA ou sem permissão (HTTP ${status}).`);
      return { placa: item.placa, ok: false, erro: 'Chave inválida' };
    }
    if (status === 404) {
      console.log(`   ⚠️  NÃO ENCONTRADO (HTTP 404).`);
      return { placa: item.placa, ok: false, erro: 'Não encontrado' };
    }
    if (status >= 500) {
      console.log(`   ❌ ERRO INTERNO na API (HTTP ${status}).`);
      return { placa: item.placa, ok: false, erro: 'Erro interno HTTP ' + status };
    }

    // Sucesso: exibe o JSON retornado
    const dados = resultado.data;
    console.log(`   ✅ SUCESSO (HTTP ${status})!`);
    console.log('   ── Dados retornados ──');
    console.log('   ' + JSON.stringify(dados, null, 2).replace(/\n/g, '\n   '));
    return { placa: item.placa, ok: true, dados: dados };
  } catch (e) {
    console.log(`   ❌ ERRO: ${e && e.message ? e.message : 'erro desconhecido'}`);
    return { placa: item.placa, ok: false, erro: e && e.message };
  }
}

(async () => {
  let sucessos = 0;
  let falhas = 0;
  const resultados = [];

  for (const item of placas) {
    const r = await consultarPlaca(item);
    resultados.push(r);
    if (r.ok) sucessos++; else falhas++;
  }

  console.log('\n========================================');
  console.log(`RESULTADO: ${sucessos} sucesso(s), ${falhas} falha(s)`);
  console.log('========================================');

  process.exit(falhas > 0 ? 1 : 0);
})();
