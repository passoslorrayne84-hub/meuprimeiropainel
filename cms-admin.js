/* ============================================================
   ESPAÇO UBER - GERENCIADOR DE MÓDULOS (CMS HEADLESS)
   Controle remoto dos serviços exibidos no painel do usuário.
   Chave de armazenamento: FredContas_MasterModules
   Schema purificado: { categorias: [ { id, nome, servicos: [
     { id, nome, icone, status } ] } ] }
   ============================================================ */

'use strict';

/* ===== CONSTANTES ===== */
const CMS_STORAGE_KEY = 'FredContas_MasterModules';

/* ===== DADOS PADRÃO (FALLBACK) ===== */
// Catálogo completo com TODOS os serviços vitais do painel (Consultas CPF/CNH/
// Placa/Telefone, Gerador de CRLV Uber/99, Gerador de CNH, Chassi, etc.).
// Os IDs seguem exatamente os reconhecidos por detectToolType/isToolViewportService
// no script.js, garantindo que cada card abra a ferramenta correta.
const CMS_DEFAULT_MODULES = {
  categorias: [
    {
      id: 'cat_1',
      nome: 'Checkers & Consultas',
      servicos: [
        { id: 'consulta-cnh', nome: 'Consulta CNH', icone: 'fas fa-id-card', status: 'ativo' },
        { id: 'consulta-cpf', nome: 'Consulta CPF', icone: 'fas fa-user-check', status: 'ativo' },
        { id: 'consulta-telefone', nome: 'Consulta Telefone', icone: 'fas fa-phone', status: 'ativo' },
        { id: 'consulta-placa', nome: 'Consulta Placa', icone: 'fas fa-car-side', status: 'ativo' },
        { id: 'score-credito', nome: 'Score de Crédito', icone: 'fas fa-chart-line', status: 'manutencao' }
      ]
    },
    {
      id: 'cat_2',
      nome: 'Geradores',
      servicos: [
        { id: 'gerar-crlv', nome: 'Gerador de CRLV (Uber / 99)', icone: 'fas fa-file-alt', status: 'ativo' },
        { id: 'gerador-cnh', nome: 'Gerador de CNH', icone: 'fas fa-id-card', status: 'ativo' },
        { id: 'gerador-chassi', nome: 'Gerador de Chassi', icone: 'fas fa-fingerprint', status: 'ativo' },
        { id: 'gerador-cpf', nome: 'Gerador de CPF', icone: 'fas fa-dice', status: 'ativo' },
        { id: 'gerador-cnpj', nome: 'Gerador de CNPJ', icone: 'fas fa-building', status: 'ativo' }
      ]
    },
    {
      id: 'cat_3',
      nome: 'Fotos & Facial',
      servicos: [
        { id: 'reconhecimento-facial', nome: 'Reconhecimento Facial', icone: 'fas fa-face-smile', status: 'ativo' },
        { id: 'busca-por-foto', nome: 'Busca por Foto', icone: 'fas fa-image', status: 'inativo' }
      ]
    },
    {
      id: 'cat_4',
      nome: 'Ferramentas',
      servicos: [
        { id: 'venda-de-bicos', nome: 'Venda de Bicos', icone: 'fas fa-bolt', status: 'ativo' },
        { id: 'modo-foto-99', nome: 'Modo Foto 99', icone: 'fas fa-camera', status: 'ativo' }
      ]
    }
  ]
};

/* ===== ESTADO ===== */
let cmsModules = null; // { categorias: [...] }
let cmsNextCatNum = 1;
let cmsNextSrvNum = 1;
let cmsEditingCard = null; // { catId, srvId } quando editando
let cmsExpandedCats = {};  // { catId: true } categorias expandidas

/* ===== DOM REFERENCES ===== */
const cmsDom = {
  modules: document.getElementById('cmsModules'),
  count: document.getElementById('cmsCount'),
  btnSave: document.getElementById('btnSaveModules'),
  btnReset: document.getElementById('btnResetModules'),
  btnOpenModal: document.getElementById('btnOpenModal'),
  // Modal
  modalOverlay: document.getElementById('cmsModalOverlay'),
  modalTitle: document.getElementById('cmsModalTitle'),
  modalClose: document.getElementById('cmsModalClose'),
  modalCancel: document.getElementById('cmsModalCancel'),
  modalConfirm: document.getElementById('cmsModalConfirm'),
  modalConfirmLabel: document.getElementById('cmsModalConfirmLabel'),
  cardCategory: document.getElementById('cmsCardCategory'),
  cardNewCat: document.getElementById('cmsCardNewCat'),
  cardNewCatToggle: document.getElementById('cmsCardNewCatToggle'),
  cardTitle: document.getElementById('cmsCardTitle'),
  cardStatus: document.getElementById('cmsCardStatus'),
  cardStatusLabel: document.getElementById('cmsCardStatusLabel'),
  cardSidebar: document.getElementById('cmsCardSidebar')
};

