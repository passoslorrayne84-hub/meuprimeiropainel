/* ============================================================
   CNH PDF VIA PDF-LIB (BACKEND)
   ------------------------------------------------------------
   Gera o PDF da CNH preenchendo a imagem de fundo cnh-modelo.jpeg
   (1055 x 1490 px) com os dados extraídos do texto colado pelo
   usuário no <textarea> do frontend (formato "CNH COMPLETA").

   FLUXO
   -----
   1. parseCnhTexto(texto)  -> extrai cada campo (NOME, CPF, RG,
      REGISTRO, VALIDADE, CATEGORIA, FILIAÇÃO, ...) do texto colado.
   2. normalizarValores()   -> aplica fallbacks realistas para que o
      PDF nunca quebre quando algum campo vier vazio.
   3. gerarCnhPdf(dados)    -> cria a página A4, desenha o fundo
      (cnh-modelo.jpeg), sobrepõe os textos (Helvetica / Helvetica-Bold,
      sempre em MAIÚSCULAS) e posiciona a foto do usuário.

   CORES
   -----
   - Textos padrão: preto rgb(0, 0, 0).
   - Campos em VERMELHO (rgb(1, 0, 0)): Validade (4b), Nº Registro (5),
     Cat. Hab (9).

   COORDENADAS (SISTEMA DE PONTOS DO PDF)
   --------------------------------------
   IMPORTANTE: a origem (0,0) do pdf-lib é no CANTO INFERIOR ESQUERDO
   da página. A página A4 tem 595 x 842 pt e a imagem de fundo preenche
   a página (aprox. 595 x 840). Todas as coordenadas abaixo são
   fornecidas DIRETAMENTE em pontos do PDF (origem bottom-left) e são
   usadas SEM conversão.

   Para facilitar futuros ajustes finos, todas as coordenadas ficam
   centralizadas no objeto CONFIG abaixo. Basta alterar um valor de
   x/y/size/color ali para reposicionar um campo.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Caminho do modelo (imagem de fundo) na raiz do projeto.
const MODELO_PATH = path.join(__dirname, 'cnh-modelo.jpeg');

// Dimensões reais da imagem de fundo (extraídas do cabeçalho JPEG).
const IMG_W = 1055;
const IMG_H = 1490;

// Cores usadas no preenchimento.
const COR_TEXTO = rgb(0, 0, 0);    // preto (textos padrão)
const COR_REGISTRO = rgb(1, 0, 0); // vermelho (validade 4b, registro 5, cat 9)

/* ============================================================
   CONFIGURAÇÃO DE COORDENADAS (PONTOS DO PDF — origem bottom-left)
   ------------------------------------------------------------
   Matriz rigorosa de COLUNAS (X) e LINHAS (Y) da CNH Nova (frente).
   A origem (0,0) do pdf-lib é no CANTO INFERIOR ESQUERDO.

   Cada campo em COORDENADAS: { x, y, color }.
   - x, y : posição em PONTOS do PDF (origem INFERIOR-ESQUERDA).
   - color: cor do texto. Campos em VERMELHO: validade, registro, categoria.

   O tamanho da fonte (size) é configurado globalmente em TAMANHO_FONTE.
   ============================================================ */

// Caminho do banco de coordenadas (JSON) usado para posicionar os textos e a
// foto sobre a imagem de fundo. Este arquivo é editável pela tela de
// calibragem (calibrar-cnh.html) via GET/POST /api/config/cnh.
const COORDENADAS_PATH = path.join(__dirname, 'cnh-coordenadas.json');

// Tamanho global da fonte para os textos (em pt).
const TAMANHO_FONTE = 10;

// Valores padrão (fallback) caso o arquivo cnh-coordenadas.json não exista
// ou esteja corrompido. Mantém o gerador funcional mesmo sem o JSON.
const CONFIG_PADRAO = {
  colunas: { esq: 330, meio: 480, dir: 550 },
  linhas: { row1: 675, row2: 645, row3: 615, row4: 585, row5: 555, row6: 525, row7: 495, row8: 480 },
  foto: { x: 55, y: 510, w: 155, h: 210 }
};

