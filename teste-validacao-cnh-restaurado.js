/* ============================================================
 * VALIDAÇÃO: RESTAURAÇÃO DO GERADOR DE CNH
 * ------------------------------------------------------------
 * Objetivo: confirmar que, ao clicar em "Gerador de CNH", o
 * painel abre a tela de CONSULTA CNH (formulário LosDados) —
 * comportamento antigo — e NÃO o gerador de PDF com chips de
 * modelo/módulo.
 *
 * Verifica também que "Consulta CNH" continua abrindo o mesmo
 * formulário de consulta.
 * ============================================================ */
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';

async function abrirServico(page, dataService) {
  // Localiza o card e clica no botão "Abrir Serviço"
  return page.evaluate((id) => {
    const card = document.querySelector('[data-service="' + id + '"]');
    if (!card) return { ok: false, motivo: 'card nao encontrado: ' + id };
    const btn = card.querySelector('.btn-service');
    if (!btn) return { ok: false, motivo: 'botao abrir nao encontrado' };
    btn.click();
    return { ok: true };
  }, dataService);
}

async function lerViewport(page) {
  return page.evaluate(() => {
    const viewport = document.getElementById('toolViewport');
    if (!viewport) return { abriu: false };
    const texto = viewport.innerText || '';
    return {
      abriu: true,
      temInputConsulta: !!document.getElementById('losdadosConsultaInput'),
      temBtnConsultar: !!document.getElementById('btnConsultarLosDados'),
      temBtnGerarPdf: !!document.getElementById('btnGerarCnhPdf'),
      temModeloOptions: !!document.getElementById('cnhModeloOptions'),
      temModuloOptions: !!document.getElementById('cnhModuloOptions'),
      temDadosTextarea: !!document.getElementById('cnhDadosTextarea'),
      temInputCnhFoto: !!document.getElementById('cnhFotoInput'),
      temTituloConsultaCnh: texto.includes('Consulta por CNH'),
      temDescricaoCnh: texto.includes('CPF do condutor'),
      texto: texto.slice(0, 300)
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const context = await browser.createBrowserContext();
  let falhas = 0;

  try {
    const page = await context.newPage();
    page.on('pageerror', e => { console.log('PAGEERROR: ' + e.message); });
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Aguarda os cards renderizarem
    await page.waitForFunction(() => document.querySelectorAll('[data-service]').length > 0, { timeout: 20000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));

    // ---------- TESTE 1: "Gerador de CNH" abre Consulta CNH (LosDados) ----------
    console.log('===== TESTE 1: Gerador de CNH -> Consulta CNH (LosDados) =====');
    const r1 = await abrirServico(page, 'gerador-cnh');
    await new Promise(r => setTimeout(r, 800));
    const v1 = await lerViewport(page);

    const t1Ok = r1.ok && v1.abriu && v1.temInputConsulta && v1.temBtnConsultar &&
      v1.temTituloConsultaCnh && v1.temDescricaoCnh &&
      !v1.temBtnGerarPdf && !v1.temModeloOptions && !v1.temModuloOptions &&
      !v1.temDadosTextarea && !v1.temInputCnhFoto;

    console.log('AbrirServico  : ' + JSON.stringify(r1));
    console.log('Viewport      : ' + JSON.stringify(v1, null, 2));
    console.log('RESULTADO     : ' + (t1Ok ? '✅ APROVADO' : '❌ REPROVADO'));
    if (!t1Ok) falhas++;

    // ---------- TESTE 2: "Consulta CNH" continua abrindo o mesmo formulário ----------
    console.log('\n===== TESTE 2: Consulta CNH -> Consulta CNH (LosDados) =====');
    // Volta para o dashboard
    await page.evaluate(() => {
      const back = document.getElementById('toolBackBtn');
      if (back) back.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const r2 = await abrirServico(page, 'consulta-cnh');
    await new Promise(r => setTimeout(r, 800));
    const v2 = await lerViewport(page);

    const t2Ok = r2.ok && v2.abriu && v2.temInputConsulta && v2.temBtnConsultar &&
      v2.temTituloConsultaCnh && !v2.temBtnGerarPdf;

    console.log('AbrirServico  : ' + JSON.stringify(r2));
    console.log('Viewport      : ' + JSON.stringify(v2, null, 2));
    console.log('RESULTADO     : ' + (t2Ok ? '✅ APROVADO' : '❌ REPROVADO'));
    if (!t2Ok) falhas++;

    await page.screenshot({ path: 'validacao-cnh-restaurado.png', fullPage: false });

  } finally {
    await context.close();
    await browser.close();
  }

  console.log('\n===== RESUMO =====');
  console.log(falhas === 0 ? '✅ TODOS OS TESTES PASSARAM' : '❌ ' + falhas + ' TESTE(S) FALHOU(ARAM)');
  process.exit(falhas === 0 ? 0 : 1);
})();
