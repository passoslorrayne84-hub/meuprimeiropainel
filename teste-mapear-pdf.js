// Temp: extrai as posições (X, Y) de todos os textos do crlv-modelo.pdf
// usando pdfjs-dist, para mapear os campos e preencher com pdf-lib.
const fs = require('fs');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

(async () => {
  try {
    const data = new Uint8Array(fs.readFileSync('crlv-modelo.pdf'));
    const doc = await pdfjs.getDocument({ data }).promise;
    console.log('PAGINAS:', doc.numPages);
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      console.log('PAGINA ' + p + '  largura=' + Math.round(vp.width) + ' altura=' + Math.round(vp.height));
      const tc = await page.getTextContent();
      const items = tc.items.map((it) => ({
        text: it.str,
        x: Math.round(it.transform[4]),
        y: Math.round(it.transform[5]),
        w: Math.round(it.width),
        h: Math.round(it.height)
      }));
      // ordena de cima para baixo (y decrescente) e depois da esquerda para a direita
      items.sort((a, b) => (b.y - a.y) || (a.x - b.x));
      for (const it of items) {
        console.log('  x=' + String(it.x).padStart(4) + ' y=' + String(it.y).padStart(4) +
          ' w=' + String(it.w).padStart(3) + ' h=' + String(it.h).padStart(3) + ' | ' + JSON.stringify(it.text));
      }
    }
  } catch (e) {
    console.error('ERRO:', e.message);
    console.error(e.stack);
  }
})();
