/* Teste rápido do gerador de CNH com o banco de coordenadas dinâmico (JSON). */
'use strict';
const fs = require('fs');
const path = require('path');
const { gerarCnhPdf, normalizarValores, lerConfigCoordenadas, construirCoordenadas } = require('./cnhPdfLib');

(async () => {
  const config = lerConfigCoordenadas();
  console.log('Config lido de cnh-coordenadas.json:');
  console.log(JSON.stringify(config, null, 2));

  const coords = construirCoordenadas(config);
  console.log('\nCOORDENADAS construídas (origem bottom-left):');
  console.log(JSON.stringify(coords, null, 2));

  const dados = normalizarValores({
    nome: 'MARIA JOSE DA SILVA SANTOS',
    primeiraHabilitacao: '10/05/2014',
    filiacao: 'PAI: JOAO SANTOS / MAE: ANA SANTOS',
    nascimento: '15/03/1990',
    local: 'SAO PAULO',
    uf: 'SP',
    nacionalidade: 'BRASILEIRA',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    validade: '10/05/2030',
    categoria: 'B',
    emissao: '10/05/2025',
    registro: '12345678901',
    observacao: 'ACESSO A CATEGORIA B'
  });

  // Gera sem foto (apenas para validar textos/coordenadas).
  const pdf = await gerarCnhPdf(dados, null);
  const out = path.join(__dirname, 'teste-cnh-coordenadas.pdf');
  fs.writeFileSync(out, pdf);
  console.log('\nPDF gerado sem foto:', out, '(' + pdf.length + ' bytes)');
})().catch((e) => {
  console.error('ERRO:', e);
  process.exit(1);
});
