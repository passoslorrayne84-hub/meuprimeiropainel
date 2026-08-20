/* ============================================================
 * VALIDAÇÃO: SINCRONIZAÇÃO ADMIN <-> USUÁRIO (REMOÇÃO DE CATEGORIA)
 * ------------------------------------------------------------
 * Cenário: o admin excluiu a categoria "Fotos & Facial" (cat_3).
 * O painel do usuário NÃO deve mais exibi-la, mas deve continuar
 * exibindo as categorias/serviços vitais (Consultas, Geradores).
 *
 * Simula o estado persistido pelo admin após a exclusão:
 *   - FredContas_MasterModules: catálogo SEM cat_3
 *   - FredContas_MasterModules_removed: [ { id:'cat_3', nome:'Fotos & Facial' } ]
 * ============================================================ */
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const STORAGE_KEY = 'FredContas_MasterModules';
const REMOVED_KEY = 'FredContas_MasterModules_removed';

// Catálogo que o admin deixaria após excluir "Fotos & Facial" (cat_3)
const catalogoSemFacial = {
  categorias: [
    {
      id: 'cat_1',
      nome: 'Checkers & Consultas',
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
      servicos: [
        { id: 'gerar-crlv', nome: 'Gerador de CRLV (Uber / 99)', icone: 'fas fa-file-alt', status: 'ativo' },
        { id: 'gerador-cnh', nome: 'Gerador de CNH', icone: 'fas fa-id-card', status: 'ativo' },
        { id: 'gerador-chassi', nome: 'Gerador de Chassi', icone: 'fas fa-fingerprint', status: 'ativo' }
      ]
    },
    {
      id: 'cat_4',
      nome: 'Ferramentas',
      servicos: [
        { id: 'venda-de-bicos', nome: 'Venda de Bicos', icone: 'fas fa-bolt', status: 'ativo' }
      ]
    }
  ]
};

const VITAIS = ['consulta-cnh', 'consulta-cpf', 'consulta-telefone', 'consulta-placa', 'gerar-crlv', 'gerador-cnh', 'gerador-chassi'];
const FACIAIS = ['reconhecimento-facial', 'busca-por-foto'];

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // Ignora 404 de recurso (ex.: favicon) — ruído pré-existente não
      // relacionado à sincronização de categorias.
      const t = msg.text() || '';
      if (/404|favicon|Failed to load resource/i.test(t)) return;
      erros.push('console.error: ' + t);
    }
  });

  // 1) Prepara o estado como o admin deixaria após excluir a categoria facial
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(({ catalogo, removed }) => {
    localStorage.setItem('FredContas_MasterModules', JSON.stringify(catalogo));
    localStorage.setItem('FredContas_MasterModules_removed', JSON.stringify(removed));
  }, { catalogo: catalogoSemFacial, removed: [{ id: 'cat_3', nome: 'Fotos & Facial' }] });

  // 2) Recarrega o painel do usuário
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-service]').length > 0, { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500));

  // 3) Coleta os cards e os títulos de categoria exibidos
  const resultado = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-service]')).map(c => c.getAttribute('data-service'));
    const textos = document.body.innerText || '';
    return { cards, textos };
  });

  const ids = resultado.cards;
  const presentes = VITAIS.filter(id => ids.includes(id));
  const faltantes = VITAIS.filter(id => !ids.includes(id));
  const faciaisPresentes = FACIAIS.filter(id => ids.includes(id));

  console.log('\n===== TESTE: REMOÇÃO DE CATEGORIA FACIAL (admin -> usuário) =====');
  console.log('Cards exibidos:', ids.length);
  console.log('Vitais presentes:', presentes);
  console.log('Vitais faltantes:', faltantes);
  console.log('Faciais presentes (NÃO deveriam estar):', faciaisPresentes);
  console.log('Texto contém "Fotos & Facial":', /Fotos\s*&\s*Facial/i.test(resultado.textos));
  console.log('Texto contém "Reconhecimento Facial":', /Reconhecimento\s*Facial/i.test(resultado.textos));

  let ok = true;
  if (faltantes.length > 0) { console.log('❌ FALTAM serviços vitais:', faltantes); ok = false; }
  if (faciaisPresentes.length > 0) { console.log('❌ Categoria facial AINDA aparece:', faciaisPresentes); ok = false; }
  if (/Fotos\s*&\s*Facial/i.test(resultado.textos)) { console.log('❌ Título "Fotos & Facial" ainda visível'); ok = false; }
  if (/Reconhecimento\s*Facial/i.test(resultado.textos)) { console.log('❌ Serviço "Reconhecimento Facial" ainda visível'); ok = false; }
  if (erros.length > 0) { console.log('❌ Erros de página:', erros); ok = false; }

  await page.screenshot({ path: 'validacao-sync-categoria.png', fullPage: true });
  await browser.close();

  console.log('\n===== RESUMO =====');
  console.log(ok ? '✅ APROVADO: remoção de categoria refletida no painel do usuário' : '❌ REPROVADO');
  process.exit(ok ? 0 : 1);
}

main().catch(e => { console.error('FALHA no teste:', e); process.exit(1); });
