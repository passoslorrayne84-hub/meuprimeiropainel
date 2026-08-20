/* ============================================================
 * Teste de recuperação no ADMIN (cms-admin.js)
 * ------------------------------------------------------------
 * Simula um localStorage com catálogo antigo/incompleto e
 * verifica que cmsLoadModules() + cmsEnsureVitalServices()
 * garantem os serviços vitais no painel do admin também.
 * ============================================================ */
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('cms-admin.js', 'utf8');

const staleCatalog = {
  categorias: [
    { id: 'cat_3', nome: 'Fotos & Facial', servicos: [
      { id: 'reconhecimento-facial', nome: 'Reconhecimento Facial', icone: 'fas fa-face-smile', status: 'ativo' }
    ] }
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
  URL: require('url').URL
};
sandbox.self = sandbox;
vm.createContext(sandbox);

try {
  vm.runInContext(code, sandbox, { timeout: 8000 });
} catch (e) {
  console.log('[aviso] execução top-level: ' + e.message);
}

const cmsLoadModules = sandbox.cmsLoadModules;
if (typeof cmsLoadModules !== 'function') {
  console.error('FALHA: cmsLoadModules não encontrada no contexto do admin.');
  process.exit(1);
}

cmsLoadModules();
// `cmsModules` é um `let` de escopo de módulo (não global), então precisa
// ser lido DENTRO do contexto via runInContext.
let result;
try {
  result = JSON.parse(vm.runInContext('JSON.stringify(cmsModules)', sandbox));
} catch (e) {
  console.error('FALHA: não foi possível ler cmsModules no contexto: ' + e.message);
  process.exit(1);
}
if (!result || !Array.isArray(result.categorias)) {
  console.error('FALHA: cmsModules inválido após cmsLoadModules.');
  process.exit(1);
}

const todasIds = [];
result.categorias.forEach(c => (c.servicos || []).forEach(s => todasIds.push(s.id)));

const vitais = ['consulta-cnh', 'consulta-cpf', 'consulta-telefone', 'consulta-placa', 'gerar-crlv', 'gerador-cnh', 'gerador-chassi', 'gerador-cpf', 'gerador-cnpj', 'reconhecimento-facial'];
const faltantes = vitais.filter(id => !todasIds.includes(id));

console.log('Categorias (admin): ' + result.categorias.map(c => c.nome).join(' | '));
console.log('Total de serviços (admin): ' + todasIds.length);
console.log('Serviços vitais presentes (admin): ' + vitais.filter(id => todasIds.includes(id)).join(', '));

if (faltantes.length) {
  console.error('FALHA: serviços vitais AUSENTES no admin -> ' + faltantes.join(', '));
  process.exit(1);
}

const unicos = new Set(todasIds);
if (unicos.size !== todasIds.length) {
  console.error('FALHA: há serviços duplicados no admin.');
  process.exit(1);
}

console.log('SUCESSO (admin): todos os serviços vitais restaurados, sem duplicação.');
process.exit(0);