/**
 * Lê o banco de coordenadas (cnh-coordenadas.json) de forma dinâmica.
 * Se o arquivo não existir ou estiver inválido, usa os valores padrão.
 * @returns {object} config com { colunas, linhas, foto }.
 */
function lerConfigCoordenadas() {
  try {
    if (fs.existsSync(COORDENADAS_PATH)) {
      const bruto = JSON.parse(fs.readFileSync(COORDENADAS_PATH, 'utf8'));
      // Mescla com os padrões para garantir que todas as chaves existam.
      return {
        colunas: Object.assign({}, CONFIG_PADRAO.colunas, bruto.colunas || {}),
        linhas: Object.assign({}, CONFIG_PADRAO.linhas, bruto.linhas || {}),
        foto: Object.assign({}, CONFIG_PADRAO.foto, bruto.foto || {})
      };
    }
  } catch (e) {
    console.warn('[CNH-PDF] ⚠️ Falha ao ler cnh-coordenadas.json, usando padrões:', e && e.message ? e.message : e);
  }
  return CONFIG_PADRAO;
}

/**
 * Constrói o objeto COORDENADAS (posição de cada campo em pontos do PDF,
 * origem bottom-left) a partir do config lido do JSON.
 * @param {object} config - { colunas, linhas, foto }.
 * @returns {object} mapa de campos -> { x, y, color }.
 */
function construirCoordenadas(config) {
  const c = config.colunas;
  const r = config.linhas;
  const f = config.foto;
  return {
    foto:          { x: f.x, y: f.y, width: f.w, height: f.h },
    nome:          { x: c.esq, y: r.row1, color: rgb(0, 0, 0) },
    primeiraHab:   { x: c.dir, y: r.row1, color: rgb(0, 0, 0) },
    nascimento:    { x: c.esq, y: r.row2, color: rgb(0, 0, 0) },
    emissao:       { x: c.esq, y: r.row3, color: rgb(0, 0, 0) },
    validade:      { x: c.meio, y: r.row3, color: rgb(1, 0, 0) }, // VERMELHO
    docIdentidade: { x: c.esq, y: r.row4, color: rgb(0, 0, 0) },
    cpf:           { x: c.esq, y: r.row5, color: rgb(0, 0, 0) },
    registro:      { x: c.meio, y: r.row5, color: rgb(1, 0, 0) }, // VERMELHO
    categoria:     { x: c.dir, y: r.row5, color: rgb(1, 0, 0) }, // VERMELHO
    nacionalidade: { x: c.esq, y: r.row6, color: rgb(0, 0, 0) },
    filiacaoPai:   { x: c.esq, y: r.row7, color: rgb(0, 0, 0) },
    filiacaoMae:   { x: c.esq, y: r.row8, color: rgb(0, 0, 0) },
    local:         { x: 60, y: 110, color: rgb(0, 0, 0) } // Rodapé esquerdo (fixo)
  };
}

// ===== Utilitários =====

// Limpa um valor: converte para string e remove espaços das bordas.
function limpar(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

// Gera uma string com n letras maiúsculas aleatórias.
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

// Gera uma data no formato DD/MM/AAAA a partir de um offset de anos.
function gerarDataFutura(anos) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + anos);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return dd + '/' + mm + '/' + d.getFullYear();
}

// ===== 1. LEITURA DOS DADOS (PARSE DO TEXTO COLADO) =====

