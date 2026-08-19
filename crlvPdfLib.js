/* ============================================================
   CRLV PDF VIA PDF-LIB (BACKEND)
   ------------------------------------------------------------
   Carrega o arquivo crlv-modelo.pdf (na raiz do projeto), preenche
   os dados do veículo POR CIMA nas coordenadas X/Y mapeadas do
   layout oficial do CRLV Digital (SENATRAN/DETRAN) e devolve o PDF
   pronto. Não depende do templateCRLV.js nem do Puppeteer.

   COORDENADAS
   -----------
   Extraídas diretamente do crlv-modelo.pdf com o pdfjs
   (getTextContent): a página é A4 retrato (595 x 842 pt), origem
   bottom-left. O layout segue uma "grade alternada" — cada campo
   tem o RÓTULO na linha de cima e o VALOR na linha de baixo, e as
   colunas esquerda/direita ficam intercaladas. A grade foi
   confirmada pelos placeholders reais do modelo (*.*, *, ***) em
   CAPACIDADE (510,747), CMT (454,694), EIXOS (504,694) e CAT
   (162,577). O "y" abaixo é a baseline do texto do valor.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Caminho do modelo do CRLV na raiz do projeto (o usuário o adicionou).
const MODELO_PATH = path.join(__dirname, 'crlv-modelo.pdf');

// Cor preta para o texto preenchido (como o CRLV real).
const COR_TEXTO = rgb(0, 0, 0);

// Mapa de campos do CRLV: chave -> { x, y, size, bold, maxWidth }.
// - x      : coordenada X (left) do texto (origem bottom-left).
// - y      : baseline (origem bottom-left) da linha de valor.
// - size   : tamanho da fonte em pt.
// - bold   : usar Helvetica-Bold (placa em destaque).
// - maxWidth: largura máxima em pt; o texto é truncado com "..." se estourar.
const CAMPOS = {
  // ===== Coluna esquerda (dados do veículo) =====
  // Valor na linha abaixo do rótulo (baseline = rótulo da linha seguinte).
  renavam:            { x: 31,  y: 734, size: 9,  bold: false, maxWidth: 200 },
  placa:              { x: 31,  y: 708, size: 9,  bold: true,  maxWidth: 62, semTruncar: true, minSize: 7 },
  exercicio:          { x: 103, y: 708, size: 9,  bold: false, maxWidth: 60 },
  anoFabricacao:      { x: 31,  y: 682, size: 9,  bold: false, maxWidth: 55 },
  anoModelo:          { x: 103, y: 682, size: 9,  bold: false, maxWidth: 55 },
  numeroCrv:          { x: 31,  y: 656, size: 8,  bold: false, maxWidth: 90 },
  codigoSeguranca:    { x: 31,  y: 577, size: 8,  bold: false, maxWidth: 90 },
  marcaModelo:        { x: 31,  y: 542, size: 9,  bold: false, maxWidth: 220 },
  especieTipo:        { x: 31,  y: 506, size: 8,  bold: false, maxWidth: 220 },
  placaAnteriorUf:    { x: 31,  y: 471, size: 8,  bold: false, maxWidth: 85 },
  chassi:             { x: 130, y: 471, size: 9,  bold: false, maxWidth: 160 },
  cor:                { x: 31,  y: 435, size: 8,  bold: false, maxWidth: 60 },
  combustivel:        { x: 102, y: 435, size: 8,  bold: false, maxWidth: 60, semTruncar: true, minSize: 7 },

  // ===== Coluna direita (dados do veículo) =====
  // Categoria/Capacidade: logo abaixo do rótulo (772,7) com margem limpa.
  categoria:          { x: 317, y: 757, size: 8,  bold: false, maxWidth: 175 },
  capacidade:         { x: 510, y: 755, size: 8,  bold: false, maxWidth: 70 },
  potenciaCilindrada: { x: 317, y: 720, size: 8,  bold: false, maxWidth: 175 },
  pesoBruto:          { x: 510, y: 720, size: 8,  bold: false, maxWidth: 70 },
  motor:              { x: 317, y: 694, size: 8,  bold: false, maxWidth: 125 },
  eixos:              { x: 504, y: 694, size: 8,  bold: false, maxWidth: 30 },
  lotacao:            { x: 538, y: 697, size: 8,  bold: false, maxWidth: 40 },
  carroceria:         { x: 317, y: 668, size: 8,  bold: false, maxWidth: 175 },
  nome:               { x: 316, y: 640, size: 8,  bold: false, maxWidth: 140, semTruncar: true, minSize: 7 },
  cpfCnpj:            { x: 463, y: 612, size: 8,  bold: false, maxWidth: 115 },
  local:              { x: 317, y: 577, size: 8,  bold: false, maxWidth: 175 },
  data:               { x: 510, y: 577, size: 8,  bold: false, maxWidth: 70 }
};

// ===== Geradores de valores fictícios (fallbacks) =====
// Gera uma string com n letras maiúsculas aleatórias (para placa fictícia).
function gerarLetrasAleatorias(n) {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let r = '';
  for (let i = 0; i < n; i++) r += letras[Math.floor(Math.random() * letras.length)];
  return r;
}

// Gera uma string com n dígitos aleatórios.
function gerarNumerosAleatorios(n) {
  let r = '';
  for (let i = 0; i < n; i++) r += Math.floor(Math.random() * 10);
  return r;
}

// Placa anterior: usa a informada ou gera uma fictícia (3 letras + 4 números)
// acompanhada da UF do veículo (fallback 'SP').
function gerarPlacaAnterior(v, limpar) {
  const existente = limpar(v.placaAnteriorUf) || limpar(v.placaAnterior) || limpar(v.placaAnteriorUF);
  if (existente) return existente;
  const uf = limpar(v.uf) || limpar(v.estado) || 'SP';
  return gerarLetrasAleatorias(3) + gerarNumerosAleatorios(4) + ' / ' + uf.toUpperCase();
}

// Ordem de campos iguais ao templateCRLV.js para consistência de dados.
function normalizarValores(veiculo) {
  const v = veiculo || {};
  const limpar = (val) => (val === undefined || val === null ? '' : String(val).trim());

  const marca = limpar(v.marca) || limpar(v.marcaModelo) || limpar(v.descricaoMarca);
  const modelo = limpar(v.modelo) || limpar(v.descricaoModelo);
  const marcaModelo = limpar(v.marcaModelo) || limpar(v.descricaoMarcaModelo)
    || ((marca && modelo) ? marca + ' ' + modelo : (marca || modelo));

  const especie = limpar(v.especie) || limpar(v.espécie) || limpar(v.descricaoEspecieVeiculo);
  const tipo = limpar(v.tipo) || limpar(v.descricaoTipoVeiculo);
  const especieTipo = limpar(v.especieTipo)
    || ((especie && tipo) ? especie + ' / ' + tipo : (especie || tipo));

  const potencia = limpar(v.potencia) || limpar(v.potência);
  const cilindradas = limpar(v.cilindradas);
  const potenciaCilindrada = limpar(v.potenciaCilindrada)
    || ((potencia && cilindradas) ? potencia + '/' + cilindradas : (potencia || cilindradas));

  return {
    renavam: limpar(v.renavam) || limpar(v.codigoRenavam) || limpar(v.renavan),
    placa: limpar(v.placa),
    exercicio: limpar(v.exercicio) || limpar(v.exercício) || '2026',
    anoFabricacao: limpar(v.anoFabricacao) || limpar(v.ano) || limpar(v.ano_fabricacao),
    anoModelo: limpar(v.anoModelo) || limpar(v.ano_modelo),
    marcaModelo: marcaModelo,
    chassi: limpar(v.chassi) || limpar(v.numeroChassi),
    cor: limpar(v.cor) || limpar(v.corPredominante) || limpar(v.descricaoCor),
    especieTipo: especieTipo,
    combustivel: limpar(v.combustivel) || limpar(v.combustível) || limpar(v.descricaoCombustivel),
    categoria: limpar(v.categoria) || limpar(v.descricaoCategoria),
    capacidade: limpar(v.capacidade) || limpar(v.lotacao) || limpar(v.quantidadeLugares),
    potenciaCilindrada: potenciaCilindrada,
    pesoBruto: limpar(v.pesoBruto) || limpar(v.pesoBrutoTotal) || limpar(v.pbt),
    motor: limpar(v.motor) || limpar(v.numeroMotor),
    carroceria: limpar(v.carroceria) || limpar(v.descricaoTipoCarroceria),
    eixos: limpar(v.eixos) || limpar(v.qtdEixos) || limpar(v.quantidadeEixos),
    lotacao: limpar(v.lotacao) || limpar(v.lotação),
    nome: limpar(v.nome) || limpar(v.nomeProprietario) || limpar(v.proprietario),
    local: limpar(v.local) || limpar(v.municipio) || limpar(v.cidade) || limpar(v.descricaoMunicipioEmplacamento),
    data: limpar(v.data) || limpar(v.dataEmissao) || limpar(v.dataEmissaoCrv) || limpar(v.data_emissao_crv),
    cpfCnpj: limpar(v.cpfCnpj) || limpar(v.cpf_cnpj)
      || limpar(v.numeroIdentificacaoProprietario) || limpar(v.cpf) || limpar(v.cnpj) || limpar(v.documento),
    numeroCrv: limpar(v.numeroCrv) || limpar(v.crv) || limpar(v.numeroDoCrv)
      || (Math.floor(Math.random() * 900000000000) + 100000000000).toString(),
    codigoSeguranca: limpar(v.codigoSeguranca) || limpar(v.cla) || limpar(v.codigoSegurancaCla)
      || (Math.floor(Math.random() * 90000000000) + 10000000000).toString(),
    placaAnteriorUf: gerarPlacaAnterior(v, limpar)
  };
}

// Trunca o texto para caber em maxWidth (com "..."), calculando a largura real
// com a fonte embedada — evita que valores longos estourem a coluna do CRLV.
function ajustarTexto(fonte, texto, size, maxWidth) {
  let t = String(texto);
  if (fonte.widthOfTextAtSize(t, size) <= maxWidth) return t;
  while (t.length > 1 && fonte.widthOfTextAtSize(t + '…', size) > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

// Reduz a fonte (até minSize) para caber todo o texto em maxWidth — usado no NOME,
// que NÃO pode ser truncado (deve ser impresso por completo).
function ajustarTamanhoFonte(fonte, texto, size, maxWidth, minSize) {
  let s = size;
  while (s > minSize && fonte.widthOfTextAtSize(texto, s) > maxWidth) {
    s -= 1;
  }
  return s;
}

/**
 * Gera o CRLV preenchendo o crlv-modelo.pdf com os dados do veículo
 * usando pdf-lib (desenha os valores nas coordenadas X/Y do modelo).
 * @param {object} veiculo - dados normalizados ou crus do veículo.
 * @returns {Promise<Buffer>} bytes do PDF preenchido.
 * @throws {Error} se o crlv-modelo.pdf não existir na raiz do projeto.
 */
