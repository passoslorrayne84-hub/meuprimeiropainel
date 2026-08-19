// Teste: renderizar o PDF do template CRLV como PNG usando pdfjs-dist + @napi-rs/canvas
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Configura o worker (necessário no Node) — usa o build legacy com URL file://
const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const templatePath = path.join(process.cwd(), 'uploads', 'templates', 'template_uber.pdf');

if (!fs.existsSync(templatePath)) {
  console.error('Template não encontrado:', templatePath);
  process.exit(1);
}

const data = new Uint8Array(fs.readFileSync(templatePath));

const doc = await pdfjsLib.getDocument({ data }).promise;
console.log('Páginas:', doc.numPages);

const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 2 }); // escala 2x para boa resolução

const canvas = createCanvas(viewport.width, viewport.height);
const ctx = canvas.getContext('2d');

await page.render({ canvasContext: ctx, viewport }).promise;

const outPath = path.join(process.cwd(), 'uploads', 'templates', 'template_uber_preview.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buffer);
console.log('PNG gerado:', outPath, buffer.length, 'bytes,', viewport.width, 'x', viewport.height);
