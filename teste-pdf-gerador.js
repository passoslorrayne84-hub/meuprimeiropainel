/* ============================================================
   TESTE DO GERADOR DE PDF (CRLV UBER / 99)
   Verifica o fluxo completo:
   1. Gera um template PDF de teste (em branco)
   2. Faz upload via /api/template/upload
   3. Chama /api/generate-pdf com dados de veículo
   4. Verifica se o PDF gerado é válido
   ============================================================ */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE = 'http://localhost:3000';

// ===== 1. GERA UM TEMPLATE PDF DE TESTE =====
async function criarTemplateTeste() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Desenha um layout simples de CRLV
  page.drawRectangle({ x: 40, y: 780, width: 515, height: 40, color: rgb(0.1, 0.45, 0.9) });
  page.drawText('CRLV - CERTIFICADO DE REGISTRO E LICENCIAMENTO', {
    x: 60, y: 800, size: 14, font: font, color: rgb(1, 1, 1)
  });
  page.drawText('TEMPLATE DE TESTE - UBER', {
    x: 60, y: 700, size: 12, font: font, color: rgb(0.1, 0.45, 0.9)
  });

  const bytes = await pdfDoc.save();
  const filePath = path.join(__dirname, 'template_teste_uber.pdf');
  fs.writeFileSync(filePath, bytes);
  console.log('[1] Template de teste criado: ' + filePath + ' (' + bytes.length + ' bytes)');
  return filePath;
}

// ===== 2. FAZ UPLOAD DO TEMPLATE =====
function uploadTemplate(filePath, modelo) {
  return new Promise((resolve, reject) => {
    const buffer = fs.readFileSync(filePath);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/template/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length,
        'X-Template-Model': modelo
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('[2] Upload do template ' + modelo.toUpperCase() + ': HTTP ' + res.statusCode + ' → ' + body);
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// ===== 3. CHAMA /api/generate-pdf =====
function gerarPdf(modelo, veiculo) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ modelo: modelo, veiculo: veiculo });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/generate-pdf',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('[3] Geração de PDF ' + modelo.toUpperCase() + ': HTTP ' + res.statusCode + ' → ' + buffer.length + ' bytes');
        resolve({ status: res.statusCode, buffer: buffer, contentType: res.headers['content-type'] });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ===== 4. VERIFICA SE O PDF É VÁLIDO =====
async function verificarPdf(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPageCount();
    console.log('[4] PDF válido! Páginas: ' + pages);
    return true;
  } catch (e) {
    console.log('[4] ❌ PDF inválido: ' + e.message);
    return false;
  }
}

// ===== EXECUÇÃO PRINCIPAL =====
(async () => {
  console.log('==============================================');
  console.log('  TESTE DO GERADOR DE PDF (CRLV UBER / 99)');
  console.log('==============================================');

  // Dados de veículo de teste (reais da base)
  const veiculo = {
    placa: 'BRA2E19',
    marca: 'FORD',
    marcaModelo: 'FORD',
    modelo: 'F-14000',
    ano: '2019',
    anoModelo: '2020',
    cor: 'BRANCA',
    chassi: '9BFXXXXXX12345678',
    renavam: '12345678901',
    situacao: 'ATIVO',
    especie: 'PASSAGEIRO',
    tipo: 'CAMINHONETE',
    combustivel: 'DIESEL',
    potencia: '200 CV',
    cilindradas: '3900',
    capacidade: '5',
    eixos: '2',
    carroceria: 'PICKUP',
    categoria: 'PARTICULAR',
    uf: 'SP',
    municipio: 'SAO PAULO',
    cidade: 'SAO PAULO',
    proprietario: 'ELLEN TESTE',
    cpf: '123.456.789-00',
    dataEmissao: '18/08/2026',
    restricao: 'NENHUMA'
  };

  try {
    // 1. Cria template de teste
    const templatePath = await criarTemplateTeste();

    // 2. Upload do template (Uber)
    await uploadTemplate(templatePath, 'uber');

    // 3. Gera PDF (Uber)
    const resultadoUber = await gerarPdf('uber', veiculo);
    if (resultadoUber.status === 200) {
      await verificarPdf(resultadoUber.buffer);
      // Salva o PDF gerado para inspeção
      fs.writeFileSync(path.join(__dirname, 'teste_crlv_uber.pdf'), resultadoUber.buffer);
      console.log('    PDF Uber salvo em teste_crlv_uber.pdf');
    } else {
      console.log('    ❌ Falha ao gerar PDF Uber: ' + resultadoUber.buffer.toString());
    }

    // 4. Gera PDF (99) - deve falhar pois não há template 99
    const resultado99 = await gerarPdf('99', veiculo);
    if (resultado99.status === 200) {
      console.log('    ✅ PDF 99 gerado (inesperado, template 99 não enviado)');
    } else {
      console.log('    ✅ Comportamento correto: template 99 não enviado → HTTP ' + resultado99.status);
      console.log('    ' + resultado99.buffer.toString());
    }

    console.log('==============================================');
    console.log('  TESTE CONCLUÍDO');
    console.log('==============================================');
  } catch (e) {
    console.error('❌ Erro no teste:', e.message);
  }
})();
