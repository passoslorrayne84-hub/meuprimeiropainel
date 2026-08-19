// Teste: Gera o CRLV ORIGINAL do veículo (template como fundo + dados posicionados)
// Renderiza o mesmo layout que o frontend (script.js -> abrirVisualizacao) usando
// @napi-rs/canvas, e salva um PNG final para verificação visual.
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== DADOS REAIS DO VEÍCULO (placa NHF2707) =====
const veiculoReal = {
  placa: 'NHF2707',
  anoModelo: 2008,
  chassi: '9BFZF10A588150273',
  situacao: 'EM_CIRCULACAO',
  potencia: 73,
  cilindradas: 999,
  codigoRenavam: '00926901427',
  descricaoMunicipioEmplacamento: 'SAO LUIS',
  ufJurisdicao: 'MA',
  descricaoTipoVeiculo: 'AUTOMOVEL',
  descricaoMarcaModelo: 'FORD/FIESTA FLEX',
  descricaoEspecieVeiculo: 'PASSAGEIRO',
  descricaoTipoCarroceria: 'NAO APLICAVEL',
  descricaoCor: 'VERMELHA',
  descricaoCategoria: 'PARTICULAR',
  anoFabricacao: 2007,
  descricaoCombustivel: 'ALCOOL/GASOLINA',
  numeroMotor: 'SMJA88150273',
  pbt: 1.51,
  numeroIdentificacaoProprietario: '01133149308',
  descricaoRestricao1: 'RENAINF',
  qtdEixos: 2,
  nomeProprietario: 'NATALIA LIDIA SILVA',
  lotacao: 5,
  dataEmissaoCrv: '2010-10-20'
};

// ===== CÓPIA DA FUNÇÃO veicdbNormalizarParaCrlv (extraída do script.js) =====
function veicdbNormalizarParaCrlv(veiculo, placa) {
  const v = veiculo || {};
  const limpar = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  };
  const buscar = (...chaves) => {
    for (const c of chaves) {
      const val = limpar(v[c]);
      if (val !== '') return val;
    }
    return '';
  };
  const marca = buscar('marca', 'marcaModelo', 'descricaoMarca', 'descricao_marca');
  const modelo = buscar('modelo', 'descricaoModelo', 'descricao_modelo');
  const marcaModelo = buscar('marcaModelo', 'descricaoMarcaModelo', 'descricao_marca_modelo', 'marcaModeloVersao')
    || (marca && modelo ? marca + ' ' + modelo : (marca || modelo));
  const especie = buscar('especie', 'espécie', 'descricaoEspecieVeiculo', 'descricao_especie_veiculo');
  const tipo = buscar('tipo', 'descricaoTipoVeiculo', 'descricao_tipo_veiculo', 'tipoVeiculo');
  const especieTipo = buscar('especieTipo', 'especie_tipo')
    || (especie && tipo ? especie + ' / ' + tipo : (especie || tipo));
  const potencia = buscar('potencia', 'potência');
  const cilindradas = buscar('cilindradas');
  const potenciaCilindrada = buscar('potenciaCilindrada', 'potencia_cilindrada')
    || (potencia && cilindradas ? potencia + '/' + cilindradas : (potencia || cilindradas));
  const restricao = buscar('restricao', 'restrição', 'descricaoRestricao1', 'descricao_restricao1', 'descricaoRestricao', 'descricao_restricao');
  return {
    renavam: buscar('renavam', 'codigoRenavam', 'codigo_renavam', 'renavan', 'codigoRenavan'),
    placa: limpar(placa || v.placa),
    exercicio: buscar('exercicio', 'exercício'),
    anoFabricacao: buscar('anoFabricacao', 'ano_fabricacao', 'anoFabricacao', 'ano'),
    anoModelo: buscar('anoModelo', 'ano_modelo'),
    marcaModelo: marcaModelo,
    chassi: buscar('chassi', 'numeroChassi', 'numero_chassi'),
    cor: buscar('cor', 'descricaoCor', 'descricao_cor'),
    combustivel: buscar('combustivel', 'combustível', 'descricaoCombustivel', 'descricao_combustivel'),
    especieTipo: especieTipo,
    categoria: buscar('categoria', 'descricaoCategoria', 'descricao_categoria'),
    capacidade: buscar('capacidade', 'lotacao', 'lotação'),
    potenciaCilindrada: potenciaCilindrada,
    pesoBruto: buscar('pesoBruto', 'peso_bruto', 'pbt'),
    motor: buscar('motor', 'numeroMotor', 'numero_motor'),
    carroceria: buscar('carroceria', 'descricaoTipoCarroceria', 'descricao_tipo_carroceria'),
    eixos: buscar('eixos', 'qtdEixos', 'qtd_eixos'),
    situacao: buscar('situacao', 'situação'),
    numeroCrv: buscar('numeroCrv', 'numero_crv'),
    codigoSeguranca: buscar('codigoSeguranca', 'codigo_seguranca'),
    placaAnteriorUf: buscar('placaAnteriorUf', 'placa_anterior_uf'),
    restricao: restricao,
    nome: buscar('nome', 'nomeProprietario', 'nome_proprietario'),
    cpfCnpj: buscar('cpfCnpj', 'cpf_cnpj', 'numeroIdentificacaoProprietario', 'numero_identificacao_proprietario'),
    endereco: buscar('endereco', 'endereço', 'logradouro'),
    bairro: buscar('bairro'),
    cep: buscar('cep'),
    municipio: buscar('municipio', 'descricaoMunicipioEmplacamento', 'descricao_municipio_emplacamento'),
    uf: buscar('uf', 'ufJurisdicao', 'uf_jurisdicao'),
    local: buscar('local', 'descricaoMunicipioEmplacamento', 'descricao_municipio_emplacamento'),
    data: buscar('data', 'dataEmissaoCrv', 'data_emissao_crv')
  };
}

