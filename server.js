/* ============================================================
   ESPAÇO UBER - SERVIDOR DE DESENVOLVIMENTO COM LIVE-RELOAD
   Serve os arquivos estáticos e recarrega as páginas
   automaticamente quando os códigos são alterados.
   ============================================================ */

'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
// Controller isolado da API LosDados (proxy server-to-server).
const losdadosController = require('./api_losdados_controller');
// Puppeteer: geração de PDF via HTML-to-PDF (CRLV Digital) com 100% de precisão visual.
const puppeteer = require('puppeteer');
// Template do CRLV Digital 100% HTML/CSS (sem PDF ou imagem externa).
const { gerarCrlvHtml } = require('./templateCRLV');
// pdf-lib: preenche o crlv-modelo.pdf (arquivo oficial na raiz) com os dados do
// veículo nas coordenadas X/Y mapeadas — geração rápida sem Chromium.
const { gerarCrlvPdfComPdfLib, MODELO_PATH } = require('./crlvPdfLib');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// MIME types para servir os arquivos corretamente
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

/* ===== GERADOR DE PDF VIA PUPPETEER (HTML-TO-PDF) =====
   Recebe o HTML do CRLV (gerado pelo templateCRLV.js, 100% HTML/CSS) e o
   imprime em PDF A4 usando Chromium headless. Nenhum arquivo PDF ou imagem
   externa é necessário: o documento é desenhado inteiramente via CSS. */