/* ===== HELPERS ===== */
function cmsEscapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
}

function cmsStatusLabel(status) {
  const map = {
    ativo: { label: 'Ativo', cls: 'on' },
    inativo: { label: 'Inativo', cls: 'off' },
    manutencao: { label: 'Manutenção', cls: 'manut' }
  };
  return map[status] || { label: status, cls: 'off' };
}

function cmsFindCat(catId) {
  return (cmsModules.categorias || []).find(c => c.id === catId);
}

function cmsFindSrv(catId, srvId) {
  const cat = cmsFindCat(catId);
  if (!cat) return null;
  return (cat.servicos || []).find(s => s.id === srvId);
}

/* ===== MIGRAÇÃO SEGURA (SCHEMA ANTIGO -> NOVO) ===== */
function cmsMigrateLegacy(parsed) {
  // Schema antigo: { categorias: [ { id, nome, cards: [ { id, titulo, icon, status, valor, badge } ] } ] }
  if (!parsed || !Array.isArray(parsed.categorias)) return null;

  const categorias = parsed.categorias.map((cat, ci) => {
    const oldCards = Array.isArray(cat.cards) ? cat.cards : [];
    const servicos = oldCards.map((card, si) => ({
      id: card.id != null ? 'srv_' + card.id : 'srv_' + (ci + 1) + '_' + (si + 1),
      nome: card.titulo || card.nome || 'Serviço',
      icone: card.icon || card.icone || 'fas fa-cube',
      status: cmsNormalizeStatus(card.status)
    }));
    return {
      id: cat.id != null ? 'cat_' + cat.id : 'cat_' + (ci + 1),
      nome: cat.nome || 'Categoria',
      servicos
    };
  });

  return { categorias };
}

function cmsNormalizeStatus(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'ON' || s === 'ATIVO' || s === 'ACTIVE') return 'ativo';
  if (s === 'MANUTENCAO' || s === 'MANUTENÇÃO' || s === 'MAINTENANCE') return 'manutencao';
  return 'inativo';
}

function cmsIsNewSchema(parsed) {
  if (!parsed || !Array.isArray(parsed.categorias)) return false;
  // Novo schema usa "servicos" (não "cards")
  const first = parsed.categorias[0];
  return first && Array.isArray(first.servicos);
}

/* ===== CARREGAR / SALVAR ===== */
function cmsLoadModules() {
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (cmsIsNewSchema(parsed)) {
        cmsModules = parsed;
        cmsEnsureVitalServices();
        return;
      }
      // Schema antigo: migra com segurança
      const migrated = cmsMigrateLegacy(parsed);
      if (migrated) {
        cmsModules = migrated;
        cmsEnsureVitalServices();
        cmsPersist(); // persiste a versão migrada
        console.log('[CMS] Dados migrados do schema antigo para o novo schema.');
        return;
      }
    }
  } catch (e) {
    console.warn('[CMS] Falha ao ler módulos, usando padrão.', e);
  }
  // Fallback: clona o padrão para não mutar a constante
  cmsModules = JSON.parse(JSON.stringify(CMS_DEFAULT_MODULES));
  cmsEnsureVitalServices();
}

// Garante que os serviços vitais (Consultas CPF/CNH/Telefone/Placa, CRLV,
// CNH, Chassi) SEMPRE existam no catálogo, mesclando com os padrões quando
// o localStorage contém dados antigos/incompletos. Não duplica serviços.
function cmsEnsureVitalServices() {
  if (!cmsModules || !Array.isArray(cmsModules.categorias)) return;
  const defaults = (CMS_DEFAULT_MODULES && CMS_DEFAULT_MODULES.categorias) || [];
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const idsPorCat = new Map();
  cmsModules.categorias.forEach(cat => {
    const ids = new Set((cat.servicos || []).map(s => s && s.id));
    idsPorCat.set(cat.id, ids);
  });
  defaults.forEach(defCat => {
    if (!defCat || !defCat.servicos || !Array.isArray(defCat.servicos)) return;
    const alvo = cmsModules.categorias.find(cat =>
      cat && (cat.id === defCat.id ||
        (defCat.nome && norm(cat.nome) === norm(defCat.nome)))
    );
    if (alvo) {
      const ids = idsPorCat.get(alvo.id) || new Set();
      defCat.servicos.forEach(s => {
        if (s && s.id && !ids.has(s.id)) {
          alvo.servicos.push({
            id: s.id,
            nome: s.nome || 'Servico',
            icone: s.icone || 'fas fa-cube',
            status: s.status || 'ativo',
            descricao: s.descricao || ''
          });
          ids.add(s.id);
        }
      });
    } else {
      cmsModules.categorias.push(JSON.parse(JSON.stringify(defCat)));
    }
  });
}