// ===== RENDERIZA O CRLV ORIGINAL =====
async function gerarCrlvOriginal() {
  const placa = 'NHF2707';
  const d = veicdbNormalizarParaCrlv(veiculoReal, placa);

  console.log('=== DADOS NORMALIZADOS PARA O CRLV ===');
  console.log(JSON.stringify(d, null, 2));

  // Carrega o template PNG (o mesmo que o endpoint /api/template/image serve)
  const templatePath = path.join(__dirname, 'uploads', 'templates', 'template_uber_preview.png');
  if (!fs.existsSync(templatePath)) {
    console.error('Template PNG não encontrado em:', templatePath);
    process.exit(1);
  }
  const template = await loadImage(templatePath);
  const W = template.width;
  const H = template.height;
  console.log(`Template carregado: ${W}x${H}px`);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 1) Desenha o template oficial como fundo
  ctx.drawImage(template, 0, 0, W, H);

  // 2) Configura a fonte (Courier New bold, igual ao frontend)
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  // 3) Desenha os dados nas MESMAS coordenadas percentuais do frontend
  //    (script.js -> abrirVisualizacao). left% e top% -> px.
  const campos = [
    { label: 'PLACA', value: d.placa, left: 62, top: 3.2 },
    { label: 'RENAVAM', value: d.renavam, left: 62, top: 6.2 },
    { label: 'EXERCICIO', value: d.exercicio, left: 8, top: 11.5 },
    { label: 'ANO FABR.', value: d.anoFabricacao, left: 8, top: 14.5 },
    { label: 'ANO MODELO', value: d.anoModelo, left: 8, top: 17.5 },
    { label: 'MARCA/MODELO', value: d.marcaModelo, left: 8, top: 20.5 },
    { label: 'CHASSI', value: d.chassi, left: 8, top: 23.5 },
    { label: 'COR', value: d.cor, left: 8, top: 26.5 },
    { label: 'COMBUSTIVEL', value: d.combustivel, left: 8, top: 29.5 },
    { label: 'ESPECIE/TIPO', value: d.especieTipo, left: 8, top: 32.5 },
    { label: 'CATEGORIA', value: d.categoria, left: 8, top: 35.5 },
    { label: 'CAPACIDADE', value: d.capacidade, left: 8, top: 38.5 },
    { label: 'POTENCIA/CIL.', value: d.potenciaCilindrada, left: 8, top: 41.5 },
    { label: 'PESO BRUTO', value: d.pesoBruto, left: 8, top: 44.5 },
    { label: 'MOTOR', value: d.motor, left: 8, top: 47.5 },
    { label: 'CARROCERIA', value: d.carroceria, left: 8, top: 50.5 },
    { label: 'EIXOS', value: d.eixos, left: 8, top: 53.5 },
    { label: 'SITUACAO', value: d.situacao, left: 8, top: 56.5 },
    { label: 'N CRV', value: d.numeroCrv, left: 8, top: 59.5 },
    { label: 'COD. SEGURANCA', value: d.codigoSeguranca, left: 8, top: 62.5 },
    { label: 'PLACA ANT./UF', value: d.placaAnteriorUf, left: 8, top: 65.5 },
    { label: 'RESTRICAO', value: d.restricao, left: 8, top: 68.5 },
    { label: 'NOME', value: d.nome, left: 8, top: 74 },
    { label: 'CPF/CNPJ', value: d.cpfCnpj, left: 8, top: 77 },
    { label: 'ENDERECO', value: d.endereco, left: 8, top: 80 },
    { label: 'BAIRRO', value: d.bairro, left: 8, top: 83 },
    { label: 'CEP', value: d.cep, left: 8, top: 86 },
    { label: 'MUNICIPIO/UF', value: (d.municipio ? d.municipio + (d.uf ? ' / ' + d.uf : '') : ''), left: 8, top: 89 },
    { label: 'LOCAL', value: d.local, left: 8, top: 92 },
    { label: 'DATA', value: d.data, left: 8, top: 95 }
  ];

  let preenchidos = 0;
  for (const c of campos) {
    const x = (c.left / 100) * W;
    const y = (c.top / 100) * H;
    if (c.value) {
      ctx.fillText(String(c.value).toUpperCase(), x, y);
      preenchidos++;
    }
  }

  // 4) Salva o PNG final do CRLV
  const outPath = path.join(__dirname, 'uploads', 'templates', 'crlv_original_' + placa + '.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`\n=== CRLV ORIGINAL GERADO ===`);
  console.log(`Arquivo: ${outPath}`);
  console.log(`Tamanho: ${buffer.length} bytes (${W}x${H}px)`);
  console.log(`Campos preenchidos: ${preenchidos}/${campos.length}`);
  console.log(`\n✅ CRLV original gerado com sucesso! (sem tela em branco)`);
}

gerarCrlvOriginal().catch((e) => {
  console.error('ERRO ao gerar CRLV original:', e);
  process.exit(1);
});