async function gerarPdfDoHtml(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    // O HTML do templateCRLV.js é 100% inline (sem recursos externos):
    // 'domcontentloaded' é imediato e evita timeouts do 'networkidle0'.
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
    // Margens 0: o próprio HTML (templateCRLV.js) define @page A4 landscape e
    // o corpo com 297mm x 210mm, garantindo que o texto caia nas caixas.
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/* ===== SERVIDOR HTTP ===== */
const server = http.createServer((req, res) => {
  // Normaliza a URL
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // ===== ENDPOINT: GERAR PDF (CRLV UBER / 99) =====
  // Gera o CRLV Digital 100% via HTML/CSS (templateCRLV.js) e o imprime em PDF
  // A4 com o Puppeteer. A antiga abordagem (carregar arquivo PDF externo como
  // template e injetar dados nos campos AcroForm) foi REMOVIDA — o documento
  // é desenhado inteiramente por CSS, sem coordenadas externas.
  if (req.method === 'POST' && urlPath === '/api/generate-pdf') {
    console.log('[PDF] 📥 Endpoint /api/generate-pdf ACESSADO (POST).');
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const dados = JSON.parse(body || '{}');
        const modelo = String(dados.modelo || 'uber').toLowerCase();
        const veiculo = dados.veiculo || {};
        console.log('[PDF] 🔍 modelo =', modelo, '| veiculo chaves:', Object.keys(veiculo).length);

        // Gera o HTML do CRLV (100% CSS) e imprime com o Puppeteer.
        const html = gerarCrlvHtml(veiculo, modelo);
        console.log('[PDF] 🧱 HTML gerado (' + html.length + ' caracteres).');
        const pdfBytes = await gerarPdfDoHtml(html);

        const nomeArquivo = 'CRLV_' + String(veiculo.placa || 'veiculo').toUpperCase() + '_' + modelo.toUpperCase() + '.pdf';
        console.log('[PDF] 📄 PDF gerado com sucesso (' + pdfBytes.length + ' bytes). Arquivo: ' + nomeArquivo);

        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="' + nomeArquivo + '"',
          'Content-Length': pdfBytes.length
        });
        res.end(pdfBytes);
      } catch (e) {
        console.warn('[PDF] ❌ Erro ao gerar PDF:', e && e.message ? e.message : e);
        console.warn('[PDF] ❌ Stack trace:', e && e.stack ? e.stack : '(sem stack)');
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, erro: 'Erro ao gerar o PDF: ' + (e && e.message ? e.message : 'erro desconhecido.') }));
      }
    });
    return;
  }

  // ===== ENDPOINT: UPLOAD DE TEMPLATE PDF (UBER / 99) =====
  // Recebe o arquivo PDF enviado pelo Painel Admin e salva em
  // uploads/templates/template_uber.pdf ou template_99.pdf conforme o modelo.
  // Aceita tanto o corpo binário puro (curl) quanto multipart/form-data (FormData).
  // Aceita POST (upload) e OPTIONS (preflight CORS). O preflight é disparado
  // pelo navegador quando o fetch usa o header customizado X-Template-Model.
  if (urlPath === '/api/template/upload') {
    // Headers CORS para permitir o upload mesmo de origens diferentes (ex: file://)
    const uploadCors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Template-Model'
    };
    // Preflight CORS (OPTIONS) — DEVE ser tratado ANTES do POST, senão o
    // navegador bloqueia o upload com erro de rede ("Falha de Rede").
    if (req.method === 'OPTIONS') {
      res.writeHead(204, uploadCors);
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, uploadCors));
      res.end(JSON.stringify({ ok: false, erro: 'Método não permitido. Use POST.' }));
      return;
    }
    let body = [];
    req.on('data', (chunk) => { body.push(chunk); });
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(body);
        // Extrai o modelo do header customizado X-Template-Model (uber|99)
        const modelo = String(req.headers['x-template-model'] || 'uber').toLowerCase();
        const templateFile = modelo === '99' ? 'template_99.pdf' : 'template_uber.pdf';

        // Detecta se o corpo veio como multipart/form-data (FormData do navegador)
        const contentType = String(req.headers['content-type'] || '');
        let pdfBuffer = buffer;

        if (contentType.indexOf('multipart/form-data') !== -1) {
          // Extrai o conteúdo binário do arquivo dentro do multipart
          const boundaryMatch = contentType.match(/boundary=(.+)$/);
          if (!boundaryMatch) {
            res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, uploadCors));
            res.end(JSON.stringify({ ok: false, erro: 'Formato multipart inválido.' }));
            return;
          }
          const boundary = '--' + boundaryMatch[1].trim();
          const parts = buffer.toString('latin1').split(boundary);
          let found = null;
          for (const part of parts) {
            if (part.indexOf('filename=') !== -1) {
              // Encontra o início dos dados binários (após os headers do part)
              const idx = part.indexOf('\r\n\r\n');
              if (idx !== -1) {
                const dataStart = part.indexOf('\r\n\r\n') + 4;
                let dataStr = part.substring(dataStart);
                // Remove o \r\n final do part
                dataStr = dataStr.replace(/\r\n$/, '');
                found = Buffer.from(dataStr, 'latin1');
                break;
              }
            }
          }
          if (!found) {
            res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, uploadCors));
            res.end(JSON.stringify({ ok: false, erro: 'Nenhum arquivo encontrado no envio.' }));
            return;
          }
          pdfBuffer = found;
        }

        // Valida que é um PDF (começa com %PDF)
        if (pdfBuffer.length < 5 || pdfBuffer.slice(0, 5).toString('latin1') !== '%PDF-') {
          res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, uploadCors));
          res.end(JSON.stringify({ ok: false, erro: 'O arquivo enviado não é um PDF válido.' }));
          return;
        }

        const dir = path.join(ROOT, 'uploads', 'templates');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const dest = path.join(dir, templateFile);
        fs.writeFileSync(dest, pdfBuffer);
        console.log('[PDF] ✅ Template ' + modelo.toUpperCase() + ' salvo em ' + templateFile);
        res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, uploadCors));
        res.end(JSON.stringify({ ok: true, modelo: modelo, arquivo: templateFile, bytes: pdfBuffer.length }));
      } catch (e) {
        res.writeHead(500, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, uploadCors));
        res.end(JSON.stringify({ ok: false, erro: 'Erro ao salvar o template: ' + (e && e.message ? e.message : 'erro desconhecido.') }));
      }
    });
    return;
  }

  // ===== ENDPOINT: STATUS DOS TEMPLATES PDF =====
  // Informa ao frontend se os templates Uber e 99 já foram enviados.
  if (req.method === 'GET' && urlPath === '/api/template/status') {
    const dir = path.join(ROOT, 'uploads', 'templates');
    const uber = fs.existsSync(path.join(dir, 'template_uber.pdf'));
    const t99 = fs.existsSync(path.join(dir, 'template_99.pdf'));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, uber: uber, '99': t99 }));
    return;
  }

  // ===== ENDPOINT: PREVIEW DO CRLV =====
  // O preview do CRLV agora é renderizado 100% via HTML/CSS no próprio
  // navegador (templateCRLV.js, carregado via <script>). A antiga rota
  // /api/template/image (PDF -> PNG, usada como fundo) foi REMOVIDA: não há
  // mais dependência de arquivo PDF ou imagem externa como template.

  // ===== ENDPOINT: GERAR CRLV PDF VIA PUPPETEER (HTML-TO-PDF) =====
  // Recebe os dados normalizados do veículo via req.body, gera o HTML do CRLV
  // Digital brasileiro (templateCRLV.js - 100% HTML/CSS, sem PDF/imagem externa)
  // e converte para PDF em A4 usando o Puppeteer (Chromium headless).
  // Uso: POST /api/gerar-crlv-pdf  body: { veiculo: {...} }
  if (req.method === 'POST' && urlPath === '/api/gerar-crlv-pdf') {
    console.log('[CRLV-PDF] 📥 Endpoint /api/gerar-crlv-pdf ACESSADO (POST).');
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const dados = JSON.parse(body || '{}');
        const veiculo = dados.veiculo || dados || {};
        const modelo = String(dados.modelo || 'uber').toLowerCase();
        console.log('[CRLV-PDF] 🔍 veiculo recebido (chaves: ' + Object.keys(veiculo).length + '), modelo = ' + modelo + '.');

        // Gera o PDF preenchendo o crlv-modelo.pdf (arquivo oficial na raiz) com
        // pdf-lib (rápido, sem Chromium). Se o modelo não existir, usa o fallback
        // Puppeteer (HTML 100% CSS do templateCRLV.js).
        let pdfBuffer;
        if (fs.existsSync(MODELO_PATH)) {
          console.log('[CRLV-PDF] 🖨️ Usando pdf-lib para preencher o crlv-modelo.pdf.');
          pdfBuffer = await gerarCrlvPdfComPdfLib(veiculo);
        } else {
          console.log('[CRLV-PDF] ⚠️ crlv-modelo.pdf não encontrado — usando fallback Puppeteer (HTML/CSS).');
          const html = gerarCrlvHtml(veiculo, modelo);
          console.log('[CRLV-PDF] 🧱 HTML gerado (' + html.length + ' caracteres).');
          pdfBuffer = await gerarPdfDoHtml(html);
        }
        console.log('[CRLV-PDF] ✅ PDF gerado (' + pdfBuffer.length + ' bytes).');

        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="CRLV.pdf"',
          'Content-Length': pdfBuffer.length
        });
        res.end(pdfBuffer);
      } catch (e) {
        console.error('[CRLV-PDF] ❌ Erro ao gerar o PDF:', e && e.stack ? e.stack : e);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, erro: 'Erro ao gerar o CRLV PDF: ' + (e && e.message ? e.message : 'erro desconhecido.') }));
      }
    });
    return;
  }

  // ===== INTEGRAÇÃO LOSDADOS (PROXY ISOLADO) =====
  // Roteia as requisições da API LosDados para o controller isolado.
  // O controller é a única ponte com a LosDados e injeta a API Key no
  // header X-API-Key (server-to-server), eliminando erros de CORS.
  if (req.url.startsWith('/api/losdados/')) {
    const losdadosCors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    };

    // Preflight CORS (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.writeHead(204, Object.assign({
        'Access-Control-Max-Age': '86400'
      }, losdadosCors));
      res.end();
      return;
    }

    const tratado = losdadosController.handleLosDados(req, res, losdadosCors);
    if (tratado) return;

    // Rota LosDados não reconhecida
    res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, losdadosCors));
    res.end(JSON.stringify({ ok: false, erro: 'Rota inválida sob /api/losdados/. Use GET /api/losdados/consulta?tipo=...&documento=...' }));
    return;
  }

  // Previne path traversal
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Se o arquivo não existe
      if (err.code === 'ENOENT') {
        // SPA fallback: serve index.html apenas para navegação HTML
        // (requisições de página), NÃO para recursos estáticos (js, css, img, etc.)
        const accept = (req.headers.accept || '').toLowerCase();
        const isHtmlNavigation = accept.includes('text/html') && !accept.includes('application/json');
        const ext = path.extname(urlPath).toLowerCase();

        if (isHtmlNavigation && (ext === '' || ext === '.html')) {
          fs.readFile(path.join(ROOT, 'index.html'), (err2, indexContent) => {
            if (err2) {
              res.writeHead(404);
              res.end('404 Not Found');
              return;
            }
            res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
            res.end(injectLiveReload(indexContent.toString()));
          });
          return;
        }

        // Recurso estático ausente (js, css, img, favicon, etc.) → 404 real
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(500);
      res.end('Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Injeta o script de live-reload apenas em arquivos HTML
    let body = content.toString();
    if (ext === '.html') {
      body = injectLiveReload(body);
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(body);
  });
});

