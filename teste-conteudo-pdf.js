/* Teste direto: verifica se o pdf-lib desenha texto corretamente */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

(async () => {
  console.log('=== TESTE DIRETO DE DESENHO DE TEXTO NO PDF ===');

  // Cria um PDF novo
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Desenha textos
  page.drawText('BRA2E19', { x: 300, y: 700, size: 22, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('9BFXTNSM9RDB57348', { x: 60, y: 560, size: 12, font: font, color: rgb(0, 0, 0) });
  page.drawText('F-14000 HD 2p (diesel)', { x: 60, y: 620, size: 12, font: font, color: rgb(0, 0, 0) });

  const bytes = await pdfDoc.save();
  fs.writeFileSync('teste_direto.pdf', bytes);
  console.log('PDF direto gerado: ' + bytes.length + ' bytes');

  // Verifica se os dados estão no buffer (latin1)
  const s = bytes.toString('latin1');
  console.log('BRA2E19 presente:', s.includes('BRA2E19'));
  console.log('9BFXTNSM9RDB57348 presente:', s.includes('9BFXTNSM9RDB57348'));
  console.log('F-14000 presente:', s.includes('F-14000'));

  // Também verifica em utf8
  const s2 = bytes.toString('utf8');
  console.log('UTF8 - BRA2E19 presente:', s2.includes('BRA2E19'));

  console.log('=== FIM DO TESTE ===');
})();
