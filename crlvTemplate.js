/* ============================================================
   crlvTemplate.js
   Template HTML do CRLV Digital brasileiro (réplica do layout oficial).
   Recebe os dados normalizados do veículo e retorna uma Template String HTML
   que será renderizada pelo Puppeteer para gerar o PDF em A4.

   IMPORTANTE: o HTML usa o TEMPLATE REAL enviado pelo painel admin como fundo
   (via /api/template/image?modelo=...), com os dados posicionados por cima
   usando as MESMAS coordenadas percentuais do preview do painel admin.
   Isso garante que o PDF baixado seja idêntico ao que aparece no painel.
   ============================================================ */

// Escapa caracteres especiais para uso seguro em HTML
function esc(v) {
  if (v === undefined || v === null) return '';
  return String(v)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

// Formata CPF/CNPJ (11 -> CPF, 14 -> CNPJ)
function formatarCpfCnpj(v) {
  const s = esc(v).replace(/\D/g, '');
  if (s.length === 11) {
    return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (s.length === 14) {
    return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return esc(v);
}

// Formata a data (YYYY-MM-DD -> DD/MM/YYYY)
function formatarData(v) {
  const s = esc(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  return s;
}

// Campo posicionado por cima do template (position:absolute com %)
function campoAbs(rotulo, valor, left, top) {
  const vazio = (valor === undefined || valor === null || String(valor).trim() === '');
  return `
    <div class="crlv-field" style="left:${left};top:${top};">
      <span class="crlv-label">${esc(rotulo)}: </span>
      <span class="crlv-value${vazio ? ' empty' : ''}">${vazio ? '' : esc(valor)}</span>
    </div>`;
}

// Gera o HTML completo do CRLV usando o template real como fundo.
// modelo: 'uber' | '99' (define qual template do painel admin usar como fundo)
function gerarCrlvHtml(dados, modelo) {
  const d = dados || {};
  const m = String(modelo || 'uber').toLowerCase();

  // Campos principais
  const placa = esc(d.placa);
  const renavam = esc(d.renavam);
  const exercicio = esc(d.exercicio);
  const anoFabr = esc(d.anoFabricacao);
  const anoModelo = esc(d.anoModelo);
  const marcaModelo = esc(d.marcaModelo);
  const chassi = esc(d.chassi);
  const cor = esc(d.cor);
  const combustivel = esc(d.combustivel);
  const especieTipo = esc(d.especieTipo);
  const categoria = esc(d.categoria);
  const capacidade = esc(d.capacidade);
  const potenciaCil = esc(d.potenciaCilindrada);
  const pesoBruto = esc(d.pesoBruto);
  const motor = esc(d.motor);
  const carroceria = esc(d.carroceria);
  const eixos = esc(d.eixos);
  const situacao = esc(d.situacao);
  const numeroCrv = esc(d.numeroCrv);
  const codSeguranca = esc(d.codigoSeguranca);
  const placaAnt = esc(d.placaAnteriorUf);
  const restricao = esc(d.restricao);

  // Dados do proprietário
  const nome = esc(d.nome);
  const cpfCnpj = formatarCpfCnpj(d.cpfCnpj || d.documento);
  const endereco = esc(d.endereco);
  const bairro = esc(d.bairro);
  const cep = esc(d.cep);
  const municipio = esc(d.municipio || d.cidade || d.local);
  const uf = esc(d.uf);
  const local = esc(d.local);
  const data = formatarData(d.data || d.dataEmissao);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>CRLV Digital</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; height: 297mm; background: #fff; }
  body { position: relative; overflow: hidden; }

  /* Template real do painel admin como fundo */
  .crlv-bg {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center center; display: block;
  }

  /* Campos de dados posicionados por cima do template (absolute, %) */
  .crlv-field {
    position: absolute; font-family: 'Courier New', Courier, monospace;
    font-weight: bold; text-transform: uppercase; font-size: 10.5px;
    line-height: 1.15; color: #000; letter-spacing: 0.2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 80%;
  }
  .crlv-field .crlv-label { display: none; }
  .crlv-field .crlv-value.empty { color: transparent; }
</style>
</head>
<body>
  <!-- Template oficial como fundo (mesmo do preview do painel admin) -->
  <img class="crlv-bg" src="/api/template/image?modelo=${m}" alt="" />

  <!-- Dados posicionados por cima do template (mesmas coordenadas do preview) -->
  ${campoAbs('PLACA', placa, '62%', '3.2%')}
  ${campoAbs('RENAVAM', renavam, '62%', '6.2%')}
  ${campoAbs('EXERCÍCIO', exercicio, '8%', '11.5%')}
  ${campoAbs('ANO FABR.', anoFabr, '8%', '14.5%')}
  ${campoAbs('ANO MODELO', anoModelo, '8%', '17.5%')}
  ${campoAbs('MARCA/MODELO', marcaModelo, '8%', '20.5%')}
  ${campoAbs('CHASSI', chassi, '8%', '23.5%')}
  ${campoAbs('COR', cor, '8%', '26.5%')}
  ${campoAbs('COMBUSTÍVEL', combustivel, '8%', '29.5%')}
  ${campoAbs('ESPÉCIE/TIPO', especieTipo, '8%', '32.5%')}
  ${campoAbs('CATEGORIA', categoria, '8%', '35.5%')}
  ${campoAbs('CAPACIDADE', capacidade, '8%', '38.5%')}
  ${campoAbs('POTÊNCIA/CIL.', potenciaCil, '8%', '41.5%')}
  ${campoAbs('PESO BRUTO', pesoBruto, '8%', '44.5%')}
  ${campoAbs('MOTOR', motor, '8%', '47.5%')}
  ${campoAbs('CARROCERIA', carroceria, '8%', '50.5%')}
  ${campoAbs('EIXOS', eixos, '8%', '53.5%')}
  ${campoAbs('SITUAÇÃO', situacao, '8%', '56.5%')}
  ${campoAbs('Nº CRV', numeroCrv, '8%', '59.5%')}
  ${campoAbs('CÓD. SEGURANÇA', codSeguranca, '8%', '62.5%')}
  ${campoAbs('PLACA ANT./UF', placaAnt, '8%', '65.5%')}
  ${campoAbs('RESTRIÇÃO', restricao, '8%', '68.5%')}

  <!-- Dados do proprietário (parte inferior do CRLV) -->
  ${campoAbs('NOME', nome, '8%', '74%')}
  ${campoAbs('CPF/CNPJ', cpfCnpj, '8%', '77%')}
  ${campoAbs('ENDEREÇO', endereco, '8%', '80%')}
  ${campoAbs('BAIRRO', bairro, '8%', '83%')}
  ${campoAbs('CEP', cep, '8%', '86%')}
  ${campoAbs('MUNICÍPIO/UF', (municipio + (uf ? ' / ' + uf : '')), '8%', '89%')}
  ${campoAbs('LOCAL', local, '8%', '92%')}
  ${campoAbs('DATA', data, '8%', '95%')}
</body>
</html>`;
}

module.exports = { gerarCrlvHtml };
