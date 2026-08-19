// Verifica o PDF gerado pelo Puppeteer renderizando a 1ª página para PNG,
// confirmando que o template real do painel admin aparece como fundo.
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = await import('@napi-rs/canvas');
    const { pathToFileURL } = await import('url');

    const workerPath = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

    const pdfPath = path.join(__dirname, 'uploads', 'templates', 'crlv_rota_NHF2707.pdf');
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const outPath = path.join(__dirname, 'uploads', 'templates', 'crlv_verificacao_tela.png');
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log('✅ Página renderizada: ' + outPath);
    console.log('   Dimensões: ' + viewport.width + 'x' + viewport.height + ' px');
  } catch (e) {
    console.error('❌ Erro:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