/* ===== WEBSOCKET PARA LIVE-RELOAD ===== */
const wss = new WebSocketServer({ server });

// Conjunto de clientes conectados
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

// Envia mensagem de reload para todos os clientes conectados
function broadcastReload(fileChanged) {
  const message = JSON.stringify({ type: 'reload', file: fileChanged });
  clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

/* ===== MONITORAMENTO DE ARQUIVOS ===== */
// Extensões que disparam reload automático
const WATCH_EXTENSIONS = ['.html', '.css', '.js', '.json'];

// Diretórios a ignorar (evita monitorar node_modules, .git, etc.)
const IGNORED_DIRS = ['node_modules', '.git', 'package-lock.json'];

// Timers para debounce
let reloadTimer = null;

// Monitora mudanças em todos os arquivos da pasta (ignorando node_modules)
function watchFiles() {
  fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Normaliza o caminho para separadores consistentes
    const normalized = filename.split(path.sep).join('/');

    // Ignora diretórios desnecessários (node_modules, .git)
    if (IGNORED_DIRS.some(dir => normalized.includes(dir))) return;

    const ext = path.extname(filename).toLowerCase();
    if (!WATCH_EXTENSIONS.includes(ext)) return;

    // Debounce para evitar múltiplos reloads em mudanças rápidas
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      console.log(`🔄 Arquivo alterado: ${filename} - Recarregando páginas...`);
      broadcastReload(filename);
    }, 150);
  });
}

