/* Teste: extrai o texto do PDF gerado para verificar se os dados estão presentes */
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

(async () => {
  console.log('=== EXTRAÇÃO DE TEXTO DO PDF GERADO ===');

  // Lê o PDF gerado pelo servidor
  const dataBuffer = fs.readFileSync('teste_curl.pdf');
  const uint8 = new Uint8Array(dataBuffer);

  try {
    const parser = new PDFParse(uint8);
    const result = await parser.getText();
    console.log('Texto extraído do PDF:');
    console.log('---');
    console.log(JSON.stringify(result, null, 2).substring(0, 3000));
    console.log('---');
  } catch (e) {
    console.error('Erro ao extrair texto:', e.message);
  }

  console.log('=== FIM ===');
})();
