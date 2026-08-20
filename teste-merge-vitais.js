/* ============================================================
 * Teste de recuperação do painel do usuário
 * ------------------------------------------------------------
 * Simula um localStorage com catálogo ANTIGO/INCOMPLETO (sem as
 * funções vitais CPF/CNH/CRLV) e verifica que cmsLoadModules()
 * agora SEMPRE garante os serviços vitais via merge.
 * Executa o script.js real dentro de um VM com stubs de browser.
 * ============================================================ */
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('script.js', 'utf8');

// Catálogo "quebrado": apenas Fotos & Facial (sem Consultas/CPF/CNH/CRLV)
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

const storage = new Map();
storage.set('FredContas_MasterModules', JSON.stringify(staleCatalog));

const sandbox = {
  console: console,
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k)
  },
  window: { addEventListener: () => {}, dispatchEvent: () => {} },
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }
  },
  setTimeout: () => 0,
  clearTimeout: () => {},
  setInterval: () => 0,
  clearInterval: () => {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  XMLHttpRequest: function () {},
  location: { href: '', reload: () => {} },
  navigator: { userAgent: 'node-test' },
  URL: require('url').URL,
  requestAnimationFrame: () => 0
};
sandbox.self = sandbox;
vm.createContext(sandbox);

try {
  vm.runInContext(code, sandbox, { timeout: 8000 });
} catch (e) {
  // Erros de execução no top-level (DOM ausente) não invalidam o teste:
  // as funções são hoisted e já estão no contexto.
  console.log('[aviso] execução top-level: ' + e.message);
}

const cmsLoadModules = sandbox.cmsLoadModules;
if (typeof cmsLoadModules !== 'function') {
  console.error('FALHA: cmsLoadModules não encontrada no contexto.');
  process.exit(1);
}

const result = cmsLoadModules();
if (!result || !Array.isArray(result.categorias)) {
  console.error('FALHA: cmsLoadModules retornou inválido.');
  process.exit(1);
}

const todasIds = [];
result.categorias.forEach(c => (c.servicos || []).forEach(s => todasIds.push(s.id)));

const vitais = ['consulta-cnh', 'consulta-cpf', 'consulta-telefone', 'consulta-placa', 'gerar-crlv', 'gerador-cnh', 'gerador-chassi', 'gerador-cpf', 'gerador-cnpj', 'reconhecimento-facial'];
const faltantes = vitais.filter(id => !todasIds.includes(id));

console.log('Categorias resultantes: ' + result.categorias.map(c => c.nome).join(' | '));
console.log('Total de serviços: ' + todasIds.length);
console.log('Serviços vitais presentes: ' + vitais.filter(id => todasIds.includes(id)).join(', '));

if (faltantes.length) {
  console.error('FALHA: serviços vitais AUSENTES -> ' + faltantes.join(', '));
  process.exit(1);
}

// Verifica que não houve duplicação (cada id único)
const unicos = new Set(todasIds);
if (unicos.size !== todasIds.length) {
  console.error('FALHA: há serviços duplicados no resultado.');
  process.exit(1);
}

console.log('SUCESSO: todos os serviços vitais restaurados, sem duplicação.');
process.exit(0);