function cmsPersist() {
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(cmsModules));
    // Notifica o painel do usuário (mesma aba) para atualização instantânea
    // das categorias na sidebar e da vitrine, sem necessidade de refresh.
    try {
      window.dispatchEvent(new CustomEvent('fred-modules-updated'));
    } catch (e) {
      /* evento customizado não suportado -> ignora */
    }
    return true;
  } catch (e) {
    console.error('[CMS] Falha ao salvar módulos.', e);
    return false;
  }
}

function cmsRecomputeIds() {
  let maxCat = 0;
  let maxSrv = 0;
  (cmsModules.categorias || []).forEach(cat => {
    const catNum = parseInt(String(cat.id).replace('cat_', '')) || 0;
    if (catNum > maxCat) maxCat = catNum;
    (cat.servicos || []).forEach(srv => {
      const srvNum = parseInt(String(srv.id).replace('srv_', '')) || 0;
      if (srvNum > maxSrv) maxSrv = srvNum;
    });
  });
  cmsNextCatNum = maxCat + 1;
  cmsNextSrvNum = maxSrv + 1;
}

/* ===== RENDERIZAÇÃO ===== */
function cmsRenderCategorySelect() {
  if (!cmsDom.cardCategory) return;
  const current = cmsDom.cardCategory.value;
  cmsDom.cardCategory.innerHTML =
    '<option value="">— Selecione uma categoria —</option>' +
    (cmsModules.categorias || []).map(cat =>
      `<option value="${cmsEscapeHtml(cat.id)}">${cmsEscapeHtml(cat.nome)}</option>`
    ).join('');
  if (current && [...cmsDom.cardCategory.options].some(o => o.value === current)) {
    cmsDom.cardCategory.value = current;
  }
}