// Lista de campos reconhecidos no texto colado e seus sinônimos.
// Cada entrada: [chaveInterna, [rótulos possíveis no texto]].
const CAMPOS_TEXTO = [
  ['registro',   ['REGISTRO', 'Nº REGISTRO', 'NO REGISTRO', 'NUMERO REGISTRO', 'REGISTRO NACIONAL']],
  ['nome',       ['NOME', 'NOME DO CONDUTOR']],
  ['primeiraHabilitacao', ['1ª HABILITAÇÃO', '1A HABILITACAO', 'PRIMEIRA HABILITAÇÃO', 'PRIMEIRA HABILITACAO', '1ª HAB']],
  ['filiacao',   ['FILIAÇÃO', 'FILIACAO', 'FILIACÃO']],
  ['nascimento', ['DATA DE NASCIMENTO', 'NASCIMENTO', 'DATA NASCIMENTO']],
  ['local',      ['LOCAL', 'LOCAL DE NASCIMENTO', 'LOCAL DE EMISSÃO', 'LOCAL DE EMISSAO']],
  ['uf',         ['UF', 'UF DE NASCIMENTO']],
  ['nacionalidade', ['NACIONALIDADE']],
  ['cpf',        ['CPF']],
  ['rg',         ['RG', 'DOC. IDENTIDADE', 'DOC IDENTIDADE', 'CARTEIRA DE IDENTIDADE', 'IDENTIDADE']],
  ['validade',   ['VALIDADE', 'VALIDA ATÉ', 'VALIDA ATE']],
  ['categoria',  ['CATEGORIA', 'CAT', 'CAT. HAB', 'CAT HAB']],
  ['emissao',    ['EMISSÃO', 'EMISSAO', 'DATA DE EMISSÃO', 'DATA DE EMISSAO']],
  ['observacao', ['OBSERVAÇÃO', 'OBSERVACAO', 'OBS']]
];

/**
 * Extrai o valor de um campo a partir do texto colado.
 * Procura por "RÓTULO:" (case-insensitive) e captura o restante da linha.
 * @param {string} texto - texto completo colado no <textarea>.
 * @param {string[]} rotulos - possíveis rótulos do campo.
 * @returns {string} valor extraído (ou '' se não encontrado).
 */
function extrairCampo(texto, rotulos) {
  if (!texto) return '';
  const linhas = String(texto).split(/\r?\n/);
  for (const linha of linhas) {
    const t = linha.trim();
    for (const rotulo of rotulos) {
      // Aceita "RÓTULO: valor" com ou sem espaço após os dois-pontos.
      const re = new RegExp('^' + rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:\\-]\\s*(.+)$', 'i');
      const m = t.match(re);
      if (m && m[1] && m[1].trim()) {
        return m[1].trim();
      }
    }
  }
  return '';
}

/**
 * Faz o parse do texto colado no formato "CNH COMPLETA".
 * Identifica cada linha/campo e devolve um objeto com os valores.
 * @param {string} texto - texto colado no <textarea>.
 * @returns {object} objeto com os campos extraídos (chaves internas).
 */
function parseCnhTexto(texto) {
  const dados = {};
  for (const [chave, rotulos] of CAMPOS_TEXTO) {
    dados[chave] = extrairCampo(texto, rotulos);
  }
  return dados;
}

// ===== 2. FALLBACKS (VALORES PADRÃO REALISTAS) =====

/**
 * Normaliza os dados extraídos, aplicando fallbacks realistas para
 * qualquer campo que venha vazio — garantindo que o PDF nunca quebre.
 * @param {object} dados - dados crus (do parse ou do frontend).
 * @returns {object} dados completos com todos os campos preenchidos.
 */
