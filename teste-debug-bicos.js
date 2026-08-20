/* ============================================================
   DEBUG DA TELA "VENDA DE BICOS"
   Investiga por que a busca retorna 0 resultados.
   ============================================================ */

'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, 'validacao-bicos');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => console.log(`[PAGEERROR] ${err.message}`));

    // Login
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#username');
    await page.type('#username', 'FREDÃO');
    await page.type('#password', '1234');
    await page.click('#captchaBox');
    await sleep(1200);
    await page.click('#btnLogin');
    await page.waitForFunction(() => window.location.pathname.includes('index.html'), { timeout: 15000 });
    await page.waitForSelector('#mainContent');
    await sleep(1500);

    // Abrir tela de bicos
    await page.evaluate(() => {
      const card = document.querySelector('.premium-card[data-open="venda-de-bicos"] .btn-premium, .premium-card[data-open="venda-de-bicos"]');
      if (card) card.click();
    });
    await sleep(1000);

    // Verificar estado inicial dos filtros
    console.log('\n=== ESTADO INICIAL DOS FILTROS ===');
    const estadoFiltros = await page.evaluate(() => {
      const resultado = {};
      document.querySelectorAll('.filter-chips').forEach(group => {
        const filtro = group.dataset.filter;
        const ativos = [];
        group.querySelectorAll('.filter-chip').forEach(chip => {
          if (chip.classList.contains('active')) ativos.push(chip.dataset.value);
        });
        resultado[filtro] = ativos;
      });
      return resultado;
    });
    console.log('Filtros ativos:', JSON.stringify(estadoFiltros));

    // Verificar bicosLoad
    console.log('\n=== BICOS LOAD ===');
    const bicos = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('FredContas_MasterBicos');
        console.log('localStorage raw:', raw);
        return { raw: raw ? raw.substring(0, 200) : null };
      } catch (e) {
        return { erro: e.message };
      }
    });
    console.log('Bicos localStorage:', JSON.stringify(bicos));

    // Upload de foto
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const fotoPath = path.join(OUT_DIR, 'foto-teste.png');
    fs.writeFileSync(fotoPath, Buffer.from(pngBase64, 'base64'));
    const inputFile = await page.$('#photoInput');
    await inputFile.uploadFile(fotoPath);
    await sleep(800);

    console.log('\n=== APÓS UPLOAD ===');
    const uploadState = await page.evaluate(() => {
      return {
        previewHidden: document.getElementById('uploadPreview')?.hidden,
        previewSrc: document.getElementById('uploadPreviewImg')?.src?.substring(0, 50) || 'sem src'
      };
    });
    console.log('Upload state:', JSON.stringify(uploadState));

    // Verificar estado antes da busca
    console.log('\n=== ESTADO ANTES DA BUSCA ===');
    const antesBusca = await page.evaluate(() => {
      const preview = document.getElementById('uploadPreview');
      const hasPhoto = !(preview || {}).hidden;
      return {
        previewHidden: preview?.hidden,
        hasPhoto: hasPhoto,
        btnBuscarExiste: !!document.getElementById('btnBuscar'),
        resultsExiste: !!document.getElementById('toolResults')
      };
    });
    console.log('Antes da busca:', JSON.stringify(antesBusca));

    // Executar busca
    console.log('\n=== EXECUTANDO BUSCA ===');
    // Verifica se runToolSearch é acessível e se o botão tem listener
    const verif = await page.evaluate(() => {
      const btn = document.getElementById('btnBuscar');
      return {
        runToolSearchTipo: typeof window.runToolSearch,
        btnExiste: !!btn,
        btnOnclick: btn ? (btn.onclick ? 'tem onclick' : 'sem onclick') : 'sem botao',
        btnDisabled: btn ? btn.disabled : null
      };
    });
    console.log('Verificação:', JSON.stringify(verif));

    // Injeta logs de depuração nas funções
    await page.evaluate(() => {
      window.__origRunToolSearch = window.runToolSearch;
      window.runToolSearch = function () {
        console.log('[DEBUG] runToolSearch chamado');
        const preview = document.getElementById('uploadPreview');
        const hasPhoto = !(preview || {}).hidden;
        console.log('[DEBUG] hasPhoto:', hasPhoto, 'previewHidden:', preview?.hidden);
        const resultsEl = document.getElementById('toolResults');
        console.log('[DEBUG] resultsEl existe:', !!resultsEl);
        return window.__origRunToolSearch.apply(this, arguments);
      };
      window.__origRenderBicos = window.renderBicosResults;
      window.renderBicosResults = function (filters, name) {
        console.log('[DEBUG] renderBicosResults chamado, filters:', JSON.stringify(filters), 'name:', name);
        return window.__origRenderBicos.apply(this, arguments);
      };
    });
    // Verifica se o botão está visível e clicável
    console.log('\n=== VISIBILIDADE DO BOTÃO ===');
    const visibilidade = await page.evaluate(() => {
      const btn = document.getElementById('btnBuscar');
      if (!btn) return { erro: 'botao nao existe' };
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      // Verifica se há elemento no centro do botão
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(cx, cy);
      return {
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        display: style.display,
        visibility: style.visibility,
        pointerEvents: style.pointerEvents,
        topElement: topEl ? (topEl.id || topEl.className || topEl.tagName) : 'nenhum',
        topElementIsBtn: topEl === btn
      };
    });
    console.log('Visibilidade do botão:', JSON.stringify(visibilidade, null, 2));

    // Tenta chamar runToolSearch diretamente via evaluate
    console.log('\n=== CHAMADA DIRETA runToolSearch ===');
    await page.evaluate(() => {
      window.runToolSearch();
    });
    await sleep(1000);
    const duranteScan = await page.evaluate(() => {
      return {
        overlayHidden: document.getElementById('toolScanOverlay')?.hidden,
        scanPercent: document.getElementById('toolScanPercent')?.textContent
      };
    });
    console.log('Durante scan (chamada direta):', JSON.stringify(duranteScan));

    await sleep(3000);
    const aposBusca = await page.evaluate(() => {
      const results = document.getElementById('toolResults');
      return {
        html: results ? results.innerHTML.substring(0, 500) : 'sem results',
        cards: document.querySelectorAll('#toolResults .tool-result-card').length,
        empty: document.querySelectorAll('#toolResults .tool-results-empty').length
      };
    });
    console.log('Após busca:', JSON.stringify(aposBusca, null, 2));

  } catch (err) {
    console.error('ERRO:', err);
  } finally {
    await browser.close();
  }
}

main();
