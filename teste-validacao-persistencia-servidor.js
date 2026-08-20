/* ============================================================
 * VALIDAÇÃO: PERSISTÊNCIA NO SERVIDOR + SINCRONIZAÇÃO ADMIN <-> USUÁRIO
 * ------------------------------------------------------------
 * Cenário: tudo o que for feito no painel admin deve refletir no
 * painel do usuário E sobreviver a atualizações/reinícios do servidor
 * (sem precisar salvar de novo). O catálogo é persistido em
 * cms-modules.json no servidor (fonte de verdade).
 *
 * Fluxo validado:
 *   1) POST /api/cms/modules (simula o admin salvando) -> cria cms-modules.json
 *   2) GET /api/cms/modules retorna o catálogo salvo
 *   3) Painel do usuário com localStorage LIMPO carrega o catálogo do servidor
 *      (persistência: sobrevive a reinício/troca de navegador)
 *   4) Painel do usuário reflete as categorias/serviços salvos no servidor
 *      (incluindo a remoção deliberada de "Fotos & Facial")
 * ============================================================ */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const STORAGE_KEY = 'FredContas_MasterModules';
const REMOVED_KEY = 'FredContas_MasterModules_removed';
const SERVER_FILE = path.join(__dirname, 'cms-modules.json');

// Catálogo que o admin salvaria (ex.: sem a categoria facial, com uma
// categoria renomeada e um serviço novo) para provar que o servidor é a
// fonte de verdade e o painel do usuário o reflete.
const catalogoAdmin = {
  categorias: [
    {
      id: 'cat_1',
      nome: 'Checkers & Consultas',
      icone: 'fas fa-search',
      servicos: [
        { id: 'consulta-cnh', nome: 'Consulta CNH', icone: 'fas fa-id-card', status: 'ativo' },
        { id: 'consulta-cpf', nome: 'Consulta CPF', icone: 'fas fa-user-check', status: 'ativo' },
        { id: 'consulta-telefone', nome: 'Consulta Telefone', icone: 'fas fa-phone', status: 'ativo' },
        { id: 'consulta-placa', nome: 'Consulta Placa', icone: 'fas fa-car-side', status: 'ativo' }
      ]
    },
    {
      id: 'cat_2',
      nome: 'Geradores',
      icone: 'fas fa-cogs',
      servicos: [
        { id: 'gerar-crlv', nome: 'Gerador de CRLV (Uber / 99)', icone: 'fas fa-file-alt', status: 'ativo' },
        { id: 'gerador-cnh', nome: 'Gerador de CNH', icone: 'fas fa-id-card', status: 'ativo' },
        { id: 'gerador-chassi', nome: 'Gerador de Chassi', icone: 'fas fa-fingerprint', status: 'ativo' }
      ]
    },
    {
      id: 'cat_4',
      nome: 'Ferramentas',
      icone: 'fas fa-tools',
      servicos: [
        { id: 'venda-de-bicos', nome: 'Venda de Bicos', icone: 'fas fa-bolt', status: 'ativo' },
        { id: 'servico-novo-admin', nome: 'Serviço Novo do Admin', icone: 'fas fa-star', status: 'ativo' }
      ]
    }
  ],
  // Lista de categorias removidas deliberadamente no admin (persistida no
  // servidor para que o merge de garantia não as recrie).
  removed: [
    { id: 'cat_3', nome: 'Fotos & Facial' }
  ]
};

const VITAIS = ['consulta-cnh', 'consulta-cpf', 'consulta-telefone', 'consulta-placa', 'gerar-crlv', 'gerador-cnh', 'gerador-chassi'];
const NOVO_SERVICO = 'servico-novo-admin';

async function main() {
  // 0) Remove o arquivo do servidor para começar do estado "sem persistência"
  if (fs.existsSync(SERVER_FILE)) fs.unlinkSync(SERVER_FILE);

  // 1) POST do catálogo (simula o admin salvando no painel)
  const postRes = await fetch(BASE + '/api/cms/modules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(catalogoAdmin)
  });
  const postData = await postRes.json();
  console.log('POST /api/cms/modules -> status', postRes.status, '| ok:', postData.ok);

  // 2) Verifica que o arquivo foi criado no servidor
  const arquivoCriado = fs.existsSync(SERVER_FILE);
  console.log('cms-modules.json criado no servidor:', arquivoCriado);

  // 3) GET do catálogo (fonte de verdade)
  const getRes = await fetch(BASE + '/api/cms/modules');
  const getData = await getRes.json();
  const getCats = (getData && getData.modules && getData.modules.categorias) || [];
  console.log('GET /api/cms/modules -> status', getRes.status, '| categorias:', getCats.length);

  // 4) Abre o painel do usuário com localStorage LIMPO (simula reinício/troca
  //    de navegador) e verifica que ele carrega o catálogo do servidor.
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const t = msg.text() || '';
      if (/404|favicon|Failed to load resource/i.test(t)) return;
      erros.push('console.error: ' + t);
    }
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Garante localStorage limpo (sem catálogo local nem lista de removidas)
  // para provar que a fonte de verdade é o servidor.
  await page.evaluate(({ key, removedKey }) => {
    localStorage.removeItem(key);
    localStorage.removeItem(removedKey);
  }, { key: STORAGE_KEY, removedKey: REMOVED_KEY });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-service]').length > 0, { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500));

  const resultado = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-service]')).map(c => c.getAttribute('data-service'));
    const textos = document.body.innerText || '';
    return { cards, textos };
  });

  const ids = resultado.cards;
  const presentes = VITAIS.filter(id => ids.includes(id));
  const faltantes = VITAIS.filter(id => !ids.includes(id));
  const novoPresente = ids.includes(NOVO_SERVICO);

  console.log('\n===== TESTE: PERSISTÊNCIA NO SERVIDOR + SINCRONIZAÇÃO =====');
  console.log('Cards exibidos no painel do usuário:', ids.length);
  console.log('Vitais presentes:', presentes);
  console.log('Vitais faltantes:', faltantes);
  console.log('Serviço novo do admin presente:', novoPresente);
  console.log('Texto contém "Serviço Novo do Admin":', /Serviço\s*Novo\s*do\s*Admin/i.test(resultado.textos));
  console.log('Texto contém "Fotos & Facial" (NÃO deveria):', /Fotos\s*&\s*Facial/i.test(resultado.textos));

  let ok = true;
  if (!arquivoCriado) { console.log('❌ cms-modules.json não foi criado no servidor'); ok = false; }
  if (getCats.length === 0) { console.log('❌ GET não retornou o catálogo do servidor'); ok = false; }
  if (faltantes.length > 0) { console.log('❌ FALTAM serviços vitais no painel do usuário:', faltantes); ok = false; }
  if (!novoPresente) { console.log('❌ Serviço novo do admin NÃO apareceu no painel do usuário'); ok = false; }
  if (/Fotos\s*&\s*Facial/i.test(resultado.textos)) { console.log('❌ Categoria facial removida ainda aparece'); ok = false; }
  if (erros.length > 0) { console.log('❌ Erros de página:', erros); ok = false; }

  await page.screenshot({ path: 'validacao-persistencia-servidor.png', fullPage: true });
  await browser.close();

  console.log('\n===== RESUMO =====');
  console.log(ok ? '✅ APROVADO: persistência no servidor + sincronização admin->usuário' : '❌ REPROVADO');
  process.exit(ok ? 0 : 1);
}

main().catch(e => { console.error('FALHA no teste:', e); process.exit(1); });
