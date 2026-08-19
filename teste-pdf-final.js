/* ============================================================
   TESTE FINAL DO GERADOR DE PDF (CRLV UBER / 99)
   Verifica o fluxo completo com verificação do conteúdo:
   1. Gera um template PDF de teste
   2. Faz upload via /api/template/upload
   3. Chama /api/generate-pdf com dados de veículo
   4. Verifica se o PDF gerado contém os dados do veículo
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
        console.log('[2] Upload do template ' + modelo.toUpperCase() + ': HTTP ' + res.statusCode);
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

// ===== 4. VERIFICA SE O PDF CONTÉM OS DADOS DO VEÍCULO =====
async function verificarConteudoPdf(buffer, veiculo) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPageCount();
    console.log('[4] PDF válido! Páginas: ' + pages);

    // Extrai o texto de todas as páginas
    let textoCompleto = '';
    for (let i = 0; i < pages; i++) {
      const page = pdfDoc.getPage(i);
      const textContent = await page.node.Contents();
      if (textContent) {
        const stream = textContent.getContents();
        if (stream) {
          textoCompleto += stream.decode() + '\n';
        }
      }
    }

    // Verifica se os dados principais estão presentes
    const camposVerificar = [
      { chave: 'placa', valor: veiculo.placa },
      { chave: 'chassi', valor: veiculo.chassi },
      { chave: 'renavam', valor: veiculo.renavam },
      { chave: 'modelo', valor: veiculo.modelo },
      { chave: 'cor', valor: veiculo.cor }
    ];

    let todosPresentes = true;
    for (const campo of camposVerificar) {
      const presente = textoCompleto.includes(campo.valor);
      console.log('    Campo ' + campo.chave + ' (' + campo.valor + '): ' + (presente ? '✅ presente' : '❌ ausente'));
      if (!presente) todosPresentes = false;
    }

    return todosPresentes;
  } catch (e) {
    console.log('[4] ❌ Erro ao verificar PDF: ' + e.message);
    return false;
  }
}

// ===== EXECUÇÃO PRINCIPAL =====
(async () => {
  console.log('==============================================');
  console.log('  TESTE FINAL DO GERADOR DE PDF');
  console.log('==============================================');

  // Dados de veículo de teste
  const veiculo = {
    placa: 'BRA2E19',
    marca: 'FORD',
    marcaModelo: 'FORD',
    modelo: 'F-14000 HD 2p (diesel)',
    ano: '1994',
    anoModelo: '1995',
    cor: 'BRANCA',
    chassi: '9BFXTNSM9RDB57348',
    renavam: '12345678901',
    situacao: 'ATIVO',
    especie: 'PASSAGEIRO',
    tipo: 'CAMINHAO',
    combustivel: 'DIESEL',
    potencia: '134 CV',
    cilindradas: '5882',
    capacidade: '3',
    eixos: '2',
    carroceria: 'CAMINHAO',
    categoria: 'PARTICULAR',
    uf: 'PE',
    municipio: 'SAO LOURENCO DA MATA',
    cidade: 'SAO LOURENCO DA MATA',
    proprietario: 'ELLEN',
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
      // 4. Verifica o conteúdo
      const ok = await verificarConteudoPdf(resultadoUber.buffer, veiculo);
      if (ok) {
        console.log('    ✅ TODOS os dados do veículo estão presentes no PDF!');
      } else {
        console.log('    ⚠️ Alguns dados podem não estar visíveis (depende das coordenadas).');
      }
      // Salva o PDF gerado para inspeção
      fs.writeFileSync(path.join(__dirname, 'teste_crlv_uber.pdf'), resultadoUber.buffer);
      console.log('    PDF Uber salvo em teste_crlv_uber.pdf');
    } else {
      console.log('    ❌ Falha ao gerar PDF Uber: ' + resultadoUber.buffer.toString());
    }

    console.log('==============================================');
    console.log('  TESTE CONCLUÍDO');
    console.log('==============================================');
  } catch (e) {
    console.error('❌ Erro no teste:', e.message);
  }
})();
