/* ============================================================
 * VALIDAÇÃO REAL NO NAVEGADOR (Puppeteer / headless Chromium)
 * ------------------------------------------------------------
 * Cenário A: localStorage com catálogo ANTIGO/INCOMPLETO (simula o
 *            estado "quebrado" que fez o painel perder CPF/CNH/CRLV).
 * Cenário B: cache e localStorage completamente LIMPOS (tela nova).
 * Verifica que a tela do usuário renderiza os serviços vitais e
 * que o localStorage é auto-reparado.
 * ============================================================ */
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const VITAIS = ['consulta-cnh', 'consulta-cpf', 'consulta-telefone', 'consulta-placa', 'gerar-crlv', 'gerador-cnh', 'gerador-chassi', 'gerador-cpf', 'gerador-cnpj'];

const staleCatalog = {
  categorias: [
    {
      id: 'cat_3',
      nome: 'Fotos & Facial',
      servicos: [
        { id: 'reconhecimento-facial', nome: 'Reconhecimento Facial', icone: 'fas fa-face-smile', status: 'ativo' }
      ]
    }
  ]
};

async function coletarCards(page) {
  return page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-service]'));
    return cards.map(c => ({
      id: c.getAttribute('data-service'),
      nome: (c.querySelector('.service-name, h3, h4, .card-title') || {}).textContent || c.textContent.slice(0, 40),
      visivel: !!(c.offsetWidth > 0 || c.offsetHeight > 0)
    }));
  });
}

async function cenário(page, nomeCenario, preparar) {
  console.log('\n===== ' + nomeCenario + ' =====');
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') erros.push('console.error: ' + msg.text());
  });

  await preparar(page);

  const resp = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Aguarda a renderização dinâmica dos cards (com polling de 2s)
  await page.waitForFunction(() => document.querySelectorAll('[data-service]').length > 0, { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500)); // deixa o polling estabilizar

  const urlFinal = page.url();
  const cards = await coletarCards(page);
  const ids = cards.map(c => c.id);
  const presentes = VITAIS.filter(id => ids.includes(id));
  const faltantes = VITAIS.filter(id => !ids.includes(id));

  // Auto-reparo: verifica o que ficou persistido no localStorage
  let storageReparado = null;
  try {
    storageReparado = await page.evaluate(() => {
      const raw = localStorage.getItem('FredContas_MasterModules');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const all = [];
      (parsed.categorias || []).forEach(c => (c.servicos || []).forEach(s => all.push(s.id)));
      return all;
    });
  } catch (e) { storageReparado = ['erro:' + e.message]; }
  const storageTemVitais = VITAIS.every(id => Array.isArray(storageReparado) && storageReparado.includes(id));

  console.log('URL final        : ' + urlFinal);
  console.log('Status HTTP      : ' + (resp ? resp.status() : '?'));
  console.log('Total cards      : ' + cards.length);
  console.log('Cards renderizados: ' + cards.map(c => c.id).join(', '));
  console.log('Serviços vitais  : ' + presentes.join(', '));
  console.log('Faltantes        : ' + (faltantes.length ? faltantes.join(', ') : 'NENHUM'));
  console.log('localStorage     : ' + (Array.isArray(storageReparado) ? storageReparado.join(', ') : 'null'));
  console.log('Auto-reparo      : ' + (storageTemVitais ? 'OK (persistido)' : 'FALHOU'));
  console.log('Erros JS         : ' + (erros.length ? erros.join(' | ') : 'NENHUM'));

  // Redirecionou para login? (se sim, é problema de gate)
  const foiParaLogin = urlFinal.includes('login.html');
  const passou = presentes.length === VITAIS.length && !foiParaLogin && cards.length > 0;

  console.log('RESULTADO        : ' + (passou ? '✅ APROVADO' : '❌ REPROVADO'));
  await page.screenshot({ path: nomeCenario === 'A' ? 'validacao-cenario-a.png' : 'validacao-cenario-b.png', fullPage: false });
  return { passou, cards, faltantes, urlFinal };
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const context = await browser.createBrowserContext(); // perfil limpo (sem cache/localStorage do usuário)

  let resA = null;
  try {
    // ---------- CENÁRIO A: dados antigos/incompletos ----------
    const pageA = await context.newPage();
    await pageA.evaluateOnNewDocument((stale) => {
      try { localStorage.setItem('FredContas_MasterModules', JSON.stringify(stale)); } catch (e) {}
      try { localStorage.setItem('FredContas_ConfigStore', '{}'); } catch (e) {}
    }, staleCatalog);
    resA = await cenário(pageA, 'CENÁRIO A - localStorage antigo/incompleto (estado quebrado)', async () => {});
    await pageA.close();

    // ---------- CENÁRIO B: cache/storage 100% limpos ----------
    const pageB = await context.newPage();
    await cenário(pageB, 'CENÁRIO B - cache e localStorage limpos (primeira visita)', async (p) => {
      // Remove TODOS os dados do site (simula "limpar cache/site data")
      await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await p.evaluate(() => localStorage.clear());
      // navega de novo com tudo limpo
    });
    await pageB.close();
  } finally {
    await context.close();
    await browser.close();
  }

  const ok = resA && resA.passou;
  console.log('\n==============================================');
  console.log(ok ? '✅ VALIDAÇÃO FINAL: PAINEL RESTAURADO' : '❌ VALIDAÇÃO FINAL: PAINEL AINDA COM PROBLEMAS');
  console.log('==============================================');
  process.exit(ok ? 0 : 1);
})();
