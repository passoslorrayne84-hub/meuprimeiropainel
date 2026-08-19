/* ============================================================
   GERADOR DO ARQUIVO veiculos-reais.js
   Lê a base de veículos reais (base_veiculos_2026-08-18_00-27.json)
   e gera um arquivo JS com a constante global VEICULOS_REAIS.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ORIGEM = 'C:/Users/user/Downloads/base_veiculos_2026-08-18_00-27.json';
const DESTINO = path.join(__dirname, 'veiculos-reais.js');

const raw = fs.readFileSync(ORIGEM, 'utf8');
const dados = JSON.parse(raw);

// Filtra apenas registros com placa válida (não vazia).
const veiculos = dados.filter(v => v && v.placa && String(v.placa).trim() !== '');

// Normaliza cada veículo para o formato usado no Gerador de Veículos.
const normalizados = veiculos.map(v => ({
  placa: String(v.placa || '').trim().toUpperCase(),
  modelo: String(v.modelo || '').trim().toUpperCase(),
  ano: v.ano ? parseInt(v.ano, 10) : null,
  cor: String(v.cor || '').trim().toUpperCase(),
  uf: String(v.uf || '').trim().toUpperCase(),
  chassi: String(v.chassi || '').trim().toUpperCase(),
  renavam: String(v.renavam || '').trim(),
  proprietario: String(v.proprietario || '').trim()
}));

// Gera o conteúdo do arquivo JS.
const linhas = normalizados.map(v => JSON.stringify(v));
const conteudo = `/* ============================================================
   VEÍCULOS REAIS (base puxada da LosDados)
   Fonte: base_veiculos_2026-08-18_00-27.json
   Total: ${normalizados.length} veículos reais
   ============================================================ */
window.VEICULOS_REAIS = [
${linhas.join(',\n')}
];
`;

fs.writeFileSync(DESTINO, conteudo, 'utf8');
console.log(`✅ Arquivo gerado: ${DESTINO}`);
console.log(`   Total de veículos reais: ${normalizados.length}`);