function cmsRenderModules() {
  if (!cmsDom.modules) return;
  const cats = cmsModules.categorias || [];
  let totalServicos = 0;

  if (cats.length === 0) {
    cmsDom.modules.innerHTML = `
      <div class="cms-empty">
        <i class="fas fa-box-open"></i>
        <p>Nenhuma categoria criada ainda.</p>
        <button class="btn-primary cms-btn-add" data-action="add-cat-empty">
          <i class="fas fa-plus"></i> Criar primeira categoria
        </button>
      </div>`;
    if (cmsDom.count) cmsDom.count.textContent = '0 serviços';
    return;
  }

  cmsDom.modules.innerHTML = cats.map(cat => {
    const servicos = cat.servicos || [];
    totalServicos += servicos.length;
    const expanded = cmsExpandedCats[cat.id] !== false; // padrão expandido
    const cardsHtml = servicos.length === 0
      ? '<div class="cms-empty cms-empty-sm">Sem serviços nesta categoria.</div>'
      : servicos.map(srv => {
          const st = cmsStatusLabel(srv.status);
          return `
            <div class="cms-card" data-srv-id="${cmsEscapeHtml(srv.id)}" data-cat-id="${cmsEscapeHtml(cat.id)}">
              <div class="cms-card-icon"><i class="${cmsEscapeHtml(srv.icone || 'fas fa-cube')}"></i></div>
              <div class="cms-card-info">
                <div class="cms-card-title">${cmsEscapeHtml(srv.nome)}</div>
                <div class="cms-card-meta">
                  <span class="cms-status ${st.cls}">${st.label}</span>
                </div>
              </div>
              <div class="cms-card-actions">
                <button class="cms-icon-btn edit" data-action="edit-card" data-id="${cmsEscapeHtml(srv.id)}" data-cat="${cmsEscapeHtml(cat.id)}" title="Editar">
                  <i class="fas fa-pen"></i>
                </button>
                <button class="cms-icon-btn move" data-action="move-card" data-id="${cmsEscapeHtml(srv.id)}" data-cat="${cmsEscapeHtml(cat.id)}" title="Mover para outra categoria">
                  <i class="fas fa-arrows-rotate"></i>
                </button>
                <button class="cms-icon-btn del" data-action="del-card" data-id="${cmsEscapeHtml(srv.id)}" data-cat="${cmsEscapeHtml(cat.id)}" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');

    return `
      <div class="cms-module-group ${expanded ? 'expanded' : ''}" data-cat-id="${cmsEscapeHtml(cat.id)}">
        <div class="cms-module-header">
          <button class="cms-module-toggle" data-action="toggle-cat" data-id="${cmsEscapeHtml(cat.id)}" title="${expanded ? 'Recolher' : 'Expandir'}">
            <i class="fas fa-chevron-${expanded ? 'down' : 'right'}"></i>
          </button>
          <div class="cms-module-title">
            <i class="fas fa-folder-open"></i>
            <span>${cmsEscapeHtml(cat.nome)}</span>
            <em>${servicos.length} serviço${servicos.length === 1 ? '' : 's'}</em>
          </div>
          <div class="cms-module-actions">
            <button class="cms-icon-btn add" data-action="add-cat" data-id="${cmsEscapeHtml(cat.id)}" title="Adicionar nova categoria">
              <i class="fas fa-folder-plus"></i>
            </button>
            <button class="cms-icon-btn edit" data-action="edit-cat" data-id="${cmsEscapeHtml(cat.id)}" title="Renomear categoria">
              <i class="fas fa-pen"></i>
            </button>
            <button class="cms-icon-btn del" data-action="del-cat" data-id="${cmsEscapeHtml(cat.id)}" title="Excluir categoria">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="cms-card-grid" ${expanded ? '' : 'style="display:none;"'}>${cardsHtml}</div>
      </div>
    `;
  }).join('');

  if (cmsDom.count) cmsDom.count.textContent = `${totalServicos} serviço${totalServicos === 1 ? '' : 's'}`;
}

function cmsRenderAll() {
  cmsRenderCategorySelect();
  cmsRenderModules();
}

/* ===== MODAL ===== */
function cmsOpenModal(mode, catId, srvId) {
  cmsRenderCategorySelect();
  cmsEditingCard = null;

  if (mode === 'edit' && catId && srvId) {
    const srv = cmsFindSrv(catId, srvId);
    if (!srv) return;
    cmsEditingCard = { catId, srvId };
    if (cmsDom.modalTitle) cmsDom.modalTitle.innerHTML = '<i class="fas fa-pen"></i> Editar Serviço';
    if (cmsDom.modalConfirmLabel) cmsDom.modalConfirmLabel.textContent = 'Salvar';
    if (cmsDom.cardCategory) cmsDom.cardCategory.value = catId;
    if (cmsDom.cardTitle) cmsDom.cardTitle.value = srv.nome || '';
    if (cmsDom.cardStatus) cmsDom.cardStatus.checked = srv.status !== 'manutencao' && srv.status !== 'inativo';
    if (cmsDom.cardStatusLabel) cmsDom.cardStatusLabel.textContent = cmsDom.cardStatus.checked ? 'Ativo' : 'Manutenção';
    if (cmsDom.cardNewCatToggle) cmsDom.cardNewCatToggle.checked = false;
    if (cmsDom.cardNewCat) { cmsDom.cardNewCat.style.display = 'none'; cmsDom.cardNewCat.value = ''; }
    if (cmsDom.cardSidebar) cmsDom.cardSidebar.value = '';
  } else {
    if (cmsDom.modalTitle) cmsDom.modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Novo Serviço';
    if (cmsDom.modalConfirmLabel) cmsDom.modalConfirmLabel.textContent = 'Adicionar';
    if (cmsDom.cardCategory) cmsDom.cardCategory.value = catId ? catId : '';
    if (cmsDom.cardTitle) cmsDom.cardTitle.value = '';
    if (cmsDom.cardStatus) cmsDom.cardStatus.checked = true;
    if (cmsDom.cardStatusLabel) cmsDom.cardStatusLabel.textContent = 'Ativo';
    if (cmsDom.cardNewCatToggle) cmsDom.cardNewCatToggle.checked = false;
    if (cmsDom.cardNewCat) { cmsDom.cardNewCat.style.display = 'none'; cmsDom.cardNewCat.value = ''; }
    if (cmsDom.cardSidebar) cmsDom.cardSidebar.value = '';
  }

  if (cmsDom.modalOverlay) cmsDom.modalOverlay.classList.add('open');
  if (cmsDom.cardTitle) setTimeout(() => cmsDom.cardTitle.focus(), 60);
}

function cmsCloseModal() {
  if (cmsDom.modalOverlay) cmsDom.modalOverlay.classList.remove('open');
  cmsEditingCard = null;
}

function cmsConfirmModal() {
  if (cmsEditingCard) {
    cmsSaveCardEdit();
  } else {
    cmsAddCard();
  }
}

/* ===== AÇÕES: CATEGORIAS ===== */
function cmsAddCategory(nome) {
  const name = (nome || '').trim();
  if (!name) {
    if (typeof showToast === 'function') showToast('Atenção', 'Digite um nome para a categoria.');
    return null;
  }
  // Gera um ID único garantido (baseado em timestamp) para evitar duplicação
  // de categorias na sidebar e no dashboard do usuário.
  let id = 'cat_' + Date.now();
  while (cmsModules.categorias.some(c => c.id === id)) {
    id = 'cat_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }
  const cat = { id, nome: name, servicos: [] };
  cmsModules.categorias.push(cat);
  cmsExpandedCats[cat.id] = true;
  cmsRenderAll();
  cmsPersist(); // persiste e dispara 'fred-modules-updated' (reatividade em tempo real)
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Categoria Criada', `Categoria "${name}" adicionada.`);
  return cat;
}

function cmsRenameCategory(id) {
  const cat = cmsFindCat(id);
  if (!cat) return;
  const novo = prompt('Novo nome da categoria:', cat.nome);
  if (novo && novo.trim()) {
    cat.nome = novo.trim();
    cmsRenderAll();
    cmsPersist(); // persiste e dispara 'fred-modules-updated'
    cmsBackupAuto(cmsModules);
    cmsUpdateBackupHint();
    if (typeof showToast === 'function') showToast('Categoria Renomeada', 'Nome atualizado.');
  }
}

function cmsDeleteCategory(id) {
  const cat = cmsFindCat(id);
  if (!cat) return;
  if (!confirm(`Excluir a categoria "${cat.nome}" e todos os seus serviços?`)) return;
  cmsModules.categorias = cmsModules.categorias.filter(c => c.id !== id);
  delete cmsExpandedCats[id];
  cmsRecomputeIds();
  cmsRenderAll();
  cmsPersist(); // persiste e dispara 'fred-modules-updated'
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Categoria Excluída', `Categoria "${cat.nome}" removida.`);
}

/* ===== AÇÕES: SERVIÇOS ===== */
function cmsAddCard() {
  let catId = cmsDom.cardCategory.value;
  const nome = (cmsDom.cardTitle.value || '').trim();
  const status = cmsDom.cardStatus.checked ? 'ativo' : 'manutencao';

  // Se marcou "criar nova categoria", cria a categoria primeiro
  if (cmsDom.cardNewCatToggle && cmsDom.cardNewCatToggle.checked) {
    const novaCat = (cmsDom.cardNewCat.value || '').trim();
    if (!novaCat) {
      if (typeof showToast === 'function') showToast('Atenção', 'Informe o nome da nova categoria.');
      return;
    }
    const cat = cmsAddCategory(novaCat);
    if (cat) catId = cat.id;
  }

  if (!catId) {
    if (typeof showToast === 'function') showToast('Atenção', 'Selecione ou crie uma categoria de destino.');
    return;
  }
  if (!nome) {
    if (typeof showToast === 'function') showToast('Atenção', 'Informe o nome do serviço.');
    return;
  }

  const cat = cmsFindCat(catId);
  if (!cat) return;

  cat.servicos.push({ id: 'srv_' + cmsNextSrvNum++, nome, icone: 'fas fa-cube', status });
  cmsExpandedCats[catId] = true;

  // Sincroniza a aba do menu lateral, se informada
  const abaSidebar = cmsDom.cardSidebar ? cmsDom.cardSidebar.value : '';
  if (abaSidebar && abaSidebar.trim()) {
    cmsSyncSidebarTab(abaSidebar);
  }

  cmsCloseModal();
  cmsRenderAll();
  cmsPersist(); // persiste e dispara 'fred-modules-updated' (reatividade em tempo real)
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Serviço Adicionado', `"${nome}" adicionado em "${cat.nome}".`);
}

function cmsSaveCardEdit() {
  if (!cmsEditingCard) return;
  const { catId, srvId } = cmsEditingCard;
  const srv = cmsFindSrv(catId, srvId);
  if (!srv) return;

  const nome = (cmsDom.cardTitle.value || '').trim();
  const status = cmsDom.cardStatus.checked ? 'ativo' : 'manutencao';

  if (!nome) {
    if (typeof showToast === 'function') showToast('Atenção', 'Informe o nome do serviço.');
    return;
  }

  srv.nome = nome;
  srv.status = status;

  // Sincroniza a aba do menu lateral, se informada
  const abaSidebar = cmsDom.cardSidebar ? cmsDom.cardSidebar.value : '';
  if (abaSidebar && abaSidebar.trim()) {
    cmsSyncSidebarTab(abaSidebar);
  }

  cmsCloseModal();
  cmsRenderAll();
  cmsPersist(); // persiste e dispara 'fred-modules-updated' (reatividade em tempo real)
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Serviço Atualizado', 'Alterações aplicadas.');
}

/* ===== ABA NO MENU LATERAL (SINCRONIZAÇÃO AUTOMÁTICA) ===== */
// Cria ou atualiza uma CATEGORIA no painel do usuário (FredContas_MasterModules).
// A partir de agora, toda criação feita no painel admin entra na CATEGORIA do
// painel do usuário (renderCmsSidebarCategories) e NUNCA no menu principal.
function cmsSyncSidebarTab(nomeAba) {
  const nome = (nomeAba || '').trim();
  if (!nome) return false;

  // Garante que os módulos do CMS estão carregados
  if (!cmsModules) cmsLoadModules();
  if (!cmsModules || !Array.isArray(cmsModules.categorias)) return false;

  // Se já existe uma categoria com o mesmo nome, apenas retorna (sem duplicar)
  const existente = cmsModules.categorias.find(c =>
    (c.nome || '').toLowerCase() === nome.toLowerCase()
  );
  if (existente) return true;

  // Cria uma nova categoria no painel do usuário
  cmsModules.categorias.push({
    id: 'cat_' + cmsNextCatNum++,
    nome: nome,
    servicos: []
  });
  cmsExpandedCats['cat_' + (cmsNextCatNum - 1)] = true;
  cmsPersist();
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  cmsRenderAll();
  return true;
}

function cmsDeleteCard(catId, srvId) {
  const cat = cmsFindCat(catId);
  if (!cat) return;
  const srv = (cat.servicos || []).find(s => s.id === srvId);
  if (!srv) return;
  if (!confirm(`Excluir o serviço "${srv.nome}"?`)) return;
  cat.servicos = cat.servicos.filter(s => s.id !== srvId);
  cmsRecomputeIds();
  cmsRenderAll();
  cmsPersist(); // persiste e dispara 'fred-modules-updated' (reatividade em tempo real)
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Serviço Excluído', `"${srv.nome}" removido.`);
}

function cmsMoveCard(catId, srvId) {
  const srv = cmsFindSrv(catId, srvId);
  if (!srv) return;
  const cats = cmsModules.categorias || [];
  if (cats.length < 2) {
    if (typeof showToast === 'function') showToast('Atenção', 'Crie outra categoria para mover o serviço.');
    return;
  }
  const destino = prompt(
    `Mover "${srv.nome}" para qual categoria?\n\n` +
    cats.map(c => `${c.id} - ${c.nome}`).join('\n')
  );
  if (!destino) return;
  const destCat = cmsFindCat(destino.trim());
  if (!destCat || destCat.id === catId) {
    if (typeof showToast === 'function') showToast('Atenção', 'Categoria de destino inválida.');
    return;
  }
  // Remove da origem e adiciona no destino
  const origem = cmsFindCat(catId);
  origem.servicos = origem.servicos.filter(s => s.id !== srvId);
  destCat.servicos.push(srv);
  cmsExpandedCats[destCat.id] = true;
  cmsRenderAll();
  cmsPersist(); // persiste e dispara 'fred-modules-updated' (reatividade em tempo real)
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Serviço Movido', `"${srv.nome}" movido para "${destCat.nome}".`);
}

/* ===== SALVAR E SINCRONIZAR ===== */
function cmsSaveAndSync() {
  const ok = cmsPersist();
  if (ok) {
    if (typeof showToast === 'function') {
      showToast('Módulos Sincronizados', 'Os módulos foram salvos e sincronizados com o painel do usuário em tempo real!');
    }
  } else if (typeof showToast === 'function') {
    showToast('Erro', 'Não foi possível salvar os módulos.');
  }
  return ok;
}

function cmsReset() {
  if (!confirm('Restaurar os módulos padrão? As alterações atuais serão perdidas.')) return;
  cmsModules = JSON.parse(JSON.stringify(CMS_DEFAULT_MODULES));
  cmsExpandedCats = {};
  cmsRecomputeIds();
  cmsRenderAll();
  cmsPersist();
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Módulos Restaurados', 'Os módulos padrão foram restaurados.');
}

/* ===== EXPORTAÇÃO E BACKUP AUTOMÁTICO DO CATÁLOGO ===== */
// Chave do backup automático (cópia de segurança persistente do catálogo).
const CMS_BACKUP_KEY = 'FredContas_MasterModules_backup';

// Salva uma cópia de segurança automática do catálogo atual.
// Chamada sempre que o catálogo é modificado (criar/renomear/excluir
// categoria, adicionar/editar/excluir/mover serviço, restaurar padrão).
function cmsBackupAuto(modules) {
  try {
    localStorage.setItem(CMS_BACKUP_KEY, JSON.stringify(modules));
    return true;
  } catch (e) {
    console.warn('[CMS] Falha ao criar backup automático.', e);
    return false;
  }
}

// Carrega o backup automático salvo (se existir).
function cmsBackupLoad() {
  try {
    const raw = localStorage.getItem(CMS_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.categorias)) return parsed;
    }
  } catch (e) {
    console.warn('[CMS] Falha ao ler backup automático.', e);
  }
  return null;
}

// Formata a data/hora atual para nome de arquivo (ex.: 2026-08-17_23-41).
function cmsTimestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

// Dispara o download de um arquivo no navegador.
function cmsDownload(nomeArquivo, conteudo, tipo) {
  try {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (e) {
    console.warn('[CMS] Falha ao baixar arquivo.', e);
    return false;
  }
}

// Exporta o catálogo de serviços como arquivo JSON.
function cmsExportJson() {
  if (!cmsModules || !Array.isArray(cmsModules.categorias) || cmsModules.categorias.length === 0) {
    if (typeof showToast === 'function') showToast('Catálogo vazio', 'Não há categorias para exportar.');
    return;
  }
  const nome = `catalogo_servicos_${cmsTimestamp()}.json`;
  if (cmsDownload(nome, JSON.stringify(cmsModules, null, 2), 'application/json')) {
    if (typeof showToast === 'function') showToast('Exportado', 'Catálogo exportado em JSON.');
  } else if (typeof showToast === 'function') {
    showToast('Erro ao exportar', 'Não foi possível gerar o arquivo JSON.');
  }
}

// Exporta o catálogo de serviços como arquivo CSV (categoria;serviço;status).
function cmsExportCsv() {
  if (!cmsModules || !Array.isArray(cmsModules.categorias) || cmsModules.categorias.length === 0) {
    if (typeof showToast === 'function') showToast('Catálogo vazio', 'Não há categorias para exportar.');
    return;
  }
  const esc = (v) => {
    const s = String(v == null ? '' : v);
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const linhas = ['categoria;servico;status;icone'];
  cmsModules.categorias.forEach(cat => {
    const servicos = Array.isArray(cat.servicos) ? cat.servicos : [];
    if (servicos.length === 0) {
      linhas.push(`${esc(cat.nome)};;;`);
    } else {
      servicos.forEach(srv => {
        linhas.push(`${esc(cat.nome)};${esc(srv.nome)};${esc(srv.status)};${esc(srv.icone)}`);
      });
    }
  });
  const nome = `catalogo_servicos_${cmsTimestamp()}.csv`;
  if (cmsDownload(nome, linhas.join('\n'), 'text/csv;charset=utf-8')) {
    if (typeof showToast === 'function') showToast('Exportado', 'Catálogo exportado em CSV.');
  } else if (typeof showToast === 'function') {
    showToast('Erro ao exportar', 'Não foi possível gerar o arquivo CSV.');
  }
}

// Restaura o catálogo a partir do backup automático.
function cmsRestoreBackup() {
  const backup = cmsBackupLoad();
  if (!backup) {
    if (typeof showToast === 'function') showToast('Sem backup', 'Nenhum backup automático encontrado.');
    return;
  }
  const totalServicos = (backup.categorias || []).reduce((acc, c) => acc + (Array.isArray(c.servicos) ? c.servicos.length : 0), 0);
  if (totalServicos === 0) {
    if (typeof showToast === 'function') showToast('Backup vazio', 'O backup automático está vazio.');
    return;
  }
  cmsModules = backup;
  cmsEnsureVitalServices();
  cmsExpandedCats = {};
  cmsRecomputeIds();
  cmsRenderAll();
  cmsPersist();
  cmsBackupAuto(cmsModules);
  cmsUpdateBackupHint();
  if (typeof showToast === 'function') showToast('Backup restaurado', `${totalServicos} serviço(s) restaurado(s) do backup.`);
}

// Atualiza o texto de dica do backup automático (status da cópia de segurança).
function cmsUpdateBackupHint() {
  const hintEl = document.getElementById('cmsBackupHint');
  if (!hintEl) return;
  const backup = cmsBackupLoad();
  if (backup && Array.isArray(backup.categorias) && backup.categorias.length > 0) {
    const totalServicos = backup.categorias.reduce((acc, c) => acc + (Array.isArray(c.servicos) ? c.servicos.length : 0), 0);
    hintEl.textContent = `💾 Backup automático ativo: ${backup.categorias.length} categoria(s) e ${totalServicos} serviço(s) em cópia de segurança. Use "Restaurar Backup" para recuperar.`;
    hintEl.classList.add('has-backup');
  } else {
    hintEl.textContent = '💾 Backup automático ativo: o catálogo é copiado automaticamente a cada alteração.';
    hintEl.classList.remove('has-backup');
  }
}

/* ===== EVENTOS ===== */
function cmsBindEvents() {
  // Botão principal de adicionar
  if (cmsDom.btnOpenModal) {
    cmsDom.btnOpenModal.addEventListener('click', () => cmsOpenModal('add'));
  }

  // Modal: fechar / cancelar / confirmar
  if (cmsDom.modalClose) cmsDom.modalClose.addEventListener('click', cmsCloseModal);
  if (cmsDom.modalCancel) cmsDom.modalCancel.addEventListener('click', cmsCloseModal);
  if (cmsDom.modalConfirm) cmsDom.modalConfirm.addEventListener('click', cmsConfirmModal);
  if (cmsDom.modalOverlay) {
    cmsDom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === cmsDom.modalOverlay) cmsCloseModal();
    });
  }

  // Toggle nova categoria no modal
  if (cmsDom.cardNewCatToggle) {
    cmsDom.cardNewCatToggle.addEventListener('change', () => {
      if (cmsDom.cardNewCat) {
        cmsDom.cardNewCat.style.display = cmsDom.cardNewCatToggle.checked ? 'block' : 'none';
        if (cmsDom.cardNewCatToggle.checked) cmsDom.cardNewCat.focus();
      }
    });
  }

  // Switch de status no modal
  if (cmsDom.cardStatus) {
    cmsDom.cardStatus.addEventListener('change', () => {
      if (cmsDom.cardStatusLabel) {
        cmsDom.cardStatusLabel.textContent = cmsDom.cardStatus.checked ? 'Ativo' : 'Manutenção';
      }
    });
  }

  // Enter no campo título confirma o modal
  if (cmsDom.cardTitle) {
    cmsDom.cardTitle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') cmsConfirmModal();
    });
  }

  // Salvar / restaurar
  if (cmsDom.btnSave) cmsDom.btnSave.addEventListener('click', cmsSaveAndSync);
  if (cmsDom.btnReset) cmsDom.btnReset.addEventListener('click', cmsReset);

  // Exportar catálogo como JSON
  const btnCmsExportJson = document.getElementById('btnCmsExportJson');
  if (btnCmsExportJson) btnCmsExportJson.addEventListener('click', cmsExportJson);

  // Exportar catálogo como CSV
  const btnCmsExportCsv = document.getElementById('btnCmsExportCsv');
  if (btnCmsExportCsv) btnCmsExportCsv.addEventListener('click', cmsExportCsv);

  // Restaurar catálogo a partir do backup automático
  const btnCmsRestoreBackup = document.getElementById('btnCmsRestoreBackup');
  if (btnCmsRestoreBackup) btnCmsRestoreBackup.addEventListener('click', cmsRestoreBackup);

  // Delegação de eventos na lista de módulos (categorias + cards)
  if (cmsDom.modules) {
    cmsDom.modules.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const catId = btn.dataset.cat;

      switch (action) {
        case 'toggle-cat':
          cmsExpandedCats[id] = cmsExpandedCats[id] === false;
          cmsRenderModules();
          break;
        case 'add-cat':
          const novaNome = prompt('Nome da nova categoria:');
          if (novaNome && novaNome.trim()) cmsAddCategory(novaNome.trim());
          break;
        case 'edit-cat':
          cmsRenameCategory(id);
          break;
        case 'del-cat':
          cmsDeleteCategory(id);
          break;
        case 'edit-card':
          cmsOpenModal('edit', catId, id);
          break;
        case 'move-card':
          cmsMoveCard(catId, id);
          break;
        case 'del-card':
          cmsDeleteCard(catId, id);
          break;
        case 'add-cat-empty':
          const nome = prompt('Nome da nova categoria:');
          if (nome && nome.trim()) cmsAddCategory(nome.trim());
          break;
      }
    });
  }
}

/* ===== INICIALIZAÇÃO ===== */
document.addEventListener('DOMContentLoaded', () => {
  cmsLoadModules();
  cmsRecomputeIds();
  cmsBindEvents();
  cmsRenderAll();
  // Se o catálogo no localStorage estiver vazio/ausente, persiste as
  // categorias padrão para que apareçam também no painel do usuário.
  if (!localStorage.getItem(CMS_STORAGE_KEY)) {
    cmsPersist();
  }
  // Garante que o backup automático exista (cria a partir do catálogo atual
  // na primeira carga, para que "Restaurar Backup" tenha sempre uma cópia).
  if (!cmsBackupLoad()) {
    cmsBackupAuto(cmsModules);
  }
  cmsUpdateBackupHint();
  console.log('%c🧩 Gerenciador de Módulos (CMS) inicializado!', 'color: #fe0979; font-size: 13px; font-weight: bold;');
});