function normalizarValores(dados) {
  const d = dados || {};
  const nome = limpar(d.nome) || 'NOME DO CONDUTOR';
  const partes = nome.split(/\s+/);
  const primeiroNome = partes[0] || 'NOME';
  const sobrenome = partes.length > 1 ? partes[partes.length - 1] : 'CONDUTOR';

  // Filiação pode vir como "PAI: X / MÃE: Y" ou "X E Y" ou apenas um nome.
  const filiacaoBruta = limpar(d.filiacao);
  let filiacaoPai = '';
  let filiacaoMae = '';
  if (filiacaoBruta) {
    // Tenta separar "Pai: ... / Mãe: ..." ou "Pai: ... Mãe: ...".
    const mPai = filiacaoBruta.match(/PAI\s*[:=]?\s*([^/]+)/i);
    const mMae = filiacaoBruta.match(/MÃE|MAE\s*[:=]?\s*([^/]+)/i);
    if (mPai) filiacaoPai = mPai[1].trim();
    if (mMae) filiacaoMae = mMae[1].trim();
    if (!filiacaoPai && !filiacaoMae) {
      // Sem rótulos: assume "Pai e Mãe" separados por " E " ou "/".
      const partesF = filiacaoBruta.split(/\s+E\s+|\s*\/\s*/i);
      filiacaoPai = (partesF[0] || '').trim();
      filiacaoMae = (partesF[1] || '').trim();
    }
  }
  if (!filiacaoPai) filiacaoPai = primeiroNome + ' ' + sobrenome + ' FILHO';
  if (!filiacaoMae) filiacaoMae = 'MÃE DO CONDUTOR';

  return {
    registro: limpar(d.registro) || (gerarNumerosAleatorios(11)),
    nome: nome,
    primeiraHabilitacao: limpar(d.primeiraHabilitacao) || gerarDataFutura(-10),
    filiacaoPai: filiacaoPai,
    filiacaoMae: filiacaoMae,
    nascimento: limpar(d.nascimento) || '01/01/1990',
    local: limpar(d.local) || 'SÃO PAULO',
    uf: limpar(d.uf) || 'SP',
    nacionalidade: limpar(d.nacionalidade) || 'BRASILEIRA',
    cpf: limpar(d.cpf) || (gerarNumerosAleatorios(3) + '.' + gerarNumerosAleatorios(3) + '.' + gerarNumerosAleatorios(3) + '-' + gerarNumerosAleatorios(2)),
    rg: limpar(d.rg) || (gerarNumerosAleatorios(2) + '.' + gerarNumerosAleatorios(3) + '.' + gerarNumerosAleatorios(3) + '-' + gerarNumerosAleatorios(1)),
    validade: limpar(d.validade) || gerarDataFutura(5),
    categoria: limpar(d.categoria) || 'B',
    emissao: limpar(d.emissao) || gerarDataFutura(-1),
    observacao: limpar(d.observacao) || 'ACESSO A CATEGORIA B'
  };
}

// ===== 3. GERAÇÃO DO PDF =====

