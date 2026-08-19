// Teste de geração do CRLV PDF via Puppeteer (HTML-to-PDF).
// Usa os dados REAIS do veículo (placa NHF2707) e o template HTML do CRLV.
// O CRLV é desenhado 100% via HTML/CSS (templateCRLV.js) — sem PDF/imagem externa.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { gerarCrlvHtml } = require('./templateCRLV');

// Dados reais do veículo (mesmos do teste de preenchimento).
const veiculo = {
  placa: 'NHF2707',
  renavam: '00926901427',
  anoModelo: '2008',
  anoFabricacao: '2007',
  chassi: '9BFZF10A588150273',
  marcaModelo: 'FORD/FIESTA FLEX',
  cor: 'VERMELHA',
  combustivel: 'ALCOOL/GASOLINA',
  especieTipo: 'PASSAGEIRO / AUTOMOVEL',
  categoria: 'PARTICULAR',
  capacidade: '5',
  potenciaCilindrada: '73/999',
  pesoBruto: '1.51',
  motor: 'SMJA88150273',
  carroceria: 'NAO APLICAVEL',
  eixos: '2',
  situacao: 'EM_CIRCULACAO',
  restricao: 'RENAINF',
  numeroCrv: '',
  codigoSeguranca: '',
  placaAnteriorUf: '',
  nome: 'NATALIA LIDIA SILVA',
  cpfCnpj: '01133149308',
  endereco: '',
  bairro: '',
  cep: '',
  municipio: 'SAO LUIS',
  uf: 'MA',
  data: '2010-10-20'
};

(async () => {
  try {
    console.log('=== GERANDO CRLV PDF VIA PUPPETEER ===');
    const html = gerarCrlvHtml(veiculo);
    console.log('HTML gerado: ' + html.length + ' caracteres');

    console.log('Abrindo Chromium headless...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      // Aguarda o carregamento (ou a falha) do BRASÃO da República antes de
      // gerar o PDF — garante que a imagem pública carregue ou que o fallback
      // inline (SVG data-URI) seja aplicado pelo onerror.
      await page.evaluate(() => new Promise((resolve) => {
        const img = document.querySelector('.crlv-brasao');
        if (!img || img.complete) { setTimeout(resolve, 300); return; }
        let resolvido = false;
        const done = function () {
          if (!resolvido) { resolvido = true; setTimeout(resolve, 300); }
        };
        img.addEventListener('load', done);
        img.addEventListener('error', done);
        setTimeout(done, 2000);
      }));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      const outPath = path.join(__dirname, 'uploads', 'templates', 'crlv_puppeteer_NHF2707.pdf');
      fs.writeFileSync(outPath, pdfBuffer);
      console.log('✅ PDF gerado com sucesso: ' + outPath);
      console.log('   Tamanho: ' + pdfBuffer.length + ' bytes');
      console.log('   Início do PDF: ' + pdfBuffer.slice(0, 5).toString('ascii'));
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.error('❌ Erro ao gerar o PDF:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
