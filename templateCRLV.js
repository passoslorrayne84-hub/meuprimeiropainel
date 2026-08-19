(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CRLVTemplate = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  'use strict';

  // ===== HELPERS =====

  // Escapa caracteres especiais para uso seguro em HTML.
  function esc(v) {
    if (v === undefined || v === null) return '';
    // Constrói as entidades em runtime ('&' + 'amp;' -> &) para evitar
    // que sejam interpretadas no código-fonte.
    return String(v)
      .replace(/&/g, '&' + 'amp;')
      .replace(/</g, '&' + 'lt;')
      .replace(/>/g, '&' + 'gt;')
      .replace(/"/g, '&' + 'quot;')
      .replace(/'/g, '&' + '#39;');
  }

  // Formata CPF/CNPJ (11 -> CPF, 14 -> CNPJ).
  function formatarCpfCnpj(v) {
    const s = String(v || '').replace(/\D/g, '');
    if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return String(v || '');
  }

  // Formata data (YYYY-MM-DD -> DD/MM/YYYY).
  function formatarData(v) {
    const s = String(v || '');
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[3] + '/' + m[2] + '/' + m[1];
    return s;
  }

  // Rótulo (.label 6px #555) + valor (.value 9px bold #000).
  function labelValor(rotulo, valor) {
    const vazio = (valor === undefined || valor === null || String(valor).trim() === '');
    return '<span class="label">' + esc(rotulo) + '</span>' +
      '<span class="value' + (vazio ? ' vazio' : '') + '">' + (vazio ? '' : esc(valor)) + '</span>';
  }

  // Linha simples (.linha) usada na coluna esquerda e em células.
  function campoLinha(rotulo, valor) {
    return '<div class="linha">' + labelValor(rotulo, valor) + '</div>';
  }

  // Célula de dado do topo (dentro das linhas duplas da coluna esquerda).
  function campoCelula(rotulo, valor) {
    return '<div class="dados-topo-cell">' + labelValor(rotulo, valor) + '</div>';
  }

  // Campo da coluna direita (preenche a altura via flex).
  function campo(rotulo, valor, extraClasse) {
    return '<div class="campo-linha' + (extraClasse ? ' ' + extraClasse : '') + '">' +
      labelValor(rotulo, valor) + '</div>';
  }

  // ===== BRASÃO DA REPÚBLICA (<img> com URL pública + fallback inline) =====
  // Usa uma URL pública provisória do brasão; se a rede não estiver
  // disponível (geração de PDF offline), troca para um SVG embutido.
  function brasaoImg() {
    // Fallback: escudo estilizado (verde/amarelo) em SVG data-URI.
    const fallback = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<circle cx="50" cy="50" r="48" fill="#ffe11b"/>' +
      '<circle cx="50" cy="50" r="36" fill="#009c3b"/>' +
      '<path d="M50 28 L62 70 L38 70 Z" fill="#002776"/>' +
      '<rect x="46" y="32" width="8" height="10" fill="#fff"/>' +
      '</svg>');
    return '<img class="crlv-brasao" ' +
      'src="https://upload.wikimedia.org/wikipedia/commons/8/85/Coat_of_arms_of_Brazil.svg" ' +
      'alt="Brasão da República" ' +
      'onerror="this.onerror=null;this.src=\'' + fallback + '\'"/>';
  }

  // ===== QR CODE (placeholder desenhado em SVG data-URI) =====
  // Gera um grid 21x21 com padrão determinístico (QR-like) e devolve
  // uma tag <img> (width:90%; aspect-ratio:1/1; object-fit:contain),
  // exatamente como especificado pelo cliente.
  function gerarQrImg(seed) {
    let s = seed || 7;
    // PRNG determinístico simples (mulberry32)
    const rand = function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const N = 21;
    // Pré-computa o padrão (1 = preto)
    const grid = [];
    for (let i = 0; i < N; i++) {
      grid[i] = [];
      for (let j = 0; j < N; j++) {
        grid[i][j] = rand() > 0.55 ? 1 : 0;
      }
    }

    // Finder patterns (3 cantos: 7x7 com borda preta, anel branco, núcleo preto)
    const pintarFinder = function (top, left) {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const naBorda = (i === 0 || i === 6 || j === 0 || j === 6);
          const noNucleo = (i >= 2 && i <= 4 && j >= 2 && j <= 4);
          grid[top + i][left + j] = (naBorda || noNucleo) ? 1 : 0;
        }
      }
      // Espaço separador ao redor do finder (branco)
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          if (top + i >= 0 && top + i < N && left + j >= 0 && left + j < N) {
            const interno = (i >= 0 && i <= 6 && j >= 0 && j <= 6);
            if (!interno) grid[top + i][left + j] = 0;
          }
        }
      }
    };
    pintarFinder(0, 0);
    pintarFinder(0, N - 7);
    pintarFinder(N - 7, 0);

    // Monta o SVG do QR (viewBox 21x21) e embute como data-URI.
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (N * 10) + '" height="' + (N * 10) +
      '" viewBox="0 0 ' + N + ' ' + N + '" shape-rendering="crispEdges">';
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (grid[i][j]) svg += '<rect x="' + j + '" y="' + i + '" width="1" height="1" fill="#000"/>';
      }
    }
    svg += '</svg>';
    const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return '<img class="qr-imagem" src="' + uri + '" alt="QR Code"/>';
  }

  // ===== CÓDIGO DE BARRAS NUMÉRICO (desenhado em CSS) =====
  // Gera barras de larguras variadas, deterministicamente a partir do seed.
  function gerarCodigoBarras(seed) {
    let s = String(seed || '0123456789');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) >>> 0;

    let html = '<div class="codigo-barras-bars">';
    for (let i = 0; i < 64; i++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const w = 1 + (h % 3);
      const on = ((h >> 6) & 1) === 1;
      html += '<span class="' + (on ? 'barra' : 'espaco') + '" style="width:' + w + 'px;"></span>';
    }
    html += '</div>';
    html += '<div class="codigo-barras-num">' + esc(s) + '</div>';
    return html;
  }

  // ===== LINHA DA TABELA DPVAT (checkbox desenhado em CSS) =====
  function dpvatLinha(marcado, texto) {
    return '<div class="dpvat-linha">' +
      '<span class="dpvat-check' + (marcado ? ' on' : '') + '"></span>' +
      '<span class="dpvat-texto">' + esc(texto) + '</span>' +
      '</div>';
  }

  // ===== NORMALIZAÇÃO DOS DADOS =====
  function normalizar(dados) {
    const d = dados || {};
    const limpar = function (v) {
      if (v === undefined || v === null) return '';
      return String(v).trim();
    };
    const municipio = limpar(d.municipio || d.cidade || d.local);
    const uf = limpar(d.uf);
    return {
      placa: limpar(d.placa),
      renavam: limpar(d.renavam),
      exercicio: limpar(d.exercicio),
      anoFabricacao: limpar(d.anoFabricacao || d.ano || d.anoFabricacao),
      anoModelo: limpar(d.anoModelo),
      marcaModelo: limpar(d.marcaModelo || d.marca || d.modelo || ((d.marca && d.modelo) ? d.marca + ' ' + d.modelo : '')),
      chassi: limpar(d.chassi),
      cor: limpar(d.cor),
      combustivel: limpar(d.combustivel || d.combustivel),
      especieTipo: limpar(d.especieTipo || d.especie || d.espécie || d.tipo || ((d.especie && d.tipo) ? d.especie + ' / ' + d.tipo : '')),
      categoria: limpar(d.categoria),
      capacidade: limpar(d.capacidade),
      potenciaCilindrada: limpar(d.potenciaCilindrada || d.potencia || d.potência || d.cilindradas || ((d.potencia && d.cilindradas) ? d.potencia + '/' + d.cilindradas : '')),
      pesoBruto: limpar(d.pesoBruto || d.pesoBrutoTotal),
      motor: limpar(d.motor),
      carroceria: limpar(d.carroceria),
      eixos: limpar(d.eixos),
      cmt: limpar(d.cmt || d.cmtT || d.cmtToneladas),
      lotacao: limpar(d.lotacao || d.lotação),
      situacao: limpar(d.situacao),
      numeroCrv: limpar(d.numeroCrv || d.crv || d.numeroDoCrv),
      codigoSeguranca: limpar(d.codigoSeguranca || d.codigoDeSeguranca || d.cla || d.codigoSegurancaCla),
      codigoHash: limpar(d.codigoHash || d.hash || d.codigoHashSeguranca || d.hashSeguranca),
      placaAnteriorUf: limpar(d.placaAnteriorUf || d.placaAnterior || d.placaAnteriorUF),
      restricao: limpar(d.restricao),
      nome: limpar(d.nome || d.proprietario || d.proprietário),
      cpfCnpj: formatarCpfCnpj(d.cpfCnpj || d.cpf || d.cnpj || d.documento),
      endereco: limpar(d.endereco),
      bairro: limpar(d.bairro),
      cep: limpar(d.cep),
      municipioUf: municipio + (uf ? ' / ' + uf : ''),
      local: limpar(d.local),
      data: formatarData(d.data || d.dataEmissao || d.dataEmissão),
      detran: limpar(d.detran || d.orgaoEmissor || (uf ? 'DETRAN - ' + uf : 'DETRAN - SP')),
      observacoes: limpar(d.observacoes || d.observacoesVeiculo || d.observações),
      mensagensSenatran: limpar(d.mensagensSenatran || d.mensagemSenatran || d.mensagens),
      dpvat: limpar(d.dpvat || d.seguroDpvat || d.dadosDpvat)
    };
  }

  // ===== CSS DO DOCUMENTO (CRLV-E SENATRAN - CÓPIA EXATA) =====
  function cssDocumento() {
    return `
  <style>
    @page { size: A4 landscape; margin: 0; }

    /* ---------- CSS GLOBAL OBRIGATÓRIO ---------- */
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Arial', sans-serif; text-transform: uppercase; }
    body { width: 100%; height: 100vh; background: #fff; padding: 10px; }
    .label { font-size: 6px; color: #555; display: block; }
    .value { font-size: 9px; font-weight: bold; color: #000; margin-top: 1px; }
    .value.vazio { color: transparent; }
    .linha { border-bottom: 1px solid #000; width: 100%; padding: 2px 4px; }
    .coluna-container { display: flex; width: 100%; height: 85vh; border: 1px solid #000; }
    .col-esquerda, .col-direita { width: 50%; height: 100%; }
    .col-esquerda { border-right: 1px dashed #000; }

    /* ---------- CABEÇALHO OFICIAL ---------- */
    .cabecalho-escuro {
      background-color: #222; color: #fff; padding: 8px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .cabecalho-esq { display: flex; align-items: center; gap: 8px; }
    .crlv-brasao { width: 26px; height: 26px; object-fit: contain; flex: 0 0 auto; }
    .cabecalho-org {
      display: flex; flex-direction: column;
      font-size: 8px; font-weight: 700;
      line-height: 1.3; letter-spacing: 0.3px;
    }
    .cabecalho-gov { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }

    .subtitulo {
      background: #fff; color: #000;
      display: flex; align-items: center;
      padding: 5px 10px; border-bottom: 1px solid #000;
    }
    .subtitulo-detran { font-size: 11px; font-weight: 800; white-space: nowrap; }
    .subtitulo-titulo { flex: 1; text-align: center; font-size: 9px; font-weight: 800; letter-spacing: 0.4px; }

    /* ---------- BLOCO DO QR CODE (CSS GRID 65% / 35%) ---------- */
    .bloco-topo-esq { display: grid; grid-template-columns: 65% 35%; border-bottom: 1px solid #000; }
    .dados-topo-esq { display: flex; flex-direction: column; min-height: 0; }
    .dados-topo-linha {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
      border-bottom: 1px solid #000; padding: 2px 4px; overflow: hidden;
    }
    .dados-topo-linha:last-child { border-bottom: none; }
    .dados-topo-dupla { flex-direction: row; padding: 0; }
    .dados-topo-cell {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
      border-right: 1px solid #000; padding: 2px 4px; overflow: hidden;
    }
    .dados-topo-cell:last-child { border-right: none; }
    .qr-topo-dir {
      border-left: 1px solid #000; position: relative; padding: 5px;
      display: flex; justify-content: center; align-items: center;
    }
    .qr-imagem { width: 90%; aspect-ratio: 1/1; object-fit: contain; display: block; }

    /* ---------- COLUNA DIREITA ---------- */
    .col-direita { display: flex; flex-direction: column; min-height: 0; }
    .codigo-barras { border-bottom: 1px solid #333; padding: 4px 6px 5px; flex: 0 0 auto; }
    .codigo-barras-bars { display: flex; height: 16px; width: 100%; overflow: hidden; }
    .codigo-barras-bars .barra { background: #000; flex: 0 0 auto; }
    .codigo-barras-bars .espaco { background: #fff; flex: 0 0 auto; }
    .codigo-barras-num {
      font-family: 'Courier New', Courier, monospace;
      font-size: 8px; letter-spacing: 1px; margin-top: 3px; text-align: center;
    }
    .campo-linha {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
      border-bottom: 1px solid #333; padding: 3px 6px; overflow: hidden;
    }
    .campo-dupla { display: flex; }
    .campo-dupla .campo-linha { flex: 1; }
    .campo-dupla .campo-linha.borda-direita { border-right: 1px solid #333; }
    .assinado {
      flex: 0 0 auto; font-size: 8px; font-weight: 800; text-align: center;
      margin-top: 4px; padding: 4px 6px; border-top: 1px solid #000;
    }

    /* ---------- DADOS DO SEGURO DPVAT ---------- */
    .dpvat { flex: 0 0 auto; border: 1px solid #000; margin: 6px; background: #fff; }
    .dpvat-titulo { border-bottom: 1px solid #000; padding: 3px 6px; font-size: 8px; font-weight: 800; letter-spacing: 0.3px; }
    .dpvat-linha { display: flex; align-items: center; gap: 6px; padding: 2px 6px; border-bottom: 1px solid #333; }
    .dpvat-linha:last-child { border-bottom: none; }
    .dpvat-check { width: 8px; height: 8px; border: 1px solid #000; background: #fff; position: relative; flex: 0 0 auto; }
    .dpvat-check.on::after { content: ''; position: absolute; left: 1px; top: 1px; width: 4px; height: 4px; background: #000; }
    .dpvat-texto { font-size: 7px; line-height: 1.25; }
  </style>`;
  }

  // ===== CORPO DO DOCUMENTO (CRLV-E SENATRAN - CÓPIA EXATA) =====
  function corpo(d, modelo) {
    const seedQr = d.chassi ? d.chassi.length * 7 + d.renavam.length * 3 + 7 : 7;
    const seedBar = (d.renavam || d.placa || '0123456789') + (d.placa || '');
    const textoDpvat = d.dpvat || '';

    const dpvatRows =
      dpvatLinha(true, 'Dano pessoal causado por veículos automotores de via terrestre (ou por sua carga a pessoas transportadas ou não)') +
      dpvatLinha(true, 'Dano material causado por veículos automotores de via terrestre (ou por sua carga)') +
      dpvatLinha(true, 'Dano moral') +
      dpvatLinha(true, 'Dano estético') +
      (textoDpvat ? dpvatLinha(true, textoDpvat) : '');

    return `
  <!-- ===== CABEÇALHO OFICIAL: barra escura + BRASÃO + gov.br ===== -->
  <div class="cabecalho-escuro">
    <div class="cabecalho-esq">
      ${brasaoImg()}
      <div class="cabecalho-org">
        <span>República Federativa do Brasil</span>
        <span>Ministério dos Transportes</span>
        <span>Secretaria Nacional de Trânsito - Senatran</span>
      </div>
    </div>
    <div class="cabecalho-gov">gov.br</div>
  </div>

  <!-- ===== SUBTÍTULO: DETRAN + título do certificado ===== -->
  <div class="subtitulo">
    <div class="subtitulo-detran">${esc(d.detran || 'DETRAN - SP')}</div>
    <div class="subtitulo-titulo">Certificado de Registro e Licenciamento de Veículo - Digital</div>
  </div>

  <!-- ===== CORPO: 2 COLUNAS VERTICAIS ===== -->
  <div class="coluna-container">

    <!-- ===== COLUNA DA ESQUERDA (50%) ===== -->
    <div class="col-esquerda">

      <!-- Bloco do QR Code (topo): CSS Grid 65% dados + 35% QR -->
      <div class="bloco-topo-esq">
        <div class="dados-topo-esq">
          <div class="dados-topo-linha">
            ${labelValor('Código Renavam', d.renavam)}
          </div>
          <div class="dados-topo-linha dados-topo-dupla">
            ${campoCelula('Placa', d.placa)}
            ${campoCelula('Exercício', d.exercicio)}
          </div>
          <div class="dados-topo-linha dados-topo-dupla">
            ${campoCelula('Ano Fabricação', d.anoFabricacao)}
            ${campoCelula('Ano Modelo', d.anoModelo)}
          </div>
        </div>

        <!-- Caixa do QR Code (35%) com <img> e texto vertical -->
        <div class="qr-topo-dir">
          <span style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%) rotate(-90deg); font-size: 5px;">Valide este QRCode com app Vio</span>
          ${gerarQrImg(seedQr)}
        </div>
      </div>

      <!-- Linhas abaixo do bloco do QR Code (até preencher a coluna) -->
      ${campoLinha('Nº CRV', d.numeroCrv)}
      ${campoLinha('Chassi', d.chassi)}
      ${campoLinha('Cor Predominante', d.cor)}
      ${campoLinha('Marca / Modelo / Versão', d.marcaModelo)}
      ${campoLinha('Combustível', d.combustivel)}
      ${campoLinha('Espécie / Tipo', d.especieTipo)}
    </div>

    <!-- ===== COLUNA DA DIREITA (50%) ===== -->
    <div class="col-direita">
      <!-- Código de barras numérico no topo -->
      <div class="codigo-barras">
        ${gerarCodigoBarras(seedBar)}
      </div>

      ${campo('Categoria', d.categoria)}
      ${campo('Capacidade', d.capacidade)}
      ${campo('Potência / Cilindrada', d.potenciaCilindrada)}
      ${campo('Peso Bruto Total', d.pesoBruto)}
      ${campo('Motor', d.motor)}
      ${campo('CMT', d.cmt)}
      ${campo('Eixos', d.eixos)}
      ${campo('Lotação', d.lotacao)}
      ${campo('Carroceria', d.carroceria)}
      ${campo('Nome', d.nome)}
      ${campo('CPF / CNPJ', d.cpfCnpj)}
      <div class="campo-dupla">
        ${campo('Local', d.local, 'borda-direita')}
        ${campo('Data', d.data)}
      </div>

      <div class="assinado">Assinado Digitalmente pelo Detran</div>

      <!-- Dados do Seguro DPVAT -->
      <div class="dpvat">
        <div class="dpvat-titulo">Dados do Seguro DPVAT</div>
        ${dpvatRows}
      </div>
    </div>
  </div>`;
  }

  // ===== GERA O HTML COMPLETO (documento inteiro para o Puppeteer) =====
  // opcoes.fragmento === true  -> retorna só <style> + corpo (para preview no navegador)
  // opcoes.fragmento === false -> retorna documento HTML completo (para page.setContent)
  function gerarCrlvHtml(dados, modelo, opcoes) {
    const d = normalizar(dados);
    const opts = opcoes || {};
    const css = cssDocumento();

    if (opts.fragmento) {
      return css + '\n' + corpo(d, modelo);
    }

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>CRLV-e Digital</title>
${css}
</head>
<body>
${corpo(d, modelo)}
</body>
</html>`;
  }

  // Retorna o corpo do documento (sem <style>), útil para testes.
  function gerarCrlvCorpo(dados, modelo) {
    return corpo(normalizar(dados), modelo);
  }

  return {
    gerarCrlvHtml: gerarCrlvHtml,
    gerarCrlvCorpo: gerarCrlvCorpo,
    formatarCpfCnpj: formatarCpfCnpj,
    formatarData: formatarData
  };
});