// Trunca o texto para caber em maxWidth (com "..."), calculando a largura
// real com a fonte embedada — evita que valores longos estourem o campo.
function ajustarTexto(fonte, texto, size, maxWidth) {
  let t = String(texto);
  if (fonte.widthOfTextAtSize(t, size) <= maxWidth) return t;
  while (t.length > 1 && fonte.widthOfTextAtSize(t + '…', size) > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

/**
 * Gera o PDF da CNH preenchendo a imagem de fundo cnh-modelo.jpeg.
 * @param {object} dados - dados do condutor (texto já parseado ou cru).
 * @param {string|Buffer|null} fotoBase64 - foto do usuário (base64 ou Buffer).
 * @returns {Promise<Buffer>} bytes do PDF preenchido.
 * @throws {Error} se o cnh-modelo.jpeg não existir na raiz do projeto.
 */
async function gerarCnhPdf(dados, fotoBase64) {
  if (!fs.existsSync(MODELO_PATH)) {
    throw new Error('Arquivo cnh-modelo.jpeg não encontrado na raiz do projeto (' + MODELO_PATH + ').');
  }

  const modeloBytes = fs.readFileSync(MODELO_PATH);
  const pdfDoc = await PDFDocument.create();

  // Página A4 retrato (595 x 842 pt).
  const page = pdfDoc.addPage([595, 842]);

  // Embeda a imagem de fundo (JPEG).
  const fundoImg = await pdfDoc.embedJpg(modeloBytes);

  // Escala para caber na largura da página (595 pt).
  const escala = page.getWidth() / IMG_W;
  const desenhoW = IMG_W * escala;
  const desenhoH = IMG_H * escala;

  // Desenha o fundo centralizado horizontalmente, ancorado no topo.
  page.drawImage(fundoImg, {
    x: (page.getWidth() - desenhoW) / 2,
    y: page.getHeight() - desenhoH,
    width: desenhoW,
    height: desenhoH
  });

  // Fontes Helvetica (padrão) e Helvetica-Bold (destaques).
  const fonte = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fonteBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const d = normalizarValores(dados);

  // Lê o banco de coordenadas (cnh-coordenadas.json) de forma dinâmica e
  // constrói o mapa de posições de cada campo. Assim, ajustes feitos na tela
  // de calibragem (calibrar-cnh.html) são aplicados sem recompilar o código.
  const config = lerConfigCoordenadas();
  const COORDENADAS = construirCoordenadas(config);

  // Desenha os campos de texto sobre o fundo.
  // As coordenadas em COORDENADAS já estão em PONTOS do PDF (origem
  // bottom-left), portanto são usadas DIRETAMENTE, sem conversão pixel->ponto.
  // O tamanho da fonte é global (TAMANHO_FONTE). A cor é estrita por campo:
  // validade, registro e categoria usam VERMELHO rgb(1,0,0); os demais, preto.
  const mapaChaves = {
    nome: 'nome',
    primeiraHab: 'primeiraHabilitacao',
    nascimento: 'nascimento',
    emissao: 'emissao',
    validade: 'validade',
    docIdentidade: 'rg',
    cpf: 'cpf',
    registro: 'registro',
    categoria: 'categoria',
    nacionalidade: 'nacionalidade',
    filiacaoPai: 'filiacaoPai',
    filiacaoMae: 'filiacaoMae',
    local: 'local'
  };

  for (const chave of Object.keys(COORDENADAS)) {
    if (chave === 'foto') continue; // a foto é desenhada separadamente
    const conf = COORDENADAS[chave];
    const chaveDados = mapaChaves[chave] || chave;
    const valor = d[chaveDados];
    if (!valor) continue;

    const texto = ajustarTexto(fonte, valor.toUpperCase(), TAMANHO_FONTE, 300);

    page.drawText(texto, {
      x: conf.x,
      y: conf.y,
      size: TAMANHO_FONTE,
      font: fonte,
      // Cor estrita por campo: validade, registro e categoria em VERMELHO.
      color: conf.color || COR_TEXTO
    });
  }

  // Desenha a foto do usuário na área do rosto da CNH.
  if (fotoBase64) {
    try {
      let fotoBytes;
      if (Buffer.isBuffer(fotoBase64)) {
        fotoBytes = fotoBase64;
      } else {
        // Aceita base64 com ou sem prefixo "data:image/...;base64,".
        const b64 = String(fotoBase64).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
        fotoBytes = Buffer.from(b64, 'base64');
      }

      // Detecta o tipo da imagem (JPEG ou PNG) e embeda.
      let fotoImg;
      const head = fotoBytes.slice(0, 4);
      if (head[0] === 0x89 && head[1] === 0x50) {
        fotoImg = await pdfDoc.embedPng(fotoBytes);
      } else {
        fotoImg = await pdfDoc.embedJpg(fotoBytes);
      }

      // Preserva a proporção da foto (sem distorcer): calcula a maior
      // largura/altura que cabem no retângulo FOTO mantendo o aspect ratio
      // da imagem original e centraliza dentro do retângulo.
      const fotoW = fotoImg.width;
      const fotoH = fotoImg.height;
      const boxW = COORDENADAS.foto.width;  // largura do retângulo em pontos
      const boxH = COORDENADAS.foto.height; // altura do retângulo em pontos
      const ratio = Math.min(boxW / fotoW, boxH / fotoH);
      const drawW = fotoW * ratio;
      const drawH = fotoH * ratio;

      // Centraliza horizontalmente dentro do retângulo e ancora na base.
      // COORDENADAS.foto.y é a base (canto inferior) do retângulo em pontos.
      const drawX = COORDENADAS.foto.x + (boxW - drawW) / 2;
      const drawY = COORDENADAS.foto.y;

      page.drawImage(fotoImg, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH
      });
    } catch (e) {
      // Se a foto for inválida, apenas não a desenha (não quebra o PDF).
      console.warn('[CNH-PDF] ⚠️ Não foi possível desenhar a foto:', e && e.message ? e.message : e);
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// Exporta o gerador principal e utilitários (para depuração/ajuste).
module.exports = {
  gerarCnhPdf,
  parseCnhTexto,
  normalizarValores,
  lerConfigCoordenadas,
  construirCoordenadas,
  COORDENADAS_PATH,
  CONFIG_PADRAO,
  MODELO_PATH,
  IMG_W,
  IMG_H
};
