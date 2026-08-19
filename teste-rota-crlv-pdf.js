// Teste da rota POST /api/gerar-crlv-pdf via HTTP.
// Envia os dados REAIS do veículo (placa NHF2707) e salva o PDF retornado.
const http = require('http');
const fs = require('fs');
const path = require('path');

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
  nome: 'NATALIA LIDIA SILVA',
  cpfCnpj: '01133149308',
  municipio: 'SAO LUIS',
  uf: 'MA',
  data: '2010-10-20'
};

const body = JSON.stringify({ veiculo, modelo: 'uber' });

const req = http.request({
  host: 'localhost',
  port: 3000,
  path: '/api/gerar-crlv-pdf',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  console.log('Status: ' + res.statusCode);
  console.log('Content-Type: ' + res.headers['content-type']);
  console.log('Content-Disposition: ' + res.headers['content-disposition']);

  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    if (res.statusCode === 200) {
      const outPath = path.join(__dirname, 'uploads', 'templates', 'crlv_rota_NHF2707.pdf');
      fs.writeFileSync(outPath, buf);
      console.log('✅ PDF salvo: ' + outPath + ' (' + buf.length + ' bytes)');
      console.log('   Início: ' + buf.slice(0, 5).toString('ascii'));
    } else {
      console.log('❌ Resposta do servidor: ' + buf.toString('utf8'));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro de conexão:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