async function gerarCrlvPdfComPdfLib(veiculo) {
  if (!fs.existsSync(MODELO_PATH)) {
    throw new Error('Arquivo crlv-modelo.pdf não encontrado na raiz do projeto (' + MODELO_PATH + ').');
  }

  const modeloBytes = fs.readFileSync(MODELO_PATH);
  const pdfDoc = await PDFDocument.load(modeloBytes, { ignoreEncryption: true });
  if (pdfDoc.getPageCount() < 1) {
    throw new Error('O crlv-modelo.pdf não possui páginas.');
  }
  const page = pdfDoc.getPage(0);

  // Fonte Courier-Bold (máquina de escrever em negrito) para o visual de
  // documento oficial com "preto forte". Aplicada a TODOS os campos.
  const fonte = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const fonteBold = fonte;

  const d = normalizarValores(veiculo);

  for (const chave of Object.keys(CAMPOS)) {
    const conf = CAMPOS[chave];
    const valor = d[chave];
    if (!valor) continue; // não desenha campos vazios (preserva o modelo)

    // Todos os campos usam Courier-Bold (preto forte) e letras maiúsculas.
    const f = fonte;
    let texto = valor.toUpperCase();
    let tamanho = conf.size;
    if (conf.semTruncar) {
      // Campos marcados (ex.: NOME, COMBUSTÍVEL) nunca são truncados:
      // reduz a fonte até caber, sem cortar a string.
      tamanho = ajustarTamanhoFonte(f, texto, conf.size, conf.maxWidth, conf.minSize || 7);
    } else {
      texto = ajustarTexto(f, texto, conf.size, conf.maxWidth);
    }
    page.drawText(texto, {
      x: conf.x,
      y: conf.y,
      size: tamanho,
      font: f,
      color: COR_TEXTO
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// Exporta o gerador principal e o mapa de campos (para depuração/ajuste).
module.exports = { gerarCrlvPdfComPdfLib, CAMPOS, MODELO_PATH, normalizarValores };
