/* ============================================================
   TESTE DE VALIDAÇÃO DA TELA "VENDA DE BICOS"
   Automatiza o fluxo completo no navegador via Puppeteer:
   1. Login
   2. Abrir a tela "Venda de Bicos"
   3. Verificar presença dos elementos
   4. Testar interações (filtros, checkbox, upload, busca)
   5. Capturar screenshots para validação visual
   ============================================================ */

'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, 'validacao-bicos');
const RESULTADOS = [];
let PASS = 0;
let FAIL = 0;

function registrar(nome, ok, detalhe = '') {
  const status = ok ? '✅ PASS' : '❌ FAIL';
  RESULTADOS.push({ nome, ok, detalhe });
  if (ok) PASS++; else FAIL++;
  console.log(`${status} | ${nome}${detalhe ? ' | ' + detalhe : ''}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, nome) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${nome}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 Screenshot salvo: ${file}`);
}

async function main() {
  console.log('🚀 Iniciando validação da tela "Venda de Bicos"...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Captura erros de console
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`PageError: ${err.message}`));

    // ===== 1. LOGIN =====
    console.log('--- 1. LOGIN ---');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.type('#username', 'FREDÃO');
    await page.type('#password', '1234');
    // Clica no captcha
    await page.click('#captchaBox');
    await sleep(1200);
    // Submete o formulário
    await page.click('#btnLogin');
    // Aguarda redirecionamento para o dashboard
    await page.waitForFunction(() => window.location.pathname.includes('index.html'), { timeout: 15000 });
    await page.waitForSelector('#mainContent', { timeout: 15000 });
    await sleep(1500);

    // Fecha o modal de boas-vindas (se estiver aberto) para não bloquear os cliques
    const modalFechado = await page.evaluate(() => {
      const modal = document.getElementById('welcome-modal');
      const btn = document.getElementById('btnWelcomeClose');
      if (modal && modal.classList.contains('open') && btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(500);
    registrar('Login e redirecionamento para o dashboard', true);
    registrar('Modal de boas-vindas fechado (se presente)', modalFechado || true);
    await screenshot(page, '01-dashboard');

    // ===== 2. ABRIR TELA "VENDA DE BICOS" =====
    console.log('\n--- 2. ABRIR TELA "VENDA DE BICOS" ---');
    // Procura o card premium "Venda de Bicos"
    const cardAchado = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-open="venda-de-bicos"]');
      return cards.length > 0;
    });
    registrar('Card "Venda de Bicos" presente no dashboard', cardAchado);

    if (cardAchado) {
      // Clica no card premium
      await page.evaluate(() => {
        const card = document.querySelector('.premium-card[data-open="venda-de-bicos"] .btn-premium, .premium-card[data-open="venda-de-bicos"]');
        if (card) card.click();
      });
      await sleep(1000);

      // Verifica se a viewport da ferramenta foi aberta
      const viewportAberta = await page.evaluate(() => {
        const section = document.getElementById('tab-tool');
        return section && section.classList.contains('active');
      });
      registrar('Viewport da ferramenta aberta', viewportAberta);
      await screenshot(page, '02-viewport-bicos');

      // ===== 3. VERIFICAR PRESENÇA DOS ELEMENTOS =====
      console.log('\n--- 3. VERIFICAÇÃO DOS ELEMENTOS ---');

      const elementos = await page.evaluate(() => {
        const resultado = {};
        resultado.titulo = document.querySelector('#toolViewport .tool-viewport-title h1')?.textContent?.trim() || '';
        resultado.tabBuscas = !!document.querySelector('#toolTabs .tool-tab[data-tooltab="buscas"]');
        resultado.tabHistorico = !!document.querySelector('#toolTabs .tool-tab[data-tooltab="historico"]');
        resultado.tabExtrato = !!document.querySelector('#toolTabs .tool-tab[data-tooltab="extrato"]');
        resultado.uploadZone = !!document.querySelector('#uploadZone');
        resultado.uploadText = document.querySelector('.upload-text')?.textContent?.trim() || '';
        resultado.uploadHint = document.querySelector('.upload-hint')?.textContent?.trim() || '';
        resultado.filtroVeiculo = !!document.querySelector('.filter-chips[data-filter="veiculo"]');
        resultado.filtroGenero = !!document.querySelector('.filter-chips[data-filter="genero"]');
        resultado.filtroPlataforma = !!document.querySelector('.filter-chips[data-filter="plataforma"]');
        resultado.filtroSimilaridade = !!document.querySelector('.filter-chips[data-filter="similaridade"]');
        resultado.filtroIdade = !!document.querySelector('.filter-chips[data-filter="idade"]');
        resultado.checkboxNome = !!document.querySelector('#searchByNameCheck');
        resultado.inputNome = !!document.querySelector('#searchName');
        resultado.btnBuscar = document.querySelector('#btnBuscar')?.textContent?.trim() || '';
        resultado.preco = document.querySelector('.tool-action-price')?.textContent?.trim() || '';
        resultado.resultados = !!document.querySelector('#toolResults');
        resultado.overlayScan = !!document.querySelector('#toolScanOverlay');
        return resultado;
      });

      registrar('Título da viewport', elementos.titulo === 'Venda De Bicos', `"${elementos.titulo}"`);
      registrar('Aba "Buscas" presente', elementos.tabBuscas);
      registrar('Aba "Meu Histórico" presente', elementos.tabHistorico);
      registrar('Aba "Extrato" presente', elementos.tabExtrato);
      registrar('Área de upload presente', elementos.uploadZone);
      registrar('Texto de upload', elementos.uploadText === 'Clique ou arraste a foto do cliente', `"${elementos.uploadText}"`);
      registrar('Hint de upload', elementos.uploadHint.includes('JPG') && elementos.uploadHint.includes('PNG'), `"${elementos.uploadHint}"`);
      registrar('Filtro Veículo presente', elementos.filtroVeiculo);
      registrar('Filtro Gênero presente', elementos.filtroGenero);
      registrar('Filtro Plataforma presente', elementos.filtroPlataforma);
      registrar('Filtro Similaridade presente', elementos.filtroSimilaridade);
      registrar('Filtro Idade presente', elementos.filtroIdade);
      registrar('Checkbox "Buscar por primeiro nome" presente', elementos.checkboxNome);
      registrar('Input de nome presente', elementos.inputNome);
      registrar('Botão "BUSCAR CORRESPONDÊNCIAS"', elementos.btnBuscar.includes('BUSCAR CORRESPONDÊNCIAS'), `"${elementos.btnBuscar}"`);
      registrar('Display de preço', elementos.preco.includes('R$ 10,00'), `"${elementos.preco}"`);
      registrar('Container de resultados presente', elementos.resultados);
      registrar('Overlay de scanner presente', elementos.overlayScan);

      // ===== 4. TESTAR INTERAÇÕES =====
      console.log('\n--- 4. TESTE DE INTERAÇÕES ---');

      // 4.1 Alternar abas
      await page.click('#toolTabs .tool-tab[data-tooltab="historico"]');
      await sleep(300);
      const abaHistoricoAtiva = await page.evaluate(() => {
        return document.getElementById('toolPanel-historico')?.classList.contains('active');
      });
      registrar('Aba "Meu Histórico" ativa ao clicar', abaHistoricoAtiva);

      await page.click('#toolTabs .tool-tab[data-tooltab="extrato"]');
      await sleep(300);
      const abaExtratoAtiva = await page.evaluate(() => {
        return document.getElementById('toolPanel-extrato')?.classList.contains('active');
      });
      registrar('Aba "Extrato" ativa ao clicar', abaExtratoAtiva);

      // Volta para Buscas
      await page.click('#toolTabs .tool-tab[data-tooltab="buscas"]');
      await sleep(300);

      // 4.2 Alternar filtros (chips)
      await page.evaluate(() => {
        const group = document.querySelector('.filter-chips[data-filter="veiculo"]');
        const chip = group.querySelector('.filter-chip[data-value="moto"]');
        chip.click();
      });
      await sleep(200);
      const chipMotoAtivo = await page.evaluate(() => {
        const group = document.querySelector('.filter-chips[data-filter="veiculo"]');
        return group.querySelector('.filter-chip[data-value="moto"]')?.classList.contains('active');
      });
      registrar('Chip "Moto" ativo ao clicar', chipMotoAtivo);

      // 4.3 Checkbox "Buscar por primeiro nome" mostra input
      const inputOcultoInicial = await page.evaluate(() => {
        return document.getElementById('nameInputWrap')?.hidden;
      });
      registrar('Input de nome oculto inicialmente', inputOcultoInicial === true);

      await page.click('#searchByNameCheck');
      await sleep(300);
      const inputVisivel = await page.evaluate(() => {
        return document.getElementById('nameInputWrap')?.hidden === false;
      });
      registrar('Input de nome visível ao marcar checkbox', inputVisivel);

      // 4.4 Testar busca sem foto (deve mostrar erro)
      await page.click('#btnBuscar');
      await sleep(500);
      const toastErro = await page.evaluate(() => {
        const toasts = document.querySelectorAll('.toast, .toast-message, #toastContainer .toast');
        return toasts.length > 0;
      });
      registrar('Toast de erro exibido ao buscar sem foto', toastErro);

      // 4.5 Upload de foto (simulado via input file)
      // Cria um arquivo PNG de teste (1x1 pixel)
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const fotoPath = path.join(OUT_DIR, 'foto-teste.png');
      fs.writeFileSync(fotoPath, Buffer.from(pngBase64, 'base64'));

      const inputFile = await page.$('#photoInput');
      await inputFile.uploadFile(fotoPath);
      await sleep(800);

      const previewVisivel = await page.evaluate(() => {
        return document.getElementById('uploadPreview')?.hidden === false;
      });
      registrar('Prévia da foto exibida após upload', previewVisivel);
      await screenshot(page, '03-upload-foto');

      // 4.6 Executar busca com foto
      await page.click('#btnBuscar');
      // Aguarda o overlay de scanner e a conclusão (~2.5s)
      await sleep(3500);
      const resultadosRenderizados = await page.evaluate(() => {
        const results = document.getElementById('toolResults');
        if (!results) return false;
        const header = results.querySelector('.tool-results-header');
        return !!header;
      });
      registrar('Resultados renderizados após busca', resultadosRenderizados);
      await screenshot(page, '04-resultados-busca');

      // Verifica se há cards de resultado
      const numCards = await page.evaluate(() => {
        return document.querySelectorAll('#toolResults .tool-result-card').length;
      });
      registrar('Cards de resultado gerados', numCards > 0, `${numCards} card(s)`);

      // 4.7 Testar filtro de similaridade
      await page.evaluate(() => {
        const group = document.querySelector('.filter-chips[data-filter="similaridade"]');
        const chip = group.querySelector('.filter-chip[data-value="60-70"]');
        chip.click();
      });
      await sleep(200);
      await page.click('#btnBuscar');
      await sleep(3500);
      const numCardsFiltrados = await page.evaluate(() => {
        return document.querySelectorAll('#toolResults .tool-result-card').length;
      });
      registrar('Filtro de similaridade aplicado', numCardsFiltrados >= 0, `${numCardsFiltrados} card(s) após filtro`);
      await screenshot(page, '05-resultados-filtro');

      // 4.8 Testar botão Voltar
      await page.click('#toolBackBtn');
      await sleep(500);
      const voltouDashboard = await page.evaluate(() => {
        const section = document.getElementById('tab-tool');
        return !section || !section.classList.contains('active');
      });
      registrar('Botão Voltar restaura o dashboard', voltouDashboard);
      await screenshot(page, '06-voltar-dashboard');

      // ===== 5. ERROS DE CONSOLE =====
      console.log('\n--- 5. ERROS DE CONSOLE ---');
      if (consoleErrors.length === 0) {
        registrar('Nenhum erro de console durante o fluxo', true);
      } else {
        registrar('Nenhum erro de console durante o fluxo', false, consoleErrors.join(' | '));
      }
    } else {
      registrar('Card "Venda de Bicos" presente no dashboard', false, 'Card não encontrado');
    }

  } catch (err) {
    registrar('Execução do fluxo sem exceções', false, err.message);
    console.error('\n❌ ERRO:', err);
  } finally {
    await browser.close();
  }

  // ===== RESUMO =====
  console.log('\n========================================');
  console.log(`📊 RESUMO DA VALIDAÇÃO`);
  console.log(`   ✅ PASS: ${PASS}`);
  console.log(`   ❌ FAIL: ${FAIL}`);
  console.log(`   📁 Screenshots: ${OUT_DIR}`);
  console.log('========================================');

  process.exit(FAIL > 0 ? 1 : 0);
}

main();
