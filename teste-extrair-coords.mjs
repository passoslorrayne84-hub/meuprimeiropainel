// Extrai as coordenadas dos campos AcroForm do template PDF
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(process.cwd(), 'uploads', 'templates', 'template_uber.pdf');
const data = fs.readFileSync(templatePath);
const doc = await PDFDocument.load(data);
const form = doc.getForm();
const fields = form.getFields();

console.log('Total de campos:', fields.length);
console.log('---');

// Página 1 (índice 0)
const page = doc.getPage(0);
const pageWidth = page.getWidth();
const pageHeight = page.getHeight();
console.log('Tamanho da página (pt):', pageWidth, 'x', pageHeight);
console.log('---');

for (const field of fields) {
  const type = field.constructor.name;
  const name = field.getName();
  try {
    const rect = field.acroField.getRectangle();
    // PDF usa coordenadas com origem no CANTO INFERIOR ESQUERDO.
    // Para converter para coordenadas de tela (origem no topo), fazemos:
    //   top = pageHeight - (rect.y + rect.height)
    const x = rect.x;
    const y = rect.y;
    const w = rect.width;
    const h = rect.height;
    const top = pageHeight - (y + h);
    console.log(JSON.stringify({
      nome: name,
      tipo: type,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      w: Math.round(w * 100) / 100,
      h: Math.round(h * 100) / 100,
      top: Math.round(top * 100) / 100,
      // percentuais relativos à página (para posicionar em CSS com %)
      xPct: Math.round((x / pageWidth) * 10000) / 100,
      topPct: Math.round((top / pageHeight) * 10000) / 100,
      wPct: Math.round((w / pageWidth) * 10000) / 100
    }));
  } catch (e) {
    console.log(JSON.stringify({ nome: name, tipo: type, erro: e.message }));
  }
}