/* ===== INJEÇÃO DO SCRIPT DE LIVE-RELOAD ===== */
function injectLiveReload(html) {
  const script = `
  <!-- ===== LIVE-RELOAD (desenvolvimento) ===== -->
  <script>
    (function() {
      var ws = new WebSocket('ws://' + location.host);
      ws.onmessage = function(e) {
        try {
          var msg = JSON.parse(e.data);
          if (msg.type === 'reload') {
            console.log('%c🔄 Arquivo alterado: ' + msg.file, 'color: #00ffa3; font-weight: bold;');
            location.reload();
          }
        } catch (err) {}
      };
      ws.onclose = function() {
        // Tenta reconectar quando o servidor voltar
        setTimeout(function() {
          location.reload();
        }, 1000);
      };
    })();
  </script>
  </body>`;

  // Substitui o fechamento do body pelo script + fechamento
  if (html.includes('</body>')) {
    return html.replace('</body>', script);
  }
  return html + script;
}

/* ===== INICIAR SERVIDOR ===== */
watchFiles();

server.listen(PORT, () => {
  console.log('==============================================');
  console.log('  🚀 ESPAÇO UBER - Servidor de Desenvolvimento');
  console.log('  --------------------------------------------');
  console.log(`  🌐 Acesse: http://localhost:${PORT}`);
  console.log(`  📄 Painel Admin: http://localhost:${PORT}/admin.html`);
  console.log(`  🔑 Login: http://localhost:${PORT}/login.html`);
  console.log('  --------------------------------------------');
  console.log('  🔄 Live-reload ativo! As páginas serão');
  console.log('     atualizadas automaticamente ao editar');
  console.log('     arquivos HTML, CSS ou JS.');
  console.log('  --------------------------------------------');
  console.log('  🔌 API LosDados ativa (proxy server-to-server):');
  console.log(`     GET  http://localhost:${PORT}/api/losdados/consulta?tipo=...&documento=...`);
  console.log('     (CPF, CNH, Telefone e Placa — chave injetada pelo servidor)');
  console.log('  ⏹️  Para parar: Ctrl+C');
  console.log('==============================================');
});
