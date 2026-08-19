/* ============================================================
   ESPAÇO UBER - PAINEL PREMIUM
   Lógica SPA, Navegação e Interações
   ============================================================ */

'use strict';

/* ===== CONFIGURAÇÕES ===== */
const CONFIG = {
  modalDuration: 1400, // duração do modal de carregamento em ms (otimizado)
  toastDuration: 2600, // duração do toast em ms (otimizado)
  serviceMessages: {
    uber: { title: 'Carregando Uber', message: 'Inicializando módulo de corridas...' },
    '99': { title: 'Carregando 99', message: 'Conectando à plataforma 99...' },
    consultas: { title: 'Carregando Consultas', message: 'Acessando banco de dados...' },
    'ferramenta-editor': { title: 'Abrindo Editor', message: 'Carregando editor de dados...' },
    'ferramenta-rotas': { title: 'Analisando Rotas', message: 'Processando dados de tráfego...' },
    'ferramenta-relatorio': { title: 'Gerando Relatório', message: 'Compilando dados de desempenho...' },
    'check-conta': { title: 'Verificando Conta', message: 'Analisando integridade da conta...' },
    'check-seguranca': { title: 'Auditoria de Segurança', message: 'Verificando sessões e dispositivos...' },
    'check-financeiro': { title: 'Análise Financeira', message: 'Processando repasses e ganhos...' },
    'facial-verificacao': { title: 'Verificação Facial', message: 'Inicializando reconhecimento facial...' },
    'facial-analise': { title: 'Análise de Imagem', message: 'Processando imagem com IA...' },
    'facial-documentos': { title: 'OCR de Documentos', message: 'Extraindo dados do documento...' },
    'gerador-dados': { title: 'Gerando Dados', message: 'Criando dados simulados...' },
    'gerador-texto': { title: 'Gerando Texto', message: 'Compondo texto profissional...' },
    'gerador-planilha': { title: 'Gerando Planilha', message: 'Formatando planilha de dados...' },
    'config-perfil': { title: 'Carregando Perfil', message: 'Abrindo configurações do perfil...' },
    'config-seguranca': { title: 'Carregando Segurança', message: 'Inicializando módulo de segurança...' },
    'config-notificacoes': { title: 'Carregando Notificações', message: 'Carregando preferências de alerta...' }
  }
};

/* ===== BASE URL DA API =====
   Detecta se a página foi aberta via file:// (aberta diretamente no navegador).
   Nesse caso, as URLs relativas (/api/...) não resolvem e causam erro de
   rede/CORS. Para resolver, aponta para o servidor local na porta 3000.
   Quando servida pelo próprio servidor (http://localhost:3000), usa a URL
   relativa normal (mesma origem, sem CORS). */
const API_BASE = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:')
  ? 'http://localhost:3000'
  : '';

/* ===== DOM REFERENCES ===== */
const dom = {
  navItems: document.querySelectorAll('.nav-item[data-tab]'),
  tabSections: document.querySelectorAll('.tab-section'),
  serviceButtons: document.querySelectorAll('.btn-service'),
  modal: document.getElementById('loadingModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  progressBar: document.getElementById('progressBar'),
  modalPercent: document.getElementById('modalPercent'),
  toast: document.getElementById('toast'),
  toastTitle: document.getElementById('toastTitle'),
  toastMessage: document.getElementById('toastMessage'),
  btnRenovar: document.getElementById('btnRenovar'),
  btnLogout: document.getElementById('btnLogout'),
  tempoRestante: document.getElementById('tempoRestante'),
  systemName: document.getElementById('systemName'),
  pageTitle: document.getElementById('pageTitle'),
  maintenanceOverlay: document.getElementById('maintenanceOverlay'),
  maintenanceMessage: document.getElementById('maintenanceMessage')
};

/* ===== ESTADO ===== */
let currentTab = 'dashboard';
let modalTimer = null;
let toastTimer = null;

/* ===== NAVEGAÇÃO SPA ===== */
function switchTab(tabName) {
  // Se a viewport interna de ferramentas estiver aberta, fecha ao navegar
  // (mesmo que o usuário clique na aba atualmente ativa, a viewport deve fechar)
  if (toolViewportActive) {
    closeToolViewport();
  }

  if (tabName === currentTab) return;

  // Ao sair de uma categoria do CMS, limpa o estado ativo da sidebar
  if (activeCmsCategory) {
    activeCmsCategory = null;
    renderCmsSidebarCategories();
  }

  // Atualiza itens de navegação (estáticos + dinâmicos)
  dom.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });
  document.querySelectorAll('#dynamicSidebarNav .nav-item[data-tab]').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });
  document.querySelectorAll('#dynamicConfigNav .nav-item[data-tab]').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  // Atualiza seções
  dom.tabSections.forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tabName}`);
  });

  currentTab = tabName;

  // Scroll para o topo ao trocar de aba
  document.getElementById('mainContent').scrollTop = 0;
}

/* ===== MODAL DE CARREGAMENTO ===== */
let modalRaf = null;
let modalStartTime = 0;

function openLoadingModal(serviceKey) {
  const config = CONFIG.serviceMessages[serviceKey] || {
    title: 'Carregando...',
    message: 'Inicializando módulo'
  };

  dom.modalTitle.textContent = config.title;
  dom.modalMessage.textContent = config.message;
  dom.progressBar.style.width = '0%';
  dom.modalPercent.textContent = '0%';

  dom.modal.classList.add('active');

  // Anima a barra de progresso usando requestAnimationFrame (mais eficiente
  // que setInterval, sincronizado com o refresh rate do monitor)
  modalStartTime = performance.now();
  cancelAnimationFrame(modalRaf);

  function animate(now) {
    const elapsed = now - modalStartTime;
    const progress = Math.min((elapsed / CONFIG.modalDuration) * 100, 100);

    dom.progressBar.style.width = `${progress}%`;
    dom.modalPercent.textContent = `${Math.round(progress)}%`;

    if (progress < 100) {
      modalRaf = requestAnimationFrame(animate);
    } else {
      setTimeout(closeLoadingModal, 300);
    }
  }

  modalRaf = requestAnimationFrame(animate);
}

function closeLoadingModal() {
  dom.modal.classList.remove('active');
  cancelAnimationFrame(modalRaf);
  modalRaf = null;
}

/* ===== TOAST ===== */
function showToast(title, message) {
  dom.toastTitle.textContent = title;
  dom.toastMessage.textContent = message;

  dom.toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, CONFIG.toastDuration);
}

/* ===== APLICAÇÃO DE CONFIGURAÇÕES (PAINEL ADMIN) ===== */
// Mapeia cada feature para o data-tab correspondente na sidebar
const FEATURE_TAB_MAP = {
  showFacialAI: 'facial',
  showGenerators: 'geradores',
  showCheckers: 'checkers',
  showTools: 'ferramentas'
};

// Rastreia a última configuração aplicada para detectar mudanças via polling
let lastAppliedConfig = null;

function applyConfig() {
  // Garante que o ConfigStore está disponível (carregado via config-store.js)
  if (typeof ConfigStore === 'undefined') return;

  const config = ConfigStore.load();
  lastAppliedConfig = config.updatedAt || null;

  // 1. Nome do sistema (logo e título da página)
  if (dom.systemName) {
    const name = config.systemName || 'Espaço Uber';
    const parts = name.split(' ');
    const first = parts[0] || 'Espaço';
    const rest = parts.slice(1).join(' ');
    dom.systemName.innerHTML = rest
      ? `${first} <em>${rest}</em>`
      : `<em>${first}</em>`;
  }
  if (dom.pageTitle) {
    dom.pageTitle.textContent = `${config.systemName || 'Espaço Uber'} | Painel Premium`;
  }

  // 2. Visibilidade das funcionalidades (sidebar + seções)
  Object.keys(FEATURE_TAB_MAP).forEach(featureKey => {
    const tabName = FEATURE_TAB_MAP[featureKey];
    const show = config.features[featureKey] !== false;

    // Mostra/oculta o item da sidebar
    const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (navItem) {
      navItem.style.display = show ? '' : 'none';
    }

    // Mostra/oculta a seção correspondente
    const section = document.getElementById(`tab-${tabName}`);
    if (section) {
      section.style.display = show ? '' : 'none';
    }
  });

  // Se a aba atual foi ocultada, volta para o dashboard
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav && activeNav.style.display === 'none') {
    switchTab('dashboard');
  }

  // 3. Modo manutenção
  if (dom.maintenanceOverlay) {
    const maintenanceEnabled = config.maintenance && config.maintenance.enabled;
    dom.maintenanceOverlay.classList.toggle('active', !!maintenanceEnabled);

    if (maintenanceEnabled && dom.maintenanceMessage) {
      dom.maintenanceMessage.textContent =
        (config.maintenance.message || 'Estamos realizando melhorias. Volte em breve!');
    }
  }
}

/* ============================================================
   MOTOR DE RENDERIZAÇÃO DINÂMICA (CMS WHITE-LABEL)
   Aplica a configuração de layout salva pelo Admin no DOM.
   ============================================================ */
const LAYOUT_STORAGE_KEY = 'userPanelConfig';

// Configuração padrão (fallback impecável)
const DEFAULT_LAYOUT = {
  texts: {
    panelName: 'ESPAÇO UBER',
    userName: 'FREDÃO'
  },
  sidebar: {
    width: 260,
    tabs: {
      dashboard: 'Dashboard',
      ferramentas: 'Ferramentas',
      checkers: 'Checkers',
      facial: 'Facial AI',
      geradores: 'Geradores',
      configuracoes: 'Configurações'
    }
  },
  main: {
    sections: {
      servicos: 'Serviços Disponíveis',
      ferramentas: 'Utilitários',
      checkers: 'Sistema de Verificação',
      facial: 'Reconhecimento Facial',
      geradores: 'Geradores Automáticos',
      configuracoes: 'Preferências'
    }
  },
  style: {
    gridGap: 20,
    radius: 16,
    accentColor: '#00f2fe'
  }
};

// Carrega a configuração de layout com fallback seguro
function loadLayoutConfig() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Merge profundo com o padrão para garantir campos completos
    return deepMergeLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)), parsed);
  } catch (e) {
    return null;
  }
}

// Merge profundo simples
function deepMergeLayout(base, override) {
  const result = Array.isArray(base) ? base.slice() : { ...base };
  for (const key in override) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMergeLayout(result[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// Aplica a configuração de layout no DOM sem causar flicker
function loadDynamicLayout() {
  const config = loadLayoutConfig();
  if (!config) return; // Sem configuração salva -> usa o layout padrão do HTML

  const root = document.documentElement;

  // 1. Textos globais
  if (config.texts.panelName && dom.systemName) {
    const name = config.texts.panelName;
    const parts = name.split(' ');
    const first = parts[0] || 'ESPAÇO';
    const rest = parts.slice(1).join(' ');
    dom.systemName.innerHTML = rest
      ? `${first} <em>${rest}</em>`
      : `<em>${first}</em>`;
  }
  if (config.texts.panelName && dom.pageTitle) {
    dom.pageTitle.textContent = `${config.texts.panelName} | Painel Premium`;
  }
  if (config.texts.userName) {
    // Saudação do header
    const h1 = document.querySelector('.header-title h1');
    if (h1) {
      h1.innerHTML = `${h1.textContent.split(',')[0]}, <span class="highlight-pink">${config.texts.userName}</span> 👋`;
    }
    // Nome no rodapé da sidebar
    const userNameEl = document.querySelector('.sidebar-user .user-name');
    if (userNameEl) userNameEl.textContent = config.texts.userName;
    // Avatar
    const avatarEl = document.querySelector('.user-avatar');
    if (avatarEl) avatarEl.textContent = config.texts.userName.charAt(0);
  }

  // 2. Nomes das abas da sidebar
  const tabLabels = {
    dashboard: config.sidebar.tabs.dashboard,
    ferramentas: config.sidebar.tabs.ferramentas,
    checkers: config.sidebar.tabs.checkers,
    facial: config.sidebar.tabs.facial,
    geradores: config.sidebar.tabs.geradores,
    configuracoes: config.sidebar.tabs.configuracoes
  };
  Object.keys(tabLabels).forEach(tab => {
    const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (navItem) {
      const span = navItem.querySelector('span');
      if (span) span.textContent = tabLabels[tab];
    }
  });

  // 3. Títulos das seções do painel principal
  const sectionTitles = {
    servicos: config.main.sections.servicos,
    ferramentas: config.main.sections.ferramentas,
    checkers: config.main.sections.checkers,
    facial: config.main.sections.facial,
    geradores: config.main.sections.geradores,
    configuracoes: config.main.sections.configuracoes
  };
  // Mapeia cada seção para o índice do .section-title h2 dentro da tab
  const sectionTabMap = {
    servicos: 'tab-dashboard',
    ferramentas: 'tab-ferramentas',
    checkers: 'tab-checkers',
    facial: 'tab-facial',
    geradores: 'tab-geradores',
    configuracoes: 'tab-configuracoes'
  };
  Object.keys(sectionTitles).forEach(key => {
    const tabId = sectionTabMap[key];
    const section = document.getElementById(tabId);
    if (section) {
      const h2 = section.querySelector('.section-title h2');
      if (h2) h2.textContent = sectionTitles[key];
    }
  });

  // 4. Variáveis CSS dinâmicas (:root) - sem flicker
  if (config.sidebar.width) {
    root.style.setProperty('--sidebar-width', `${config.sidebar.width}px`);
  }
  if (config.style.gridGap) {
    root.style.setProperty('--grid-gap', `${config.style.gridGap}px`);
  }
  if (config.style.radius) {
    root.style.setProperty('--radius', `${config.style.radius}px`);
  }
  if (config.style.accentColor) {
    root.style.setProperty('--accent-color', config.style.accentColor);
    root.style.setProperty('--neon-cyan', config.style.accentColor);
    root.style.setProperty('--border-cyan', hexToRgba(config.style.accentColor, 0.1));
    root.style.setProperty('--border-cyan-strong', hexToRgba(config.style.accentColor, 0.3));
    root.style.setProperty('--shadow-card', `0 8px 32px 0 ${hexToRgba(config.style.accentColor, 0.05)}`);
    root.style.setProperty('--shadow-card-hover', `0 8px 40px 0 ${hexToRgba(config.style.accentColor, 0.15)}`);
  }
}

// Converte cor hex para rgba
function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ============================================================
   INTEGRAÇÃO CMS (CATÁLOGO DE SERVIÇOS) NO PAINEL DO USUÁRIO
   Lê os módulos salvos pelo Admin (FredContas_MasterModules) e
   renderiza dinamicamente categorias e serviços no painel.
   ============================================================ */
const CMS_STORAGE_KEY = 'FredContas_MasterModules';

// Mapeia nomes de categorias do CMS para as abas existentes do painel.
// A comparação é feita por palavra-chave (case-insensitive).
const CMS_CATEGORY_TAB_MAP = [
  { keywords: ['check', 'consulta', 'verifica'], tab: 'checkers' },
  { keywords: ['facial', 'foto', 'imagem', 'reconhecimento'], tab: 'facial' },
  { keywords: ['gerador', 'gera'], tab: 'geradores' },
  { keywords: ['ferramenta', 'utilit', 'editor', 'rota', 'relatorio'], tab: 'ferramentas' },
  { keywords: ['config', 'perfil', 'preferencia', 'seguranca', 'notifica'], tab: 'configuracoes' }
];

// Ícones padrão por categoria (fallback visual)
const CMS_CATEGORY_ICONS = {
  checkers: 'fas fa-shield-halved',
  facial: 'fas fa-face-smile',
  geradores: 'fas fa-wand-magic-sparkles',
  ferramentas: 'fas fa-toolbox',
  configuracoes: 'fas fa-gear',
  dashboard: 'fas fa-layer-group'
};

// Cores alternadas para os ícones dos serviços
const CMS_ICON_COLORS = ['uber', 'nine-nine', 'consultas'];

// Normaliza um texto para comparação (remove acentos, minúsculas)
function cmsNormalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Determina a aba de destino para uma categoria do CMS
function cmsResolveTab(catNome) {
  const norm = cmsNormalize(catNome);
  for (const map of CMS_CATEGORY_TAB_MAP) {
    if (map.keywords.some(k => norm.includes(k))) {
      return map.tab;
    }
  }
  return null; // sem correspondência -> dashboard
}

// Carrega os módulos do CMS do localStorage (com fallback seguro).
// Blindado contra storage vazio ou malformado: valida o esquema e
// normaliza cada categoria/serviço para garantir integridade de render.
function cmsLoadModules() {
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.categorias)) return null;

    // Validação de esquema: garante que toda categoria tenha id, nome e
    // um array de serviços; cada serviço tenha id, nome, icone e status.
    const categorias = parsed.categorias
      .filter(cat => cat && typeof cat === 'object')
      .map((cat, ci) => ({
        id: cat.id != null ? String(cat.id) : 'cat_' + (ci + 1),
        nome: cat.nome || 'Categoria',
        icone: cat.icone || '',
        servicos: Array.isArray(cat.servicos)
          ? cat.servicos
              .filter(s => s && typeof s === 'object')
              .map((s, si) => ({
                id: s.id != null ? String(s.id) : 'srv_' + (ci + 1) + '_' + (si + 1),
                nome: s.nome || 'Serviço',
                icone: s.icone || 'fas fa-cube',
                status: s.status || 'ativo',
                descricao: s.descricao || ''
              }))
          : []
      }));

    return { categorias };
  } catch (e) {
    console.warn('[CMS] Falha ao ler módulos no painel do usuário.', e);
  }
  return null;
}

// Gera o HTML de um card de serviço
function cmsBuildServiceCard(srv, colorIndex) {
  const color = CMS_ICON_COLORS[colorIndex % CMS_ICON_COLORS.length];
  const icone = srv.icone || 'fas fa-cube';
  const nome = srv.nome || 'Serviço';
  const serviceKey = srv.id || cmsNormalize(nome).replace(/[^a-z0-9]+/g, '-');

  // Status do serviço (manutenção/inativo -> card desabilitado)
  const disabled = srv.status === 'manutencao' || srv.status === 'inativo';
  const statusTag = srv.status === 'manutencao'
    ? '<span class="service-tag manutencao">MANUTENÇÃO</span>'
    : srv.status === 'inativo'
      ? '<span class="service-tag inativo">INDISPONÍVEL</span>'
      : '<span class="service-tag">ATIVO</span>';

  return `
    <article class="service-card" data-service="${cmsEscapeAttr(serviceKey)}" ${disabled ? 'data-disabled="true"' : ''}>
      <div class="card-glow"></div>
      <div class="card-header">
        <div class="service-icon ${color}"><i class="${cmsEscapeAttr(icone)}"></i></div>
        ${statusTag}
      </div>
      <h3>${cmsEscapeHtml(nome)}</h3>
      <p>${cmsEscapeHtml(srv.descricao || 'Serviço disponível no painel Espaço Uber.')}</p>
      <button class="btn-service" data-open="${cmsEscapeAttr(serviceKey)}" ${disabled ? 'disabled' : ''}>
        ${disabled ? 'Indisponível' : 'Abrir Serviço'}
      </button>
    </article>
  `;
}

// Escapa HTML para evitar injeção
function cmsEscapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Escapa atributos HTML
function cmsEscapeAttr(str) {
  return cmsEscapeHtml(str).replace(/"/g, '&quot;');
}

// Renderiza os módulos do CMS no painel, agrupando por aba.
// O DASHBOARD (aba inicial) agrega TODAS as categorias/serviços do CMS,
// para que o usuário veja todas as opções ao clicar no Dashboard.
function renderCmsModules() {
  const modules = cmsLoadModules();
  if (!modules) return; // Sem dados do CMS -> mantém o conteúdo estático

  // Garante que cada categoria seja ÚNICA (remove duplicatas por id e por nome)
  const seenIds = new Set();
  const seenNames = new Set();
  const uniqueCategorias = modules.categorias.filter(cat => {
    const idKey = cat.id != null ? String(cat.id) : '';
    const nameKey = cmsNormalize(cat.nome || '');
    if (idKey && seenIds.has(idKey)) return false;
    if (nameKey && seenNames.has(nameKey)) return false;
    if (idKey) seenIds.add(idKey);
    if (nameKey) seenNames.add(nameKey);
    return true;
  });

  // Agrupa categorias únicas por aba de destino
  const byTab = {};
  uniqueCategorias.forEach(cat => {
    const tab = cmsResolveTab(cat.nome) || 'dashboard';
    if (!byTab[tab]) byTab[tab] = [];
    byTab[tab].push(cat);
  });

  // Para cada aba específica (exceto dashboard), substitui a grid estática
  // por seções dinâmicas com as suas categorias.
  Object.keys(byTab).forEach(tab => {
    if (tab === 'dashboard') return; // o dashboard é tratado separadamente
    const section = document.getElementById(`tab-${tab}`);
    if (!section) return;

    const cats = byTab[tab];
    const grid = section.querySelector('.services-grid');
    if (!grid) return;

    let html = '';
    cats.forEach((cat, ci) => {
      const servicos = (cat.servicos || []).filter(s => s.status !== 'inativo');
      if (servicos.length === 0) return;

      const icon = CMS_CATEGORY_ICONS[tab] || 'fas fa-cube';
      const catTitle = cats.length > 1
        ? `<div class="section-title cms-cat-title">
             <h2><i class="${icon}"></i> ${cmsEscapeHtml(cat.nome)}</h2>
           </div>`
        : '';

      html += `
        ${catTitle}
        <div class="services-grid cms-grid">
          ${servicos.map((srv, si) => cmsBuildServiceCard(srv, ci + si)).join('')}
        </div>
      `;
    });

    if (cats.length > 1) {
      const staticTitle = section.querySelector('.section-title');
      if (staticTitle && !staticTitle.classList.contains('cms-cat-title')) {
        staticTitle.remove();
      }
    }

    grid.outerHTML = html;
  });

  // DASHBOARD: agrega TODAS as categorias únicas do CMS para mostrar todas as opções.
  const dashSection = document.getElementById('tab-dashboard');
  if (dashSection) {
    const dashGrid = dashSection.querySelector('.services-grid');
    if (dashGrid) {
      let dashHtml = '';
      uniqueCategorias.forEach((cat, ci) => {
        const servicos = (cat.servicos || []).filter(s => s.status !== 'inativo');
        if (servicos.length === 0) return;

        const tab = cmsResolveTab(cat.nome) || 'dashboard';
        const icon = CMS_CATEGORY_ICONS[tab] || 'fas fa-cube';
        dashHtml += `
          <div class="section-title cms-cat-title">
            <h2><i class="${icon}"></i> ${cmsEscapeHtml(cat.nome)}</h2>
          </div>
          <div class="services-grid cms-grid">
            ${servicos.map((srv, si) => cmsBuildServiceCard(srv, ci + si)).join('')}
          </div>
        `;
      });

      // Remove o título estático "Serviços Disponíveis" para evitar duplicação
      const staticTitle = dashSection.querySelector('.section-title');
      if (staticTitle && !staticTitle.classList.contains('cms-cat-title')) {
        staticTitle.remove();
      }

      if (dashHtml) {
        // Substitui o grid estático pelo conteúdo dinâmico (todas as categorias)
        dashGrid.outerHTML = dashHtml;
      } else {
        // Sem categorias com serviços ativos -> limpa o grid para não exibir conteúdo antigo
        dashGrid.innerHTML = '';
      }
    }
  }

  // Re-vincula os listeners dos novos botões de serviço
  bindCmsServiceButtons();
}

// Vincula os listeners de clique nos botões/cards renderizados pelo CMS
function bindCmsServiceButtons() {
  document.querySelectorAll('.btn-service[data-open]').forEach(btn => {
    // Evita duplicar listeners
    if (btn.dataset.cmsBound) return;
    btn.dataset.cmsBound = 'true';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleServiceOpen(btn.dataset.open);
    });
  });

  document.querySelectorAll('.service-card[data-service]').forEach(card => {
    if (card.dataset.cmsBound) return;
    card.dataset.cmsBound = 'true';
    card.addEventListener('click', () => {
      const btn = card.querySelector('.btn-service[data-open]');
      if (btn && !btn.disabled) {
        handleServiceOpen(btn.dataset.open);
      }
    });
  });
}

// Roteia a abertura de um serviço: serviços avançados (ex.: "Venda de Bicos")
// abrem a viewport interna de ferramentas; os demais mantêm o modal padrão.
function handleServiceOpen(serviceKey) {
  if (isToolViewportService(serviceKey)) {
    openToolViewport(serviceKey);
    return;
  }
  openLoadingModal(serviceKey);
  setTimeout(() => {
    showToast('Sucesso', 'Módulo carregado com sucesso!');
  }, CONFIG.modalDuration + 400);
}

// Identifica serviços que devem abrir a viewport interna de ferramentas.
// Reconhece por nome normalizado (ex.: "venda-de-bicos") ou por chave.
const TOOL_VIEWPORT_SERVICES = ['venda-de-bicos', 'venda-de-bicos-ia', 'bicos'];
const TOOL_CONSULTA_PLACA = ['consulta-placa', 'consulta-de-placa', 'consulta-placas', 'placa'];
const TOOL_GERADOR_VEICULOS = ['gerador-de-veiculos', 'gerador-veiculos', 'gerador', 'gerar-crlv-uber', 'gerar-crlv-99', 'crlv-uber', 'crlv-99', 'gerar-crlv'];
const TOOL_GERADOR_CHASSI = ['gerador-de-chassi', 'gerador-chassi', 'chassi'];
// Serviços de consulta via proxy LosDados (CPF, CNH, Telefone, Placa).
const TOOL_CONSULTA_LOSDADOS = ['consulta-cpf', 'consulta-cnh', 'consulta-telefone', 'consulta-placa-losdados'];
function isToolViewportService(serviceKey) {
  const key = String(serviceKey || '').toLowerCase();
  if (TOOL_VIEWPORT_SERVICES.includes(key)) return true;
  // Também reconhece pelo nome normalizado (ex.: "Venda de Bicos")
  const normalized = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (TOOL_VIEWPORT_SERVICES.includes(normalized)) return true;
  // Reconhece por id alternativo (ex.: "venda_bicos")
  if (key === 'venda_bicos' || key === 'venda-bicos') return true;
  // Reconhece "Consulta Placa", "Gerador de Veículos", "Gerar CRLV Uber/99"
  // e "Gerador de Chassi" por chave normalizada
  if (TOOL_CONSULTA_PLACA.includes(normalized)) return true;
  if (TOOL_GERADOR_VEICULOS.includes(normalized)) return true;
  if (TOOL_GERADOR_CHASSI.includes(normalized)) return true;
  // Serviços de consulta LosDados (CPF, CNH, Telefone, Placa)
  if (TOOL_CONSULTA_LOSDADOS.includes(normalized)) return true;
  // Reconhece pelo NOME do serviço (ex.: "Bicos", "Venda de Bicos",
  // "Gerador de Veículos", "Consulta Placa", "Gerador de Chassi"), mesmo
  // quando o id do CMS é genérico (ex.: "srv_1"). Busca o serviço pelo
  // id/chave nos módulos carregados e verifica se o nome contém "bico",
  // "veiculo", "placa" ou "chassi".
  const srv = cmsFindServiceByKey(serviceKey);
  if (srv) {
    const nomeNorm = cmsNormalize(srv.nome);
    if (nomeNorm.includes('bico')) return true;
    if (nomeNorm.includes('veiculo')) return true;
    if (nomeNorm.includes('crlv')) return true;
    if (nomeNorm.includes('placa')) return true;
    if (nomeNorm.includes('chassi')) return true;
    // Consultas LosDados por nome (CPF, CNH, Telefone)
    if (nomeNorm.includes('cpf')) return true;
    if (nomeNorm.includes('cnh')) return true;
    if (nomeNorm.includes('telefone')) return true;
  }
  return false;
}

// Localiza um serviço nos módulos do CMS pelo id/chave (data-open).
function cmsFindServiceByKey(serviceKey) {
  const modules = cmsLoadModules();
  if (!modules || !Array.isArray(modules.categorias)) return null;
  const key = String(serviceKey || '');
  for (const cat of modules.categorias) {
    const found = (cat.servicos || []).find(s => String(s.id) === key);
    if (found) return found;
  }
  return null;
}

/* ============================================================
   VIEWPORT INTERNA DE FERRAMENTAS (ex.: "Venda de Bicos")
   Renderização dinâmica no container principal, sem reload.
   Mantém a sidebar intacta e restaura o painel ao navegar.
   ============================================================ */

let toolViewportActive = false;
let toolViewportTab = 'bicos';
// Chave do serviço LosDados atualmente aberto na viewport (ex.: 'consulta-cpf').
// Usada para determinar o tipo de consulta (cpf/cnh/telefone/placa) ao executar.
let toolViewportLosDadosKey = 'consulta-cpf';

// Identifica o tipo de ferramenta a partir da chave/nome do serviço.
// Retorna 'bicos', 'consulta-placa', 'gerador-chassi' ou 'consulta-losdados'.
function detectToolType(serviceKey) {
  const key = String(serviceKey || '').toLowerCase();
  const normalized = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (TOOL_GERADOR_VEICULOS.includes(normalized)) return 'gerador-veiculos';
  if (TOOL_CONSULTA_PLACA.includes(normalized)) return 'consulta-placa';
  if (TOOL_GERADOR_CHASSI.includes(normalized)) return 'gerador-chassi';
  if (TOOL_CONSULTA_LOSDADOS.includes(normalized)) return 'consulta-losdados';
  // Verifica também pelo nome do serviço (id genérico do CMS)
  const srv = cmsFindServiceByKey(serviceKey);
  if (srv) {
    const nomeNorm = cmsNormalize(srv.nome);
    // "Gerador de Veículos", "Gerar CRLV Uber/99" -> Gerador de Veículos
    if (nomeNorm.includes('veiculo')) return 'gerador-veiculos';
    if (nomeNorm.includes('crlv')) return 'gerador-veiculos';
    if (nomeNorm.includes('placa')) return 'consulta-placa';
    if (nomeNorm.includes('chassi')) return 'gerador-chassi';
    // Consultas LosDados por nome (CPF, CNH, Telefone)
    if (nomeNorm.includes('cpf')) return 'consulta-losdados';
    if (nomeNorm.includes('cnh')) return 'consulta-losdados';
    if (nomeNorm.includes('telefone')) return 'consulta-losdados';
  }
  return 'bicos';
}

// Abre a viewport interna de ferramentas no container principal.
// Usa uma seção dedicada (#tab-tool) injetada ao lado das demais,
// preservando a estrutura do DOM (SPA) e permitindo restaurar o painel.
function openToolViewport(serviceKey) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  toolViewportActive = true;
  const toolType = detectToolType(serviceKey);
  toolViewportTab = toolType;

  // Cria (ou reutiliza) a seção dedicada da viewport dentro do main
  let toolSection = document.getElementById('tab-tool');
  if (!toolSection) {
    toolSection = document.createElement('section');
    toolSection.className = 'tab-section';
    toolSection.id = 'tab-tool';
    main.appendChild(toolSection);
  }
  // Renderiza o template específico conforme o tipo de ferramenta
  if (toolType === 'gerador-veiculos') {
    toolSection.innerHTML = buildGeradorVeiculosTemplate(serviceKey);
  } else if (toolType === 'consulta-placa') {
    toolSection.innerHTML = buildConsultaPlacaTemplate(serviceKey);
  } else if (toolType === 'gerador-chassi') {
    toolSection.innerHTML = buildGeradorChassiTemplate(serviceKey);
  } else if (toolType === 'consulta-losdados') {
    // Guarda a chave específica do serviço LosDados (cpf/cnh/telefone/placa)
    // para que a execução da consulta saiba qual endpoint usar.
    toolViewportLosDadosKey = String(serviceKey || 'consulta-cpf');
    toolSection.innerHTML = buildConsultaLosDadosTemplate(serviceKey);
  } else {
    toolSection.innerHTML = buildToolViewportTemplate(serviceKey);
  }

  // Oculta as seções de aba padrão e mostra a viewport
  dom.tabSections.forEach(section => {
    section.classList.remove('active');
  });
  toolSection.classList.add('active');
  main.scrollTop = 0;

  bindToolViewportEvents();
}

// Fecha a viewport interna e restaura o painel padrão.
function closeToolViewport() {
  if (!toolViewportActive) return;
  toolViewportActive = false;

  const main = document.getElementById('mainContent');
  if (!main) return;

  // Oculta a seção da viewport
  const toolSection = document.getElementById('tab-tool');
  if (toolSection) {
    toolSection.classList.remove('active');
  }

  // Restaura a aba padrão (dashboard ou categoria ativa)
  if (activeCmsCategory) {
    renderCategoryTab(activeCmsCategory);
  } else {
    dom.tabSections.forEach(section => {
      section.classList.toggle('active', section.id === `tab-${currentTab}`);
    });
  }
  main.scrollTop = 0;
}

// Gera o HTML completo da viewport interna de ferramentas.
function buildToolViewportTemplate(serviceKey) {
  const nome = (serviceKey || 'Venda de Bicos')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return `
    <section class="tool-viewport" id="toolViewport">
      <header class="tool-viewport-header">
        <button class="tool-back-btn" id="toolBackBtn" title="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Voltar
        </button>
        <div class="tool-viewport-title">
          <h1><i class="fas fa-fire"></i> ${cmsEscapeHtml(nome)}</h1>
          <p>Motor de correspondência avançado · Amaterasu / Black Flames</p>
        </div>
        <span class="tool-status-badge"><i class="fas fa-bolt"></i> ONLINE</span>
      </header>

      <!-- Abas internas -->
      <nav class="tool-tabs" id="toolTabs">
        <button class="tool-tab active" data-tooltab="buscas"><i class="fas fa-search"></i> Buscas</button>
        <button class="tool-tab" data-tooltab="historico"><i class="fas fa-history"></i> Meu Histórico</button>
        <button class="tool-tab" data-tooltab="extrato"><i class="fas fa-file-invoice-dollar"></i> Extrato</button>
      </nav>

      <!-- Painel: Buscas -->
      <div class="tool-panel active" id="toolPanel-buscas">
        <div class="tool-grid">
          <!-- Coluna esquerda: upload de foto -->
          <div class="tool-card">
            <div class="tool-card-title">
              <i class="fas fa-camera"></i>
              <h3>Foto do Cliente</h3>
            </div>
            <p class="tool-card-desc">Envie uma foto (JPG/PNG) para iniciar a busca de correspondências.</p>
            <div class="upload-zone" id="uploadZone">
              <input type="file" id="photoInput" accept="image/jpeg,image/png" hidden />
              <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
              <p class="upload-text">Clique ou arraste a foto do cliente</p>
              <p class="upload-hint">Formatos aceitos: JPG, PNG · Máx. 10MB</p>
              <div class="upload-preview" id="uploadPreview" hidden>
                <img id="uploadPreviewImg" alt="Prévia da foto" />
                <button class="upload-remove" id="uploadRemove" title="Remover foto"><i class="fas fa-times"></i></button>
              </div>
            </div>
          </div>

          <!-- Coluna direita: filtros avançados -->
          <div class="tool-card">
            <div class="tool-card-title">
              <i class="fas fa-sliders-h"></i>
              <h3>Filtros Avançados</h3>
            </div>

            <div class="filter-group">
              <label class="filter-label">Veículo</label>
              <div class="filter-chips" data-filter="veiculo">
                <button class="filter-chip" data-value="carro"><i class="fas fa-car"></i> Carro</button>
                <button class="filter-chip" data-value="moto"><i class="fas fa-motorcycle"></i> Moto</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">Gênero da Conta</label>
              <div class="filter-chips" data-filter="genero">
                <button class="filter-chip" data-value="masculino"><i class="fas fa-mars"></i> Masculino</button>
                <button class="filter-chip" data-value="feminino"><i class="fas fa-venus"></i> Feminino</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">Plataforma</label>
              <div class="filter-chips" data-filter="plataforma">
                <button class="filter-chip" data-value="uber"><i class="fas fa-taxi"></i> Uber</button>
                <button class="filter-chip" data-value="99pop"><i class="fas fa-car-side"></i> 99pop</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">Faixa de Similaridade / Filtro de IA</label>
              <div class="filter-chips" data-filter="similaridade">
                <button class="filter-chip" data-value="mais-afim"><i class="fas fa-bolt"></i> Mais afim</button>
                <button class="filter-chip" data-value="60-70">60-70%</button>
                <button class="filter-chip" data-value="50-60">50-60%</button>
                <button class="filter-chip" data-value="40-50">40-50%</button>
                <button class="filter-chip" data-value="30-40">30-40%</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">Faixa Etária</label>
              <div class="filter-chips" data-filter="idade">
                <button class="filter-chip" data-value="qualquer">Qualquer</button>
                <button class="filter-chip" data-value="21-30">21-30</button>
                <button class="filter-chip" data-value="31-40">31-40</button>
                <button class="filter-chip" data-value="41-50">41-50</button>
                <button class="filter-chip" data-value="51-60">51-60</button>
                <button class="filter-chip" data-value="61+">61+</button>
              </div>
            </div>

            <!-- Checkbox: buscar por primeiro nome -->
            <div class="filter-group">
              <label class="name-checkbox">
                <input type="checkbox" id="searchByNameCheck" />
                <span class="checkbox-box"><i class="fas fa-check"></i></span>
                <span class="checkbox-text">Buscar por primeiro nome <em>(+R$ 10)</em></span>
              </label>
              <div class="name-input-wrap" id="nameInputWrap" hidden>
                <i class="fas fa-user"></i>
                <input type="text" id="searchName" placeholder="Digite o primeiro nome do cliente..." />
              </div>
            </div>
          </div>
        </div>

        <!-- Botão de ação principal + display de preço -->
        <div class="tool-action-area">
          <button class="tool-action-btn" id="btnBuscar">
            <i class="fas fa-crosshairs"></i> BUSCAR CORRESPONDÊNCIAS
          </button>
          <span class="tool-action-price">Valor: R$ 10,00</span>
        </div>

        <!-- Resultados -->
        <div class="tool-results" id="toolResults">
          <div class="tool-results-empty">
            <i class="fas fa-user-secret"></i>
            <p>Nenhuma busca realizada ainda. Envie uma foto e configure os filtros para começar.</p>
          </div>
        </div>
      </div>

      <!-- Painel: Meu Histórico -->
      <div class="tool-panel" id="toolPanel-historico">
        <div class="tool-card">
          <div class="tool-card-title">
            <i class="fas fa-history"></i>
            <h3>Histórico de Buscas</h3>
          </div>
          <div class="tool-history-list" id="toolHistoryList">
            <div class="tool-results-empty">
              <i class="fas fa-inbox"></i>
              <p>Nenhuma busca registrada ainda.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Painel: Extrato -->
      <div class="tool-panel" id="toolPanel-extrato">
        <div class="tool-card">
          <div class="tool-card-title">
            <i class="fas fa-file-invoice-dollar"></i>
            <h3>Extrato de Vendas</h3>
          </div>
          <div class="tool-extrato-summary">
            <div class="extrato-stat">
              <span class="extrato-label">Total de Vendas</span>
              <span class="extrato-value cyan">R$ 0,00</span>
            </div>
            <div class="extrato-stat">
              <span class="extrato-label">Comissões</span>
              <span class="extrato-value pink">R$ 0,00</span>
            </div>
            <div class="extrato-stat">
              <span class="extrato-label">Saldo Disponível</span>
              <span class="extrato-value green">R$ 0,00</span>
            </div>
          </div>
          <div class="tool-results-empty">
            <i class="fas fa-receipt"></i>
            <p>Nenhuma transação registrada no período.</p>
          </div>
        </div>
      </div>

      <!-- Overlay de scanner facial (loading) -->
      <div class="tool-scan-overlay" id="toolScanOverlay" hidden>
        <div class="tool-scan-card">
          <div class="tool-scan-ring">
            <i class="fas fa-user"></i>
            <div class="tool-scan-line"></div>
          </div>
          <h3>Scanner Facial</h3>
          <p id="toolScanMessage">Comparando com a base facial...</p>
          <div class="tool-scan-progress">
            <div class="tool-scan-bar" id="toolScanBar"></div>
          </div>
          <span class="tool-scan-percent" id="toolScanPercent">0%</span>
        </div>
      </div>
    </section>
  `;
}

// Vincula os eventos da viewport interna de ferramentas.
function bindToolViewportEvents() {
  // Botão Voltar
  const backBtn = document.getElementById('toolBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', closeToolViewport);
  }

  // Abas internas
  document.querySelectorAll('#toolTabs .tool-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      toolViewportTab = tab.dataset.tooltab;
      document.querySelectorAll('#toolTabs .tool-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`toolPanel-${toolViewportTab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // Chips de filtro (seleção única por grupo)
  document.querySelectorAll('.filter-chips').forEach(group => {
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Checkbox "Buscar por primeiro nome" -> libera o input de texto
  const nameCheck = document.getElementById('searchByNameCheck');
  const nameInputWrap = document.getElementById('nameInputWrap');
  if (nameCheck && nameInputWrap) {
    nameCheck.addEventListener('change', () => {
      nameInputWrap.hidden = !nameCheck.checked;
    });
  }

  // Upload de foto: clique na zona
  const uploadZone = document.getElementById('uploadZone');
  const photoInput = document.getElementById('photoInput');
  if (uploadZone && photoInput) {
    uploadZone.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handlePhotoFile(e.target.files[0]);
      }
    });

    // Drag & drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handlePhotoFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Remover foto
  const uploadRemove = document.getElementById('uploadRemove');
  if (uploadRemove) {
    uploadRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      clearPhotoPreview();
    });
  }

  // Botão principal de busca
  const btnBuscar = document.getElementById('btnBuscar');
  if (btnBuscar) {
    btnBuscar.addEventListener('click', runToolSearch);
  }

  // Busca por Enter (apenas se o checkbox de nome estiver marcado)
  const searchName = document.getElementById('searchName');
  if (searchName) {
    searchName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runToolSearch();
    });
  }

  // --- Consulta Placa ---
  const btnConsultar = document.getElementById('btnConsultarPlaca');
  if (btnConsultar) {
    btnConsultar.addEventListener('click', executarConsultaPlaca);
  }
  const consultaInput = document.getElementById('consultaPlacaInput');
  if (consultaInput) {
    consultaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executarConsultaPlaca();
    });
  }

  // --- Consulta LosDados (CPF, CNH, Telefone, Placa) ---
  const btnLosDados = document.getElementById('btnConsultarLosDados');
  if (btnLosDados) {
    btnLosDados.addEventListener('click', executarConsultaLosDados);
  }
  const losDadosInput = document.getElementById('losdadosConsultaInput');
  if (losDadosInput) {
    losDadosInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executarConsultaLosDados();
    });
  }

  // --- Gerador de Chassi ---
  const btnGerarChassi = document.getElementById('btnGerarChassi');
  if (btnGerarChassi) {
    btnGerarChassi.addEventListener('click', gerarImagensChassi);
  }
  const chassiInput = document.getElementById('chassiVinInput');
  if (chassiInput) {
    chassiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') gerarImagensChassi();
    });
  }

  // Se for a tela de Consulta Placa, inicializa (auto-preenche placa pendente)
  if (toolViewportTab === 'consulta-placa') {
    initConsultaPlaca();
  }

  // Se for a tela de Gerador de Veículos, vincula os eventos de geração
  if (toolViewportTab === 'gerador-veiculos') {
    bindGeradorVeiculosEvents();
  }
}

// Valida e exibe a prévia da foto enviada (JPG/PNG).
function handlePhotoFile(file) {
  const validTypes = ['image/jpeg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    showToast('Formato inválido', 'Envie apenas imagens JPG ou PNG.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Arquivo grande', 'A imagem deve ter no máximo 10MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('uploadPreview');
    const img = document.getElementById('uploadPreviewImg');
    const zone = document.getElementById('uploadZone');
    if (preview && img && zone) {
      img.src = e.target.result;
      preview.hidden = false;
      zone.classList.add('has-photo');
    }
  };
  reader.readAsDataURL(file);
}

// Remove a prévia da foto.
function clearPhotoPreview() {
  const preview = document.getElementById('uploadPreview');
  const img = document.getElementById('uploadPreviewImg');
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('photoInput');
  if (preview) preview.hidden = true;
  if (img) img.src = '';
  if (zone) zone.classList.remove('has-photo');
  if (input) input.value = '';
}

// Chave de armazenamento da base facial de bicos (sincronizada com o admin)
const BICOS_STORAGE_KEY = 'FredContas_MasterBicos';

// Carrega a base facial de bicos do localStorage (com fallback de exemplo).
function bicosLoad() {
  try {
    const raw = localStorage.getItem(BICOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[Bicos] Falha ao ler base facial.', e);
  }
  // Base de exemplo (Amaterasu / Black Flames) caso não haja dados cadastrados
  return [
    { nome: 'Carlos', idade: 29, veiculo: 'Carro', plataforma: 'Uber', genero: 'masculino', similaridade: 77.1, foto: '' },
    { nome: 'Mariana', idade: 24, veiculo: 'Moto', plataforma: '99pop', genero: 'feminino', similaridade: 75.4, foto: '' },
    { nome: 'Rafael', idade: 34, veiculo: 'Carro', plataforma: 'Uber', genero: 'masculino', similaridade: 68.2, foto: '' },
    { nome: 'Juliana', idade: 42, veiculo: 'Carro', plataforma: '99pop', genero: 'feminino', similaridade: 63.9, foto: '' },
    { nome: 'Pedro', idade: 55, veiculo: 'Moto', plataforma: 'Uber', genero: 'masculino', similaridade: 58.7, foto: '' },
    { nome: 'Ana', idade: 27, veiculo: 'Carro', plataforma: 'Uber', genero: 'feminino', similaridade: 52.3, foto: '' }
  ];
}

// Executa a busca de correspondências com simulação de scanner facial.
function runToolSearch() {
  const resultsEl = document.getElementById('toolResults');
  if (!resultsEl) return;

  // Coleta os filtros ativos
  const filters = {};
  document.querySelectorAll('.filter-chips').forEach(group => {
    const active = group.querySelector('.filter-chip.active');
    if (active) filters[group.dataset.filter] = active.dataset.value;
  });

  const hasPhoto = !(document.getElementById('uploadPreview') || {}).hidden;
  if (!hasPhoto) {
    showToast('Foto necessária', 'Envie uma foto do cliente para buscar correspondências.');
    return;
  }

  // Nome (apenas se o checkbox estiver marcado)
  const nameCheck = document.getElementById('searchByNameCheck');
  const name = (nameCheck && nameCheck.checked)
    ? ((document.getElementById('searchName') || {}).value || '').trim()
    : '';

  // Exibe o overlay de scanner facial e simula o carregamento por 2 segundos
  const overlay = document.getElementById('toolScanOverlay');
  const scanBar = document.getElementById('toolScanBar');
  const scanPercent = document.getElementById('toolScanPercent');
  const scanMessage = document.getElementById('toolScanMessage');
  if (overlay) overlay.hidden = false;

  const scanMessages = [
    'Comparando com a base facial...',
    'Verificando contas ao vivo...'
  ];
  let progress = 0;
  let msgIndex = 0;
  if (scanMessage) scanMessage.textContent = scanMessages[0];

  const scanTimer = setInterval(() => {
    progress += 5;
    if (scanBar) scanBar.style.width = `${progress}%`;
    if (scanPercent) scanPercent.textContent = `${progress}%`;
    if (progress >= 50 && msgIndex === 0) {
      msgIndex = 1;
      if (scanMessage) scanMessage.textContent = scanMessages[1];
    }
    if (progress >= 100) {
      clearInterval(scanTimer);
      if (overlay) overlay.hidden = true;
      renderBicosResults(filters, name);
    }
  }, 100); // 20 passos * 100ms = 2s
}

// Renderiza a grade de resultados da busca de bicos.
function renderBicosResults(filters, name) {
  const resultsEl = document.getElementById('toolResults');
  if (!resultsEl) return;

  const base = bicosLoad();

  // Aplica os filtros
  const filtered = base.filter(r => {
    if (name && !r.nome.toLowerCase().includes(name.toLowerCase())) return false;
    if (filters.veiculo && r.veiculo && r.veiculo.toLowerCase() !== filters.veiculo) return false;
    if (filters.genero && r.genero && r.genero !== filters.genero) return false;
    if (filters.plataforma && r.plataforma && r.plataforma.toLowerCase() !== filters.plataforma) return false;

    // Faixa de similaridade / filtro de IA
    if (filters.similaridade && filters.similaridade !== 'mais-afim') {
      const [min, max] = filters.similaridade.split('-').map(Number);
      if (max) {
        if (r.similaridade < min || r.similaridade > max) return false;
      } else {
        if (r.similaridade < min) return false;
      }
    }

    // Faixa etária
    if (filters.idade && filters.idade !== 'qualquer') {
      const [min, max] = filters.idade.replace('+', '').split('-').map(Number);
      if (max) {
        if (r.idade < min || r.idade > max) return false;
      } else {
        if (r.idade < min) return false;
      }
    }
    return true;
  });

  // Ordena por similaridade (mais afim primeiro)
  filtered.sort((a, b) => b.similaridade - a.similaridade);

  if (filtered.length === 0) {
    resultsEl.innerHTML = `
      <div class="tool-results-empty">
        <i class="fas fa-search-minus"></i>
        <p>Nenhuma correspondência encontrada com os filtros atuais.</p>
      </div>`;
    return;
  }

  resultsEl.innerHTML = `
    <div class="tool-results-header">
      <span><i class="fas fa-crosshairs"></i> ${filtered.length} correspondência(s) encontrada(s)</span>
      <span class="tool-confidence-tag">Base: ${base.length} contas</span>
    </div>
    <div class="tool-results-grid">
      ${filtered.map(r => `
        <div class="tool-result-card">
          <div class="tool-result-avatar ${r.similaridade >= 70 ? 'green' : r.similaridade >= 55 ? 'cyan' : 'pink'}">
            ${r.foto ? `<img src="${cmsEscapeAttr(r.foto)}" alt="${cmsEscapeAttr(r.nome)}" />` : '<i class="fas fa-user"></i>'}
          </div>
          <div class="tool-result-info">
            <h4>${cmsEscapeHtml(r.nome)}</h4>
            <p><i class="fas fa-calendar-alt"></i> ${r.idade} anos</p>
            <p><i class="fas fa-car"></i> ${cmsEscapeHtml(r.veiculo || '—')} · ${cmsEscapeHtml(r.plataforma || '—')}</p>
          </div>
          <div class="tool-result-confidence">
            <span class="similarity-badge">${r.similaridade.toFixed(1)}%</span>
            <span class="confidence-label">Similaridade</span>
          </div>
        </div>
      `).join('')}
    </div>`;

  showToast('Busca concluída', `${filtered.length} correspondência(s) encontrada(s).`);
}

/* ============================================================
   FERRAMENTA: GERADOR DE VEÍCULOS
   Gera veículos fictícios (marca, modelo, placa, ano, cor,
   renavam, chassi) a partir de uma base de marcas/modelos
   embutida no código. A partir de cada veículo gerado é
   possível gerar o CRLV (Uber ou 99) sobre o template.
   ============================================================ */

// ===== BASE DE MARCAS E MODELOS DE VEÍCULOS (BRASIL) =====
// Todas as marcas/modelos disponíveis para geração aleatória.
const VEICULOS_MARCAS = [
  { marca: 'Fiat', modelos: ['Uno', 'Mobi', 'Argo', 'Cronos', 'Strada', 'Toro', 'Pulse', 'Fastback', 'Palio', 'Siena', 'Doblo', 'Fiorino'] },
  { marca: 'Volkswagen', modelos: ['Gol', 'Voyage', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Taos', 'Saveiro', 'Amarok', 'Jetta', 'Golf', 'Tiguan'] },
  { marca: 'Chevrolet', modelos: ['Onix', 'Onix Plus', 'Prisma', 'Cruze', 'Tracker', 'Equinox', 'S10', 'Montana', 'Spin', 'Cobalt', 'Celta', 'Corsa'] },
  { marca: 'Toyota', modelos: ['Corolla', 'Corolla Cross', 'Camry', 'Hilux', 'SW4', 'Yaris', 'Etios', 'RAV4', 'Prius'] },
  { marca: 'Honda', modelos: ['Civic', 'City', 'Fit', 'HR-V', 'CR-V', 'WR-V', 'Accord', 'Pilot'] },
  { marca: 'Hyundai', modelos: ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe', 'Elantra', 'Azera', 'HR'] },
  { marca: 'Renault', modelos: ['Kwid', 'Sandero', 'Logan', 'Duster', 'Captur', 'Oroch', 'Master', 'Clio', 'Megane'] },
  { marca: 'Nissan', modelos: ['Kicks', 'Versa', 'Sentra', 'Frontier', 'March', 'Leaf', 'Altima'] },
  { marca: 'Ford', modelos: ['Ka', 'Fiesta', 'Focus', 'EcoSport', 'Ranger', 'Territory', 'Mustang', 'Fusion'] },
  { marca: 'Jeep', modelos: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Grand Cherokee'] },
  { marca: 'Peugeot', modelos: ['208', '2008', '3008', '5008', 'Partner', 'Boxer'] },
  { marca: 'Citroën', modelos: ['C3', 'C4 Cactus', 'Aircross', 'C4 Lounge', 'Jumpy'] },
  { marca: 'Kia', modelos: ['Sportage', 'Seltos', 'Cerato', 'Picanto', 'Stonic', 'Mohave'] },
  { marca: 'Mitsubishi', modelos: ['L200 Triton', 'ASX', 'Outlander', 'Pajero', 'Lancer'] },
  { marca: 'BMW', modelos: ['320i', 'X1', 'X3', 'X5', 'M3', 'i3', 'X6'] },
  { marca: 'Mercedes-Benz', modelos: ['C180', 'C200', 'GLA', 'GLC', 'GLE', 'A200', 'CLA'] },
  { marca: 'Audi', modelos: ['A3', 'A4', 'A5', 'Q3', 'Q5', 'Q7', 'RS3'] },
  { marca: 'Chery', modelos: ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6', 'QQ'] },
  { marca: 'Caoa Chery', modelos: ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5'] },
  { marca: 'BYD', modelos: ['Dolphin', 'Song Plus', 'Han', 'Tan', 'Yuan Plus', 'Seal'] },
  { marca: 'GWM', modelos: ['Haval H6', 'Ora 03', 'Tank 300'] },
  { marca: 'Volvo', modelos: ['XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60'] },
  { marca: 'Land Rover', modelos: ['Evoque', 'Discovery', 'Range Rover', 'Defender'] },
  { marca: 'Porsche', modelos: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'] },
  { marca: 'Suzuki', modelos: ['Jimny', 'Swift', 'Vitara', 'S-Cross'] },
  { marca: 'Subaru', modelos: ['Impreza', 'XV', 'Forester', 'Outback'] },
  { marca: 'Ram', modelos: ['Rampage', '1500', '2500'] },
  { marca: 'Mini', modelos: ['Cooper', 'Countryman', 'Clubman'] },
  { marca: 'Jac', modelos: ['T40', 'T50', 'J4', 'J5', 'E-JS1'] },
  { marca: 'Haval', modelos: ['H6', 'H6 GT', 'Jolion'] }
];

// Cores possíveis para os veículos gerados.
const VEICULOS_CORES = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Marrom', 'Bege', 'Laranja', 'Dourado', 'BRANCA', 'PRETA', 'PRATA', 'CINZA', 'VERMELHA', 'AZUL', 'VERDE', 'AMARELA', 'BEGE'];

// Combustíveis possíveis.
const VEICULOS_COMBUSTIVEIS = ['Gasolina', 'Álcool', 'Flex', 'Diesel', 'Híbrido', 'Elétrico'];

// UFs brasileiras.
const VEICULOS_UFS = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO', 'DF', 'AM', 'PA', 'ES', 'MT', 'MS', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA', 'RO', 'AC', 'RR', 'AP', 'TO'];

// Cidades por UF (amostra).
const VEICULOS_CIDADES = {
  SP: ['São Paulo', 'Campinas', 'Santos', 'Guarulhos', 'Sorocaba', 'Ribeirão Preto'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Petrópolis', 'Duque de Caxias', 'Campos dos Goytacazes'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Contagem', 'Betim'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'Chapecó', 'Criciúma'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'],
  PE: ['Recife', 'Olinda', 'Caruaru', 'Petrolina'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Sobral'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'],
  DF: ['Brasília', 'Taguatinga', 'Ceilândia', 'Planaltina'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara'],
  PA: ['Belém', 'Ananindeua', 'Santarém'],
  ES: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas'],
  RN: ['Natal', 'Mossoró', 'Parnamirim'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita'],
  AL: ['Maceió', 'Arapiraca', 'Rio Largo'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro'],
  PI: ['Teresina', 'Parnaíba'],
  MA: ['São Luís', 'Imperatriz', 'Caxias'],
  RO: ['Porto Velho', 'Ji-Paraná'],
  AC: ['Rio Branco'],
  RR: ['Boa Vista'],
  AP: ['Macapá'],
  TO: ['Palmas', 'Araguaína']
};

// Nomes de proprietários fictícios.
const VEICULOS_PROPRIETARIOS = [
  'João da Silva', 'Maria Oliveira', 'Carlos Pereira', 'Ana Souza', 'Pedro Santos',
  'Fernanda Costa', 'Lucas Almeida', 'Juliana Rodrigues', 'Rafael Gomes', 'Camila Martins',
  'Bruno Ferreira', 'Larissa Barbosa', 'Marcos Rocha', 'Patrícia Lima', 'Diego Carvalho',
  'Aline Ribeiro', 'Thiago Mendes', 'Vanessa Cardoso', 'Rodrigo Teixeira', 'Beatriz Nunes'
];

// Gera um número de placa Mercosul aleatório (formato ABC1D23).
function gerarPlacaAleatoria() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  let placa = '';
  for (let i = 0; i < 3; i++) placa += letras[Math.floor(Math.random() * letras.length)];
  placa += numeros[Math.floor(Math.random() * numeros.length)];
  placa += letras[Math.floor(Math.random() * letras.length)];
  placa += numeros[Math.floor(Math.random() * numeros.length)];
  placa += numeros[Math.floor(Math.random() * numeros.length)];
  return placa;
}

// Gera um número de chassi (VIN) aleatório de 17 caracteres.
function gerarChassiAleatorio() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let chassi = '';
  for (let i = 0; i < 17; i++) chassi += chars[Math.floor(Math.random() * chars.length)];
  return chassi;
}

// Gera um número de Renavam aleatório (11 dígitos).
function gerarRenavamAleatorio() {
  let renavam = '';
  for (let i = 0; i < 11; i++) renavam += Math.floor(Math.random() * 10);
  return renavam;
}

// Gera um CPF válido fictício.
function gerarCpfAleatorio() {
  const n = () => Math.floor(Math.random() * 9);
  const cpf = [n(), n(), n(), n(), n(), n(), n(), n(), n()];
  const calc = (arr) => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i] * (arr.length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  cpf.push(calc(cpf));
  cpf.push(calc(cpf));
  return cpf.join('');
}

// Retorna a lista de veículos reais (base puxada da LosDados).
// Carregada via veiculos-reais.js (window.VEICULOS_REAIS).
function obterVeiculosReais() {
  return (typeof window !== 'undefined' && Array.isArray(window.VEICULOS_REAIS))
    ? window.VEICULOS_REAIS
    : [];
}

// Gera um veículo completo com dados REAIS (placa, modelo, ano, cor, uf,
// chassi, renavam) vindos da base puxada da LosDados.
// Aceita filtros opcionais: { modelo, uf, cor, anoInicio, anoFim }.
function gerarVeiculoAleatorio(filtros) {
  filtros = filtros || {};

  const reais = obterVeiculosReais();

  // Filtra a base real respeitando os filtros informados.
  let candidatos = reais;
  if (filtros.modelo) {
    const termo = String(filtros.modelo).trim().toLowerCase();
    if (termo) candidatos = candidatos.filter(v => String(v.modelo || '').toLowerCase().includes(termo));
  }
  if (filtros.uf) {
    const uf = String(filtros.uf).trim().toUpperCase();
    if (uf) candidatos = candidatos.filter(v => String(v.uf || '').toUpperCase() === uf);
  }
  if (filtros.cor) {
    const cor = String(filtros.cor).trim().toUpperCase();
    if (cor) candidatos = candidatos.filter(v => String(v.cor || '').toUpperCase() === cor);
  }
  if (filtros.anoInicio) {
    const anoMin = parseInt(filtros.anoInicio, 10);
    if (!isNaN(anoMin)) candidatos = candidatos.filter(v => parseInt(v.ano, 10) >= anoMin);
  }
  if (filtros.anoFim) {
    const anoMax = parseInt(filtros.anoFim, 10);
    if (!isNaN(anoMax)) candidatos = candidatos.filter(v => parseInt(v.ano, 10) <= anoMax);
  }

  // Se houver veículos reais (filtrados ou não), usa um deles.
  if (candidatos.length > 0) {
    const real = candidatos[Math.floor(Math.random() * candidatos.length)];
    const uf = String(real.uf || '').toUpperCase() || 'SP';
    const cidades = VEICULOS_CIDADES[uf] || ['Cidade'];
    const cidade = cidades[Math.floor(Math.random() * cidades.length)];
    const potencia = (70 + Math.floor(Math.random() * 150)).toString();
    const cilindradas = (1000 + Math.floor(Math.random() * 2000)).toString();

    return {
      placa: String(real.placa || '').trim().toUpperCase(),
      marca: String(real.modelo || '').split('/')[0] || 'Veículo',
      marcaModelo: String(real.modelo || '').split('/')[0] || 'Veículo',
      modelo: String(real.modelo || '').trim().toUpperCase(),
      ano: parseInt(real.ano, 10) || 2024,
      anoModelo: parseInt(real.ano, 10) || 2024,
      cor: String(real.cor || '').trim().toUpperCase(),
      chassi: String(real.chassi || '').trim().toUpperCase(),
      renavam: String(real.renavam || '').trim(),
      situacao: 'Circulação Normal',
      especie: 'Passageiro',
      tipo: 'Automóvel',
      combustivel: VEICULOS_COMBUSTIVEIS[Math.floor(Math.random() * VEICULOS_COMBUSTIVEIS.length)],
      potencia: potencia + ' cv',
      cilindradas: cilindradas + ' cm³',
      capacidade: '5 lugares',
      eixos: '2',
      carroceria: 'Sedan',
      categoria: 'Particular',
      uf: uf,
      municipio: cidade,
      cidade: cidade,
      proprietario: String(real.proprietario || '').trim() || VEICULOS_PROPRIETARIOS[Math.floor(Math.random() * VEICULOS_PROPRIETARIOS.length)],
      cpf: gerarCpfAleatorio(),
      documento: 'CRLV Digital',
      dataEmissao: '2026',
      restricao: 'Nenhuma'
    };
  }

  // SEM FALLBACK FICTÍCIO: se nenhum veículo REAL corresponder aos filtros,
  // retorna null. O Gerador de Veículos usa SOMENTE placas originais da base
  // real (LosDados) — nenhuma placa fictícia é gerada.
  return null;
}

// Gera uma lista de N veículos REAIS respeitando os filtros informados.
// Somente veículos com placa ORIGINAL (base LosDados) são retornados.
// Se nenhum veículo real corresponder aos filtros, a lista pode vir vazia.
function gerarVeiculos(quantidade, filtros) {
  const qtd = Math.max(1, Math.min(50, parseInt(quantidade, 10) || 1));
  const veiculos = [];
  for (let i = 0; i < qtd; i++) {
    const v = gerarVeiculoAleatorio(filtros);
    if (v) veiculos.push(v); // ignora null (nenhum veículo real correspondeu)
  }
  return veiculos;
}

// Gera o HTML completo da viewport "Gerador de Veículos".
function buildGeradorVeiculosTemplate(serviceKey) {
  const nome = 'GERADOR DE VEÍCULOS';

  // Opções de UF (com opção "Todos os Estados").
  const ufOptions = ['<option value="">Todos os Estados</option>']
    .concat(VEICULOS_UFS.map(uf => `<option value="${uf}">${uf}</option>`))
    .join('');

  // Opções de cor (com opção "Selecione uma cor").
  const corOptions = ['<option value="">Selecione uma cor</option>']
    .concat(VEICULOS_CORES.map(c => `<option value="${c}">${c}</option>`))
    .join('');

  // Opções de ano (2010 a 2025).
  const anoOptions = ['<option value="">Ano</option>']
    .concat(Array.from({ length: 16 }, (_, i) => 2010 + i).map(a => `<option value="${a}">${a}</option>`))
    .join('');

  return `
    <section class="tool-viewport" id="toolViewport">
      <header class="tool-viewport-header">
        <button class="tool-back-btn" id="toolBackBtn" title="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Voltar
        </button>
        <div class="tool-viewport-title">
          <h1 style="color:#fff; text-transform:uppercase;"><i class="fas fa-car"></i> ${cmsEscapeHtml(nome)}</h1>
          <p>Gere veículos com placas ORIGINAIS (base real) e gere o CRLV (Uber / 99)</p>
        </div>
        <span class="tool-status-badge"><i class="fas fa-bolt"></i> ONLINE</span>
      </header>

      <div class="tool-panel active" id="toolPanel-gerador">
        <div class="tool-card gv-card">
          <div class="tool-card-title">
            <i class="fas fa-dice"></i>
            <h3>Gerar Veículos</h3>
          </div>
          <p class="tool-card-desc">Selecione os filtros desejados e gere veículos com placas ORIGINAIS da base real (LosDados).</p>

          <!-- Grid de filtros -->
          <div class="gv-grid">
            <div class="gv-field gv-field-modelo">
              <label class="gv-label" for="gvModelo">Modelo</label>
              <div class="gv-searchable" id="gvSearchable">
                <input type="text" id="gvModelo" class="gerador-input gv-search-input" placeholder="Ex: GOL, CIVIC..." autocomplete="off" />
                <i class="fas fa-chevron-down gv-search-caret"></i>
                <div class="gv-dropdown" id="gvDropdown" hidden></div>
              </div>
            </div>

            <div class="gv-field">
              <label class="gv-label" for="gvUf">UF</label>
              <select id="gvUf" class="gerador-input gv-select">${ufOptions}</select>
            </div>

            <div class="gv-field">
              <label class="gv-label" for="gvCor">Cor</label>
              <select id="gvCor" class="gerador-input gv-select">${corOptions}</select>
            </div>

            <div class="gv-field">
              <label class="gv-label" for="gvAnoInicio">Ano Início</label>
              <select id="gvAnoInicio" class="gerador-input gv-select">${anoOptions}</select>
            </div>

            <div class="gv-field">
              <label class="gv-label" for="gvAnoFim">Ano Fim</label>
              <select id="gvAnoFim" class="gerador-input gv-select">${anoOptions}</select>
            </div>
          </div>

          <div class="gv-actions">
            <button class="tool-action-btn gv-generate-btn" id="btnGerarVeiculos">
              <i class="fas fa-search"></i> GERAR VEÍCULOS
            </button>
          </div>
        </div>

        <!-- Resultado: lista de veículos gerados -->
        <div class="consulta-result" id="geradorVeiculosResult" hidden>
          <div class="gv-result-header">
            <div class="gv-result-title">
              <i class="fas fa-check-circle"></i>
              <span>Veículos Encontrados</span>
              <span class="gv-result-count" id="geradorVeiculosCount"></span>
            </div>
            <div class="gv-result-tabs">
              <button class="gv-result-tab active" type="button">Placas</button>
              <button class="gv-result-tab" type="button">Tudo</button>
              <button class="gv-result-tab" type="button">TXT</button>
            </div>
          </div>
          <div id="geradorVeiculosList"></div>
        </div>
      </div>
    </section>
  `;
}

// Renderiza a lista de veículos gerados na viewport (tabela tabular).
// Somente veículos com placa ORIGINAL (base real) são exibidos.
function renderGeradorVeiculos(veiculos) {
  const listEl = document.getElementById('geradorVeiculosList');
  const resultEl = document.getElementById('geradorVeiculosResult');
  const countEl = document.getElementById('geradorVeiculosCount');
  if (!listEl) return;

  countEl.textContent = '(' + veiculos.length + ')';

  // Nenhum veículo REAL correspondeu aos filtros -> exibe aviso (sem fictícios).
  if (!veiculos || veiculos.length === 0) {
    listEl.innerHTML = `
      <div class="gv-result-empty">
        <i class="fas fa-search-minus"></i>
        <p>Nenhum veículo com placa ORIGINAL encontrado para os filtros selecionados.</p>
        <span>O gerador usa somente placas reais da base (LosDados). Ajuste os filtros e tente novamente.</span>
      </div>
    `;
    resultEl.hidden = false;
    return;
  }

  const linhas = veiculos.map((v, idx) => `
    <tr class="gv-result-row">
      <td class="gv-result-placa">${cmsEscapeHtml(v.placa)}</td>
      <td>${cmsEscapeHtml(v.modelo)}</td>
      <td>${cmsEscapeHtml(String(v.ano))}</td>
      <td>${cmsEscapeHtml(String(v.anoModelo || v.ano))}</td>
      <td>${cmsEscapeHtml(v.cor)}</td>
      <td>${cmsEscapeHtml(v.uf)}</td>
      <td class="gv-result-actions">
        <button class="tool-action-btn consulta-crlv-btn gv-crlv-btn" data-gerar-crlv="${idx}" type="button">
          <i class="fas fa-file-alt"></i> GERAR CRLV
        </button>
      </td>
    </tr>
  `).join('');

  listEl.innerHTML = `
    <div class="gv-result-table-wrap">
      <table class="gv-result-table">
        <thead>
          <tr>
            <th>PLACA</th>
            <th>MODELO</th>
            <th>ANO</th>
            <th>LICENCIAMENTO</th>
            <th>COR</th>
            <th>UF</th>
            <th>AÇÕES</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
  resultEl.hidden = false;

  // Vincula os botões "Gerar CRLV" de cada veículo.
  // FASE 1: em vez de abrir o modal Uber/99 diretamente, redireciona para a
  // Consulta Placa com a placa preenchida, para o usuário conferir os dados
  // reais antes de emitir o documento.
  listEl.querySelectorAll('[data-gerar-crlv]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-gerar-crlv'), 10);
      const veiculo = veiculos[idx];
      if (veiculo) redirecionarParaConsulta(veiculo.placa);
    });
  });
}

// Lista plana de modelos (marca + modelo) para o searchable select.
// Pré-computada uma única vez para alta performance na filtragem.
// Usa os modelos REAIS da base puxada da LosDados quando disponíveis.
const GV_MODELOS_LISTA = (function () {
  const lista = [];
  const reais = (typeof window !== 'undefined' && Array.isArray(window.VEICULOS_REAIS))
    ? window.VEICULOS_REAIS
    : [];
  if (reais.length > 0) {
    const vistos = {};
    reais.forEach(v => {
      const modelo = String(v.modelo || '').trim();
      if (!modelo) return;
      const chave = modelo.toLowerCase();
      if (vistos[chave]) return;
      vistos[chave] = true;
      lista.push({ label: modelo, lower: chave });
    });
  } else {
    VEICULOS_MARCAS.forEach(m => {
      m.modelos.forEach(mod => {
        lista.push({ label: m.marca + ' ' + mod, lower: (m.marca + ' ' + mod).toLowerCase() });
      });
    });
  }
  return lista;
})();

// Vincula os eventos da viewport "Gerador de Veículos".
function bindGeradorVeiculosEvents() {
  const btnGerar = document.getElementById('btnGerarVeiculos');
  const inputModelo = document.getElementById('gvModelo');
  const dropdown = document.getElementById('gvDropdown');
  const searchable = document.getElementById('gvSearchable');

  // ---- Searchable Select (autocomplete) ----
  if (inputModelo && dropdown) {
    let selecionado = null; // modelo selecionado (marca + modelo)

    // Abre o dropdown e renderiza a lista (filtrada ou completa).
    function renderDropdown(filtro) {
      const termo = (filtro || '').trim().toLowerCase();
      // Filtragem case-insensitive otimizada (pré-computada em lowercase).
      const resultados = termo
        ? GV_MODELOS_LISTA.filter(m => m.lower.includes(termo)).slice(0, 100)
        : GV_MODELOS_LISTA.slice(0, 100);

      if (resultados.length === 0) {
        dropdown.innerHTML = '<div class="gv-dropdown-empty">Nenhum modelo encontrado</div>';
      } else {
        dropdown.innerHTML = resultados
          .map((m, i) => `<div class="gv-dropdown-item" data-idx="${i}" data-val="${cmsEscapeHtml(m.label)}">${cmsEscapeHtml(m.label)}</div>`)
          .join('');
        dropdown.querySelectorAll('.gv-dropdown-item').forEach(item => {
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            selecionado = item.getAttribute('data-val');
            inputModelo.value = selecionado;
            dropdown.hidden = true;
            searchable.classList.remove('gv-searchable-open');
          });
        });
      }
      dropdown.hidden = false;
      searchable.classList.add('gv-searchable-open');
    }

    // Ao clicar no campo, abre o dropdown com a lista completa.
    inputModelo.addEventListener('focus', () => renderDropdown(inputModelo.value));

    // Filtragem em tempo real (case-insensitive) enquanto digita.
    inputModelo.addEventListener('input', () => {
      selecionado = null;
      renderDropdown(inputModelo.value);
    });

    // Fecha o dropdown ao clicar fora.
    document.addEventListener('click', (e) => {
      if (searchable && !searchable.contains(e.target)) {
        dropdown.hidden = true;
        searchable.classList.remove('gv-searchable-open');
      }
    });

    // Teclado: Enter seleciona o primeiro item; Esc fecha.
    inputModelo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const primeiro = dropdown.querySelector('.gv-dropdown-item');
        if (primeiro) {
          e.preventDefault();
          selecionado = primeiro.getAttribute('data-val');
          inputModelo.value = selecionado;
          dropdown.hidden = true;
          searchable.classList.remove('gv-searchable-open');
        }
      } else if (e.key === 'Escape') {
        dropdown.hidden = true;
        searchable.classList.remove('gv-searchable-open');
      }
    });
  }

  // ---- Geração de veículos com filtros ----
  if (btnGerar) {
    btnGerar.addEventListener('click', () => {
      const qtd = 5; // quantidade padrão (mantida para compatibilidade)
      const filtros = {
        modelo: inputModelo ? inputModelo.value.trim() : '',
        uf: (document.getElementById('gvUf') || {}).value || '',
        cor: (document.getElementById('gvCor') || {}).value || '',
        anoInicio: (document.getElementById('gvAnoInicio') || {}).value || '',
        anoFim: (document.getElementById('gvAnoFim') || {}).value || ''
      };
      const veiculos = gerarVeiculos(qtd, filtros);
      renderGeradorVeiculos(veiculos);
      if (veiculos.length === 0) {
        showToast('Nenhum veículo real', 'Nenhuma placa ORIGINAL encontrada para os filtros selecionados.');
      } else {
        showToast('Veículos gerados', `${veiculos.length} veículo(s) real(is) gerado(s) com sucesso.`);
      }
    });
  }
}

// Gera o HTML completo da viewport "Consulta Placa".
function buildConsultaPlacaTemplate(serviceKey) {
  const nome = 'TRACCER AVANÇADO';

  return `
    <section class="tool-viewport" id="toolViewport">
      <header class="tool-viewport-header">
        <button class="tool-back-btn" id="toolBackBtn" title="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Voltar
        </button>
        <div class="tool-viewport-title">
          <h1 style="color:#fff; text-transform:uppercase;"><i class="fas fa-search"></i> ${cmsEscapeHtml(nome)}</h1>
          <p>TRACCER AVANÇADO</p>
        </div>
        <span class="tool-status-badge"><i class="fas fa-bolt"></i> ONLINE</span>
      </header>

      <div class="tool-panel active" id="toolPanel-consulta">
        <div class="tool-card">
          <div class="tool-card-title">
            <i class="fas fa-id-card"></i>
            <h3>Consulta por Placa</h3>
          </div>
          <p class="tool-card-desc">Digite a placa do veículo (formato Mercosul: ABC1D23 ou antigo: ABC-1234) para consultar dados reais na LosDados.</p>

          <div class="consulta-input-wrap">
            <i class="fas fa-car"></i>
            <input type="text" id="consultaPlacaInput" class="gerador-input" maxlength="8" placeholder="Ex.: ABC1D23" autocomplete="off" />
          </div>

          <!-- ===== SELECAO DO MODELO DO DOCUMENTO (UBER / 99) ===== -->
          <!-- O usuario escolhe o formato do documento (Uber ou 99). O download
               do CRLV so acontece ao apertar "GERAR AGORA" e escolher o modelo
               no modal. Nenhum download automatico e disparado aqui. -->
          <div class="consulta-modelo-wrap">
            <label class="consulta-modelo-label">Formato do documento:</label>
            <div class="consulta-modelo-options">
              <label class="consulta-modelo-option" data-modelo="uber">
                <input type="radio" name="consultaModeloDoc" value="uber" checked />
                <span class="consulta-modelo-opt-inner">
                  <span class="consulta-modelo-opt-icon">&#128663;</span>
                  <span class="consulta-modelo-opt-name">UBER</span>
                </span>
              </label>
              <label class="consulta-modelo-option" data-modelo="99">
                <input type="radio" name="consultaModeloDoc" value="99" />
                <span class="consulta-modelo-opt-inner">
                  <span class="consulta-modelo-opt-icon">&#128661;</span>
                  <span class="consulta-modelo-opt-name">99</span>
                </span>
              </label>
            </div>
          </div>

          <div class="tool-action-area">
            <button class="tool-action-btn" id="btnConsultarPlaca">
              <i class="fas fa-search"></i> CONSULTAR PLACA
            </button>
            <span class="tool-action-price">Valor: R$ 5,00</span>
          </div>
        </div>

        <!-- Resultado da consulta -->
        <div class="consulta-result" id="consultaResult" hidden>
          <div class="tool-results-header">
            <span><i class="fas fa-check-circle"></i> Informações Encontradas</span>
            <span class="tool-confidence-tag" id="consultaPlacaTag"></span>
          </div>
          <div class="consulta-card" id="consultaCard"></div>
        </div>
      </div>
    </section>
  `;
}

/* ============================================================
   GERADOR DE CHASSI (VIN) — FUSÃO DE TEXTO EM IMAGEM (CANVAS)
   O usuário digita o chassi (VIN) e o sistema grava esse texto
   sobre as imagens base cadastradas no Admin (templates_chassi).
   A lógica do Canvas é isolada e protegida para não interferir
   nos demais serviços (Venda de Bicos, Consulta Placa, etc).
   ============================================================ */

// Chave de armazenamento das imagens base (sincronizada com o Admin).
const CHASSI_TEMPLATES_KEY = 'templates_chassi';

// Carrega os templates de chassi do localStorage (com fallback seguro).
function chassiTemplatesLoad() {
  try {
    const raw = localStorage.getItem(CHASSI_TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[Chassi] Falha ao ler templates.', e);
  }
  return [];
}

// Cria uma imagem base de fallback (fundo cinza) via código, usada
// quando não há templates cadastrados no Admin. Retorna um DataURL.
function chassiCreateFallbackTemplate(index) {
  const w = 800;
  const h = 450;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  // Fundo cinza com leve gradiente
  const shades = ['#3a3f4b', '#2e333d', '#454b58'];
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, shades[index % shades.length]);
  grad.addColorStop(1, '#23262e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Moldura sutil
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  // Rótulo de área reservada
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ÁREA RESERVADA', w / 2, h / 2);
  return canvas.toDataURL('image/jpeg', 0.9);
}

// Monta a interface do Gerador de Chassi.
function buildGeradorChassiTemplate(serviceKey) {
  const nome = 'GERADOR';

  return `
    <section class="tool-viewport" id="toolViewport">
      <header class="tool-viewport-header">
        <button class="tool-back-btn" id="toolBackBtn" title="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Voltar
        </button>
        <div class="tool-viewport-title">
          <h1 style="color:#fff; text-transform:uppercase;"><i class="fas fa-fingerprint"></i> ${cmsEscapeHtml(nome)}</h1>
          <p>Grave o chassi (VIN) sobre as imagens base em segundos</p>
        </div>
        <span class="tool-status-badge"><i class="fas fa-bolt"></i> ONLINE</span>
      </header>

      <div class="tool-panel active" id="toolPanel-chassi">
        <div class="tool-card">
          <div class="tool-card-title">
            <i class="fas fa-keyboard"></i>
            <h3>INFORME O CHASSI (VIN)</h3>
          </div>
          <p class="tool-card-desc">Digite o número do chassi (VIN) com até 17 caracteres. O texto será gravado sobre as imagens base cadastradas.</p>
          <div class="consulta-input-wrap">
            <i class="fas fa-fingerprint"></i>
            <input type="text" id="chassiVinInput" class="gerador-input" maxlength="17" placeholder="Digite o VIN aqui..." autocomplete="off" />
          </div>
          <div class="tool-action-area">
            <button class="tool-action-btn" id="btnGerarChassi">
              <i class="fas fa-paper-plane"></i> GERAR IMAGENS
            </button>
          </div>
        </div>

        <!-- Resultado: imagens geradas -->
        <div class="chassi-result" id="chassiResult" hidden>
          <div class="tool-results-header">
            <span><i class="fas fa-images"></i> IMAGENS GERADAS</span>
            <span class="tool-confidence-tag" id="chassiCountTag"></span>
          </div>
          <div class="chassi-grid" id="chassiGrid"></div>
        </div>
      </div>
    </section>
  `;
}

// Gera as imagens com o chassi (VIN) gravado sobre cada template base.
// Lógica isolada e protegida: usa um <canvas> invisível e não altera
// o estado dos demais serviços.
async function gerarImagensChassi() {
  const input = document.getElementById('chassiVinInput');
  const result = document.getElementById('chassiResult');
  const grid = document.getElementById('chassiGrid');
  const countTag = document.getElementById('chassiCountTag');
  if (!input || !result || !grid) return;

  const vin = (input.value || '').trim().toUpperCase();
  if (!vin) {
    showToast('Informe o chassi', 'Digite o número do VIN antes de gerar as imagens.');
    input.focus();
    return;
  }

  // Carrega os templates base; se vazio, usa 3 imagens de fallback.
  let templates = chassiTemplatesLoad();
  if (templates.length === 0) {
    templates = [0, 1, 2].map(i => ({ data: chassiCreateFallbackTemplate(i), name: 'Fallback' }));
  }

  // Feedback visual de processamento
  result.hidden = false;
  grid.innerHTML = `<div class="chassi-loading"><i class="fas fa-spinner fa-spin"></i> Gerando imagens...</div>`;
  if (countTag) countTag.textContent = 'processando...';

  // Gera cada imagem via Canvas (isolado, sem afetar outros módulos).
  // Aguarda a decodificação de cada imagem antes de desenhar.
  const geradas = [];
  for (let idx = 0; idx < templates.length; idx++) {
    const dataUrl = await chassiFusaoCanvas(templates[idx].data, vin, idx);
    if (dataUrl) {
      geradas.push({ dataUrl, label: String.fromCharCode(65 + idx) }); // A, B, C...
    }
  }

  if (geradas.length === 0) {
    grid.innerHTML = `<div class="chassi-empty"><i class="fas fa-exclamation-triangle"></i><p>Não foi possível gerar as imagens. Tente novamente.</p></div>`;
    if (countTag) countTag.textContent = '0 imagem(ns)';
    showToast('Erro ao gerar', 'Não foi possível gerar as imagens. Tente novamente.');
    return;
  }

  // Renderiza os cards de resultado
  grid.innerHTML = geradas.map(r => `
    <div class="chassi-card">
      <div class="chassi-card-title">IMAGEM ${r.label}</div>
      <div class="chassi-card-img">
        <img src="${r.dataUrl}" alt="Chassi gerado ${r.label}" />
      </div>
      <a class="chassi-download" href="${r.dataUrl}" download="chassi_gerado_${r.label}.jpg">
        <i class="fas fa-download"></i> Baixar Imagem
      </a>
    </div>
  `).join('');

  if (countTag) countTag.textContent = `${geradas.length} imagem(ns)`;
  showToast('Imagens geradas', `${geradas.length} imagem(ns) com o chassi ${vin} criada(s).`);
}

// Funde o texto do VIN sobre uma imagem base usando o Canvas API.
// O parâmetro `index` define a textura condicional: a imagem A (index 0)
// simula tinta em etiqueta (nítida e escura), enquanto as demais (B, C...)
// simulam gravação em metal (apagada e com baixo relevo).
// Retorna uma Promise com o DataURL (JPEG) ou string vazia em caso de falha.
function chassiFusaoCanvas(baseDataUrl, vin, index) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth || 800;
          const h = img.naturalHeight || 450;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve('');

          // Desenha a imagem base
          ctx.drawImage(img, 0, 0, w, h);

          // ===== GRAVAÇÃO INDUSTRIAL (EMBOSS / BAIXO RELEVO) =====
          // Alinhamento centralizado (ponto de ancoragem no meio da imagem).
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Posição centralizada, com leve ajuste para a área de "respiro".
          const cx = w / 2;

          // Variável única de tamanho de fonte, calibrada por índice abaixo.
          let fontSize;

          // ===== TEXTURA CONDICIONAL POR ÍNDICE =====
          // A imagem A (index 0) simula tinta em etiqueta: tom quase preto,
          // nítido, fonte pequena e sem espaçamento (impressão, não gravação).
          if (index === 0) {
            // ===== IMAGEM A — ETIQUETA IMPRESSA =====
            // Fonte pequena e proporcional a uma impressão de etiqueta.
            fontSize = Math.max(14, Math.round(w * 0.035));
            ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
            ctx.letterSpacing = '0px'; // garante que não herde espaçamento

            // Posiciona o texto exatamente abaixo das letras "T115/70R15",
            // sem tocar no QR code.
            const cyA = h * 0.45;

            // Tinta de etiqueta impressa: cor bem escura e nítida, sem relevo
            // forte (apenas sombra sutil para leitura).
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 1;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = 'rgba(15, 15, 15, 0.95)'; // quase preto sólido
            ctx.fillText(vin, cx, cyA);
            ctx.restore();
          } else if (index === 1) {
            // ===== IMAGEM B — METAL GRAVADO (MAIOR CONTRASTE) =====
            // Fonte média que acompanha a gravação original sem exageros.
            fontSize = Math.max(18, Math.round(w * 0.045));
            ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;

            // Espaçamento de letras realista: usa letterSpacing nativo quando
            // suportado; caso contrário, insere um espaço entre cada caractere.
            let textoB = vin;
            if (typeof ctx.letterSpacing !== 'undefined') {
              ctx.letterSpacing = '2px';
            } else {
              textoB = vin.split('').join(' ');
            }

            // Centraliza na área de gravação do metal.
            const cyB = h / 2;

            // PASSO 1 — Luz do relevo: branco translúcido deslocado na diagonal,
            // reforçando o efeito de baixo relevo (emboss).
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(textoB, cx + 1, cyB + 1);
            ctx.restore();

            // PASSO 2 — Gravação principal: cor base mais densa e escura para
            // dar o aspecto "fixado/gravado" idêntico ao da Imagem C.
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = 'rgba(50, 50, 50, 0.85)'; // densa, mantendo textura
            ctx.fillText(textoB, cx, cyB);
            ctx.restore();
          } else {
            // ===== IMAGEM C — METAL GRAVADO (REFERÊNCIA) =====
            // Fonte média que acompanha a gravação original sem exageros.
            fontSize = Math.max(18, Math.round(w * 0.045));
            ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;

            // Espaçamento de letras realista: usa letterSpacing nativo quando
            // suportado; caso contrário, insere um espaço entre cada caractere.
            let textoC = vin;
            if (typeof ctx.letterSpacing !== 'undefined') {
              ctx.letterSpacing = '2px';
            } else {
              textoC = vin.split('').join(' ');
            }

            // Centraliza na área de gravação do metal.
            const cyC = h / 2;

            // PASSO 1 — Luz do relevo: branco translúcido deslocado na diagonal.
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText(textoC, cx + 1, cyC + 1);
            ctx.restore();

            // PASSO 2 — Sombra/Gravação: cinza transparente/apagado na posição
            // original, mesclando com o metal.
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = 'rgba(70, 70, 70, 0.45)'; // cinza transparente/apagado
            ctx.fillText(textoC, cx, cyC);
            ctx.restore();
          }

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
          console.warn('[Chassi] Falha na fusão via Canvas.', e);
          resolve('');
        }
      };
      img.onerror = () => {
        console.warn('[Chassi] Falha ao carregar imagem base.');
        resolve('');
      };
      img.src = baseDataUrl;
    } catch (e) {
      console.warn('[Chassi] Falha ao iniciar fusão via Canvas.', e);
      resolve('');
    }
  });
}


// FASE 3/4: guarda em memória o veículo consultado na Consulta Placa, para que
// o modal Uber/99 (veicdbGerarCrlv) gere o PDF com os dados reais consultados.
let consultaPlacaVeiculoAtual = null;
let consultaPlacaPlacaAtual = '';

// Redireciona para a tela de "Consulta Placa", salvando a placa pendente
// em sessionStorage para auto-preenchimento e execução automática.
function redirecionarParaConsulta(placa) {
  const placaLimpa = String(placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  try {
    sessionStorage.setItem('placaPendente', placaLimpa);
  } catch (e) {
    console.warn('[Consulta] Falha ao salvar placa pendente.', e);
  }
  // FASE 2: registra a placa na URL (?placa=ABC1234) sem recarregar a página,
  // para que a Consulta Placa consiga capturá-la via URLSearchParams.
  if (placaLimpa) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('placa', placaLimpa);
      window.history.replaceState({}, '', url.toString());
    } catch (e) { /* ignora falha de URL */ }
  }
  openToolViewport('consulta-placa');
}

// Inicializa a tela de Consulta Placa: preenche a placa pendente (se houver)
// e dispara a consulta automaticamente.
// FASE 2: a placa pode vir de duas fontes — parâmetro de URL (?placa=ABC1234)
// ou sessionStorage (placaPendente). Prioriza a URL, depois o sessionStorage.
function initConsultaPlaca() {
  let placa = '';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    placa = urlParams.get('placa') || '';
  } catch (e) {
    placa = '';
  }
  if (!placa) {
    try {
      placa = sessionStorage.getItem('placaPendente') || '';
    } catch (e) {
      placa = '';
    }
  }
  if (!placa) return;

  // Limpa o armazenamento para não repetir a consulta
  try {
    sessionStorage.removeItem('placaPendente');
  } catch (e) { /* ignore */ }

  const input = document.getElementById('consultaPlacaInput');
  if (input) input.value = placa;
  executarConsultaPlaca();
}

// Executa a consulta de placa e renderiza o resultado.
// A consulta é feita EM TEMPO REAL na API LosDados via proxy server-to-server
// (api_losdados_controller.js), retornando SOMENTE dados reais conferidos pela
// API oficial. Se a placa não existir, exibe "Placa não encontrada".
// NUNCA gera dados fictícios.
async function executarConsultaPlaca() {
  const input = document.getElementById('consultaPlacaInput');
  const resultEl = document.getElementById('consultaResult');
  const cardEl = document.getElementById('consultaCard');
  const tagEl = document.getElementById('consultaPlacaTag');
  if (!input || !resultEl || !cardEl) return;

  const placa = (input.value || '').trim().toUpperCase();
  if (!placa) {
    showToast('Placa obrigatória', 'Digite uma placa para consultar.');
    return;
  }

  resultEl.hidden = false;
  if (tagEl) tagEl.textContent = `Placa: ${placa}`;
  cardEl.innerHTML = `
    <div class="consulta-placa-big">${cmsEscapeHtml(placa)}</div>
    <div class="consulta-loading">
      <i class="fas fa-spinner fa-spin"></i> Consultando dados reais na LosDados...
    </div>
  `;

  // Consulta a placa em tempo real na API LosDados via proxy local (server.js).
  // A API Key é injetada automaticamente pelo servidor — o usuário NÃO precisa
  // digitar a chave. O servidor também deduz a consulta do saldo do cliente.
  const placaLimpa = String(placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const urlApi = `${API_BASE}/api/losdados/consulta?tipo=placa&documento=${encodeURIComponent(placaLimpa)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  let dados;
  try {
    const resp = await fetch(urlApi, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    // Trata erros HTTP retornados pelo proxy (ex.: 403 limite esgotado).
    if (!resp.ok) {
      let erroMsg = 'Falha na consulta (HTTP ' + resp.status + ').';
      let limiteAtingido = false;
      try {
        const errBody = await resp.json();
        if (errBody && errBody.erro) erroMsg = errBody.erro;
        if (errBody && errBody.limiteAtingido) limiteAtingido = true;
        // Atualiza o medidor com o saldo retornado (mesmo em bloqueio).
        if (errBody && errBody.saldo) consultaMeterRender(errBody.saldo);
      } catch (e) { /* corpo não-JSON */ }
      cardEl.innerHTML = `
        <div class="consulta-placa-big">${cmsEscapeHtml(placa)}</div>
        <div class="consulta-notfound">
          <i class="fas ${limiteAtingido ? 'fa-ban' : 'fa-exclamation-triangle'}"></i>
          <p>${limiteAtingido ? 'Limite de consultas esgotado' : 'Falha na consulta'}</p>
          <span>${cmsEscapeHtml(erroMsg)}</span>
        </div>
      `;
      showToast(limiteAtingido ? 'Limite esgotado' : 'Falha na consulta', erroMsg);
      return;
    }

    dados = await resp.json();
  } catch (e) {
    clearTimeout(timeout);
    const isAbort = (e && e.name === 'AbortError');
    const isCors = (e && (e.name === 'TypeError' || /cors|network|failed to fetch/i.test(String(e && e.message))));
    const msg = isAbort
      ? 'Tempo esgotado ao consultar a placa na LosDados. Tente novamente.'
      : (isCors
          ? 'Falha de rede/CORS ao consultar a LosDados. Verifique se o servidor local (server.js) está rodando na porta 3000.'
          : 'Erro ao consultar a LosDados: ' + (e && e.message ? e.message : 'erro desconhecido.'));
    cardEl.innerHTML = `
      <div class="consulta-placa-big">${cmsEscapeHtml(placa)}</div>
      <div class="consulta-notfound">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Falha na consulta</p>
        <span>${cmsEscapeHtml(msg)}</span>
      </div>
    `;
    showToast('Falha na consulta', msg);
    return;
  }

  // O proxy converte o 404 da LosDados em HTTP 200 com flag notFound:true.
  if (!dados || typeof dados !== 'object' || dados.notFound === true) {
    cardEl.innerHTML = `
      <div class="consulta-placa-big">${cmsEscapeHtml(placa)}</div>
      <div class="consulta-notfound">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Placa não encontrada</p>
      </div>
    `;
    showToast('Placa não encontrada', 'Placa não encontrada.');
    return;
  }

  // Atualiza o medidor de consultas em tempo real com o saldo retornado
  // pelo servidor (injetado após a dedução da consulta bem-sucedida).
  if (dados && dados.saldo) {
    consultaMeterRender(dados.saldo);
  } else {
    consultaMeterAtualizar();
  }

  // Extrai o objeto do veículo (aceita variações de nomenclatura da API).
  // A resposta da LosDados pode vir em dados.veiculo, dados.data (objeto ou
  // array), ou diretamente em dados. Combinamos as variações em um objeto.
  let veiculo = dados.vehicle || dados.veiculo || dados.data || dados;
  if (veiculo && typeof veiculo === 'object' && veiculo.veiculo && typeof veiculo.veiculo === 'object') {
    // Estrutura do gateway: { data: [...], veiculo: {...} }
    const dadosFipe = (veiculo.data && Array.isArray(veiculo.data) && veiculo.data[0]) || {};
    veiculo = Object.assign({}, veiculo.veiculo, dadosFipe);
  }

  // Organiza os dados reais em seções estilo planilha.
  const secoes = veicdbOrganizarSecoesConsulta(veiculo, placa);

  // Monta o HTML das seções.
  const secoesHtml = secoes.map(sec => {
    if (!sec.linhas || sec.linhas.length === 0) return '';
    const linhasHtml = sec.linhas.map(l => `
      <tr>
        <td class="consulta-th">${cmsEscapeHtml(l.label)}</td>
        <td class="${l.mono ? 'mono' : ''}">${cmsEscapeHtml(l.valor)}</td>
      </tr>
    `).join('');
    return `
      <div class="consulta-secao">
        <div class="consulta-secao-titulo"><i class="${sec.icone}"></i> ${cmsEscapeHtml(sec.titulo)}</div>
        <div class="consulta-table-wrap">
          <table class="consulta-table">
            <tbody>${linhasHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  // FASE 3: salva o veículo consultado em memória para o repasse perfeito de
  // dados ao gerador de PDF (modal Uber/99) na FASE 4.
  consultaPlacaVeiculoAtual = veiculo;
  consultaPlacaPlacaAtual = placa;

  cardEl.innerHTML = `
    <div class="consulta-placa-big">${cmsEscapeHtml(placa)}</div>
    <div class="consulta-actions">
      <button class="tool-action-btn consulta-copy-btn" id="btnCopiarDadosPlaca" type="button">
        <i class="fas fa-copy"></i> COPIAR
      </button>
      <button class="tool-action-btn consulta-crlv-btn" id="btnGerarCrlv" type="button">
        <i class="fas fa-file-alt"></i> GERAR AGORA
      </button>
    </div>
    ${secoesHtml}
  `;

  // Botão "Copiar": copia o conteúdo completo (seção -> campo: valor) para a
  // área de transferência em formato texto simples.
  const copyBtn = document.getElementById('btnCopiarDadosPlaca');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const partes = [];
      for (const sec of secoes) {
        if (!sec.linhas || sec.linhas.length === 0) continue;
        partes.push(sec.titulo.toUpperCase());
        for (const l of sec.linhas) partes.push(`${l.label}: ${l.valor}`);
        partes.push('');
      }
      const ok = veicdbCopiarTexto(partes.join('\n'));
      showToast(
        ok ? 'Dados copiados' : 'Falha ao copiar',
        ok ? 'Todos os dados da placa foram copiados para a área de transferência.'
           : 'Não foi possível copiar os dados automaticamente.'
      );
    });
  }

  // Botão "GERAR AGORA" (FASE 4): abre o modal Uber/99 e gera o PDF com os
  // dados reais consultados na LosDados (repasse perfeito de dados).
  const crlvBtn = document.getElementById('btnGerarCrlv');
  if (crlvBtn) {
    crlvBtn.addEventListener('click', () => {
      veicdbGerarCrlv(consultaPlacaVeiculoAtual || veiculo, consultaPlacaPlacaAtual || placa);
    });
  }

  showToast('Consulta concluída', `Dados reais da placa ${placa} recuperados da LosDados.`);
}

// Mapeia TODAS as propriedades do veículo salvo no banco local para exibição
// em formato de planilha. Percorre dinamicamente o objeto, ignorando campos
// vazios/indefinidos e formatando rótulos legíveis (ex.: "anoModelo" -> "Ano Modelo").
// Campos sensíveis (chassi, renavam) são marcados com fonte monoespaçada.
function veicdbMapearCamposConsulta(veiculo) {
  const v = veiculo || {};
  const linhas = [];
  const mono = new Set(['chassi', 'renavam', 'placa', 'vin']);

  // Ordem de exibição preferencial (campos mais relevantes primeiro).
  const ordem = [
    'placa', 'marca', 'modelo', 'ano', 'anoModelo', 'cor', 'uf', 'municipio',
    'cidade', 'chassi', 'renavam', 'proprietario', 'proprietário', 'situacao',
    'situação', 'especie', 'espécie', 'tipo', 'combustivel', 'combustível',
    'potencia', 'potência', 'cilindradas', 'capacidade', 'eixos', 'carroceria',
    'categoria', 'restricao', 'restrição', 'dataEmissao', 'dataEmissão'
  ];

  const jaVistos = new Set();
  const push = (chave, valor) => {
    if (jaVistos.has(chave)) return;
    jaVistos.add(chave);
    const label = veicdbFormatarRotulo(chave);
    linhas.push({
      label,
      valor: String(valor),
      mono: mono.has(chave.toLowerCase())
    });
  };

  // 1) Campos conhecidos, na ordem preferencial.
  for (const chave of ordem) {
    const valor = v[chave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      push(chave, valor);
    }
  }

  // 2) Quaisquer OUTRAS propriedades extras salvas pela LosDados (não listadas
  //    acima) — garante que nenhum campo real seja omitido da exibição.
  for (const chave of Object.keys(v)) {
    const valor = v[chave];
    if (valor === undefined || valor === null) continue;
    if (typeof valor === 'object') continue; // ignora objetos aninhados
    if (String(valor).trim() === '') continue;
    push(chave, valor);
  }

  return linhas;
}

// Formata uma chave de objeto em um rótulo legível em português.
// Ex.: "anoModelo" -> "Ano Modelo", "dataEmissao" -> "Data Emissão".
function veicdbFormatarRotulo(chave) {
  const mapa = {
    placa: 'Placa', marca: 'Marca', modelo: 'Modelo', ano: 'Ano',
    anoModelo: 'Ano Modelo', cor: 'Cor', uf: 'UF', municipio: 'Município',
    cidade: 'Cidade', chassi: 'Chassi', renavam: 'Renavam',
    proprietario: 'Proprietário', 'proprietário': 'Proprietário',
    situacao: 'Situação', 'situação': 'Situação', especie: 'Espécie',
    'espécie': 'Espécie', tipo: 'Tipo', combustivel: 'Combustível',
    'combustível': 'Combustível', potencia: 'Potência', 'potência': 'Potência',
    cilindradas: 'Cilindradas', capacidade: 'Capacidade', eixos: 'Eixos',
    carroceria: 'Carroceria', categoria: 'Categoria', restricao: 'Restrição',
    'restrição': 'Restrição', dataEmissao: 'Data Emissão', 'dataEmissão': 'Data Emissão',
    vin: 'VIN'
  };
  if (mapa[chave]) return mapa[chave];
  // Fallback genérico: separa camelCase e capitaliza a primeira letra.
  return String(chave)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Copia um texto para a área de transferência de forma compatível com
// navegadores modernos (Clipboard API) e com fallback para document.execCommand.
function veicdbCopiarTexto(texto) {
  if (!texto) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).catch(() => {});
      return true;
    }
  } catch (e) { /* tenta fallback abaixo */ }

  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

// Organiza os dados reais do veículo (retornados pela LosDados) em seções
// estilo planilha, conforme as opções solicitadas:
//   - Dados do Veículo
//   - IPVA & Licenciamento
//   - Proprietário
//   - Localização
//   - Restrições & Indicadores
//   - Importação & Faturamento
//   - Outros
// Somente campos com valor REAL (não vazio) são exibidos. NENHUM dado fictício
// é inventado: se a LosDados não retornar um campo, ele simplesmente não aparece.
function veicdbOrganizarSecoesConsulta(veiculo, placa) {
  const v = veiculo || {};
  const secoes = [];

  // Helper: adiciona uma linha a uma seção (ignora valores vazios/indefinidos).
  const mono = new Set(['chassi', 'renavam', 'placa', 'vin']);
  const addLinha = (sec, chave, valor) => {
    if (valor === undefined || valor === null) return;
    const str = String(valor).trim();
    if (str === '') return;
    sec.linhas.push({
      label: veicdbFormatarRotulo(chave),
      valor: str,
      mono: mono.has(String(chave).toLowerCase())
    });
  };

  // Cria uma seção vazia.
  const novaSecao = (titulo, icone) => ({ titulo, icone, linhas: [] });

  // ---- DADOS DO VEÍCULO ----
  const dadosVeiculo = novaSecao('Dados do Veículo', 'fas fa-car');
  addLinha(dadosVeiculo, 'placa', placa || v.placa);
  addLinha(dadosVeiculo, 'marca', v.marca || v.marcaModelo);
  addLinha(dadosVeiculo, 'modelo', v.modelo);
  addLinha(dadosVeiculo, 'ano', v.ano);
  addLinha(dadosVeiculo, 'anoModelo', v.anoModelo);
  addLinha(dadosVeiculo, 'cor', v.cor);
  addLinha(dadosVeiculo, 'chassi', v.chassi);
  addLinha(dadosVeiculo, 'renavam', v.renavam);
  addLinha(dadosVeiculo, 'situacao', v.situacao || v.situação);
  addLinha(dadosVeiculo, 'especie', v.especie || v.espécie);
  addLinha(dadosVeiculo, 'tipo', v.tipo);
  addLinha(dadosVeiculo, 'combustivel', v.combustivel || v.combustível);
  addLinha(dadosVeiculo, 'potencia', v.potencia || v.potência);
  addLinha(dadosVeiculo, 'cilindradas', v.cilindradas);
  addLinha(dadosVeiculo, 'capacidade', v.capacidade);
  addLinha(dadosVeiculo, 'eixos', v.eixos);
  addLinha(dadosVeiculo, 'carroceria', v.carroceria);
  addLinha(dadosVeiculo, 'categoria', v.categoria);
  if (dadosVeiculo.linhas.length > 0) secoes.push(dadosVeiculo);

  // ---- IPVA & LICENCIAMENTO ----
  const ipva = novaSecao('IPVA & Licenciamento', 'fas fa-file-invoice-dollar');
  addLinha(ipva, 'ipva', v.ipva);
  addLinha(ipva, 'ipvaValor', v.ipvaValor);
  addLinha(ipva, 'ipvaSituacao', v.ipvaSituacao);
  addLinha(ipva, 'licenciamento', v.licenciamento);
  addLinha(ipva, 'licenciamentoSituacao', v.licenciamentoSituacao);
  addLinha(ipva, 'dataEmissao', v.dataEmissao || v.dataEmissão);
  addLinha(ipva, 'dataLicenciamento', v.dataLicenciamento);
  addLinha(ipva, 'exercicio', v.exercicio);
  if (ipva.linhas.length > 0) secoes.push(ipva);

  // ---- PROPRIETÁRIO ----
  const proprietario = novaSecao('Proprietário', 'fas fa-user');
  addLinha(proprietario, 'proprietario', v.proprietario || v.proprietário);
  addLinha(proprietario, 'cpf', v.cpf);
  addLinha(proprietario, 'cnpj', v.cnpj);
  addLinha(proprietario, 'documento', v.documento);
  addLinha(proprietario, 'nome', v.nome);
  addLinha(proprietario, 'tipoPessoa', v.tipoPessoa);
  if (proprietario.linhas.length > 0) secoes.push(proprietario);

  // ---- LOCALIZAÇÃO ----
  const localizacao = novaSecao('Localização', 'fas fa-map-marker-alt');
  addLinha(localizacao, 'uf', v.uf);
  addLinha(localizacao, 'municipio', v.municipio);
  addLinha(localizacao, 'cidade', v.cidade);
  addLinha(localizacao, 'endereco', v.endereco);
  addLinha(localizacao, 'cep', v.cep);
  addLinha(localizacao, 'bairro', v.bairro);
  if (localizacao.linhas.length > 0) secoes.push(localizacao);

  // ---- RESTRIÇÕES & INDICADORES ----
  const restricoes = novaSecao('Restrições & Indicadores', 'fas fa-exclamation-triangle');
  addLinha(restricoes, 'restricao', v.restricao || v.restrição);
  addLinha(restricoes, 'restricoes', v.restricoes);
  addLinha(restricoes, 'indicador', v.indicador);
  addLinha(restricoes, 'alerta', v.alerta);
  addLinha(restricoes, 'rouboFurto', v.rouboFurto);
  addLinha(restricoes, 'sinistro', v.sinistro);
  addLinha(restricoes, 'multas', v.multas);
  addLinha(restricoes, 'bloqueio', v.bloqueio);
  if (restricoes.linhas.length > 0) secoes.push(restricoes);

  // ---- IMPORTAÇÃO & FATURAMENTO ----
  const importacao = novaSecao('Importação & Faturamento', 'fas fa-file-import');
  addLinha(importacao, 'importado', v.importado);
  addLinha(importacao, 'origem', v.origem);
  addLinha(importacao, 'faturamento', v.faturamento);
  addLinha(importacao, 'notaFiscal', v.notaFiscal);
  addLinha(importacao, 'valor', v.valor);
  addLinha(importacao, 'dataImportacao', v.dataImportacao);
  if (importacao.linhas.length > 0) secoes.push(importacao);

  // ---- OUTROS ----
  const outros = novaSecao('Outros', 'fas fa-ellipsis-h');
  // Percorre dinamicamente TODAS as propriedades reais retornadas pela LosDados
  // que ainda não foram exibidas nas seções acima, garantindo que nenhum campo
  // real seja omitido. NENHUM dado fictício é gerado.
  const jaExibidas = new Set();
  for (const sec of secoes) {
    for (const l of sec.linhas) jaExibidas.add(l.label);
  }
  for (const chave of Object.keys(v)) {
    const valor = v[chave];
    if (valor === undefined || valor === null) continue;
    if (typeof valor === 'object') continue; // ignora objetos aninhados
    if (String(valor).trim() === '') continue;
    const label = veicdbFormatarRotulo(chave);
    if (jaExibidas.has(label)) continue;
    addLinha(outros, chave, valor);
  }
  if (outros.linhas.length > 0) secoes.push(outros);

  return secoes;
}

// ===== PRÉ-PREENCHIMENTO AUTOMÁTICO DOS DADOS DO CRLV =====
// Mapeia, sanitiza e injeta TODOS os dados da API (Renavam, Placa, Exercício,
// Ano Fabricação, Ano Modelo, Chassi, Marca/Modelo/Versão, Cor, Combustível,
// Espécie/Tipo, Categoria, Nome do Proprietário, CPF/CNPJ, Local e Data) em um
// objeto normalizado ANTES do clique final no modal. Nenhum campo mapeado fica
// em branco: se o dado real existir, ele é preenchido. NENHUM dado fictício é
// inventado.
function veicdbNormalizarParaCrlv(veiculo, placa) {
  const v = veiculo || {};
  const limpar = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  };

  // Busca o primeiro valor não vazio entre várias chaves possíveis da API.
  // A LosDados retorna os campos com nomenclatura própria (ex.: codigoRenavam,
  // descricaoMarcaModelo, nomeProprietario, numeroIdentificacaoProprietario,
  // descricaoMunicipioEmplacamento, ufJurisdicao, dataEmissaoCrv, etc.).
  // Este helper garante que TODOS os dados reais sejam capturados,
  // independentemente da variação de nome usada pela API.
  const buscar = (...chaves) => {
    for (const c of chaves) {
      const val = limpar(v[c]);
      if (val !== '') return val;
    }
    return '';
  };

  // Marca/Modelo combinados (aceita variações da API).
  const marca = buscar('marca', 'marcaModelo', 'descricaoMarca', 'descricao_marca');
  const modelo = buscar('modelo', 'descricaoModelo', 'descricao_modelo');
  const marcaModelo = buscar('marcaModelo', 'descricaoMarcaModelo', 'descricao_marca_modelo', 'marcaModeloVersao')
    || (marca && modelo ? marca + ' ' + modelo : (marca || modelo));

  // Espécie/Tipo combinados.
  const especie = buscar('especie', 'espécie', 'descricaoEspecieVeiculo', 'descricao_especie_veiculo');
  const tipo = buscar('tipo', 'descricaoTipoVeiculo', 'descricao_tipo_veiculo', 'tipoVeiculo');
  const especieTipo = buscar('especieTipo', 'especie_tipo')
    || (especie && tipo ? especie + ' / ' + tipo : (especie || tipo));

  // Potência/Cilindrada combinados.
  const potencia = buscar('potencia', 'potência');
  const cilindradas = buscar('cilindradas');
  const potenciaCilindrada = buscar('potenciaCilindrada', 'potencia_cilindrada')
    || (potencia && cilindradas ? potencia + '/' + cilindradas : (potencia || cilindradas));

  // Restrição (pode vir como descricaoRestricao1, descricao_restricao1, etc.)
  const restricao = buscar('restricao', 'restrição', 'descricaoRestricao1', 'descricao_restricao1', 'descricaoRestricao', 'descricao_restricao');

  return {
    renavam: buscar('renavam', 'codigoRenavam', 'codigo_renavam', 'renavan', 'codigoRenavan'),
    placa: limpar(placa || v.placa),
    exercicio: buscar('exercicio', 'exercício'),
    anoFabricacao: buscar('anoFabricacao', 'ano_fabricacao', 'anoFabricacao', 'ano'),
    anoModelo: buscar('anoModelo', 'ano_modelo'),
    marcaModelo: marcaModelo,
    chassi: buscar('chassi', 'numeroChassi', 'numero_chassi'),
    cor: buscar('cor', 'descricaoCor', 'descricao_cor', 'corPredominante'),
    especieTipo: especieTipo,
    combustivel: buscar('combustivel', 'combustível', 'descricaoCombustivel', 'descricao_combustivel'),
    categoria: buscar('categoria', 'descricaoCategoria', 'descricao_categoria'),
    capacidade: buscar('capacidade', 'lotacao', 'quantidadeLugares', 'quantidade_lugares'),
    potenciaCilindrada: potenciaCilindrada,
    pesoBruto: buscar('pesoBruto', 'pesoBrutoTotal', 'peso_bruto', 'pbt'),
    motor: buscar('motor', 'numeroMotor', 'numero_motor'),
    carroceria: buscar('carroceria', 'descricaoTipoCarroceria', 'descricao_tipo_carroceria'),
    eixos: buscar('eixos', 'qtdEixos', 'qtd_eixos', 'quantidadeEixos'),
    nome: buscar('nome', 'nomeProprietario', 'nome_proprietario', 'proprietario', 'proprietário'),
    local: buscar('local', 'municipio', 'cidade', 'descricaoMunicipioEmplacamento'),
    data: buscar('data', 'dataEmissao', 'dataEmissão', 'dataEmissaoCrv', 'data_emissao_crv'),
    cpfCnpj: buscar('cpfCnpj', 'cpf_cnpj', 'numeroIdentificacaoProprietario', 'numero_identificacao_proprietario', 'cpf', 'cnpj', 'documento'),
    // Campos adicionais exibidos no painel de consulta, repassados ao CRLV
    // para preenchimento cirúrgico de TODOS os dados reais puxados da placa.
    situacao: buscar('situacao', 'situação'),
    uf: buscar('uf', 'ufJurisdicao', 'uf_jurisdicao'),
    municipio: buscar('municipio', 'cidade', 'descricaoMunicipioEmplacamento', 'descricao_municipio_emplacamento'),
    endereco: buscar('endereco', 'endereço'),
    cep: buscar('cep'),
    bairro: buscar('bairro'),
    potencia: potencia,
    cilindradas: cilindradas,
    tipoPessoa: buscar('tipoPessoa', 'descricaoTipoProprietario', 'descricao_tipo_proprietario'),
    documento: buscar('documento', 'cpf', 'cnpj', 'numeroIdentificacaoProprietario'),
    dataEmissao: buscar('dataEmissao', 'dataEmissão', 'dataEmissaoCrv', 'data_emissao_crv'),
    restricao: restricao,
    // Campos adicionais do template Uber (número do CRV, código de segurança
    // do CLA e placa anterior/UF), preenchidos com os dados reais puxados
    // no painel de consulta de placa.
    numeroCrv: buscar('numeroCrv', 'crv', 'numeroDoCrv', 'numero_do_crv'),
    codigoSeguranca: buscar('codigoSeguranca', 'codigoDeSeguranca', 'cla', 'codigoSegurancaCla', 'codigo_de_seguranca'),
    placaAnteriorUf: buscar('placaAnteriorUf', 'placaAnterior', 'placaAnteriorUF', 'placa_anterior_uf'),
    // ===== DADOS ADICIONAIS PUXADOS DA PLACA (IPVA, licenciamento, etc.) =====
    // Garante que TODAS as informações retornadas pela consulta sejam
    // preservadas no objeto normalizado, para preenchimento completo do CRLV.
    marca: marca,
    modelo: modelo,
    ano: buscar('ano', 'anoFabricacao'),
    especie: especie,
    tipo: tipo,
    ipva: buscar('ipva'),
    ipvaValor: buscar('ipvaValor', 'ipva_valor'),
    ipvaSituacao: buscar('ipvaSituacao', 'ipva_situacao'),
    licenciamento: buscar('licenciamento'),
    licenciamentoSituacao: buscar('licenciamentoSituacao', 'licenciamento_situacao'),
    dataLicenciamento: buscar('dataLicenciamento', 'data_licenciamento'),
    proprietario: buscar('proprietario', 'proprietário', 'nomeProprietario', 'nome_proprietario'),
    cpf: buscar('cpf', 'numeroIdentificacaoProprietario'),
    cnpj: buscar('cnpj'),
    cidade: buscar('cidade', 'descricaoMunicipioEmplacamento'),
    restricoes: buscar('restricoes', 'restrições'),
    indicador: buscar('indicador'),
    alerta: buscar('alerta'),
    rouboFurto: buscar('rouboFurto', 'indicadorRouboFurto', 'indicador_roubo_furto'),
    sinistro: buscar('sinistro'),
    multas: buscar('multas'),
    bloqueio: buscar('bloqueio'),
    importado: buscar('importado'),
    origem: buscar('origem'),
    faturamento: buscar('faturamento'),
    notaFiscal: buscar('notaFiscal', 'nota_fiscal'),
    valor: buscar('valor'),
    dataImportacao: buscar('dataImportacao', 'data_importacao')
  };
}

// Gera um documento CRLV (imprimível) com os dados REAIS do veículo retornados
// pela API. Abre o modal para o usuário escolher o formato (Uber ou 99) e então
// renderiza uma visualização HTML que reproduz o CRLV oficial 100% via HTML/CSS
// (templateCRLV.js): o texto é desenhado DENTRO das caixas de CSS (display:flex,
// border, padding), sem imagem ou PDF externo, eliminando qualquer desalinhamento.
// O botão "Baixar PDF" envia os dados para /api/gerar-crlv-pdf, que usa o MESMO
// template HTML e imprime em A4 com o Puppeteer (preview idêntico ao PDF baixado).
// NENHUM dado fictício é preenchido: apenas os campos reais.
function veicdbGerarCrlv(veiculo, placa) {
  const v = veiculo || {};
  const p = String(placa || v.placa || '').toUpperCase();

  // ===== MODAL DE SELEÇÃO DE MODELO (UBER / 99) =====
  const overlay = document.createElement('div');
  overlay.id = 'crlvModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;max-width:480px;width:100%;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <span style="font-size:28px;">📄</span>
        <h3 style="margin:0;font-size:20px;font-weight:800;">Gerar Documento</h3>
      </div>
      <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;line-height:1.5;">
        Selecione o formato do documento para a placa <strong style="color:#1a73e8;letter-spacing:2px;">${cmsEscapeHtml(p)}</strong>.
        O documento será exibido em uma visualização HTML e você poderá baixá-lo como PDF pelo navegador.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <button id="crlvBtnUber" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 12px;border:2px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;transition:all 0.2s;font-family:inherit;">
          <span style="font-size:32px;">🚗</span>
          <span style="font-size:16px;font-weight:800;color:#000;">UBER</span>
          <span style="font-size:12px;color:#6b7280;">Formato Uber</span>
        </button>
        <button id="crlvBtn99" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 12px;border:2px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;transition:all 0.2s;font-family:inherit;">
          <span style="font-size:32px;">🚕</span>
          <span style="font-size:16px;font-weight:800;color:#000;">99</span>
          <span style="font-size:12px;color:#6b7280;">Formato 99</span>
        </button>
      </div>
      <button id="crlvBtnClose" style="width:100%;padding:12px;border:none;border-radius:8px;background:#f3f4f6;color:#6b7280;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>
    </div>
    <style>
      #crlvBtnUber:hover, #crlvBtn99:hover { border-color:#1a73e8; background:#f0f7ff; transform:translateY(-2px); }
    </style>
  `;

  document.body.appendChild(overlay);

  const fechar = () => {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };

  overlay.querySelector('#crlvBtnClose').addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

  // ===== RENDERIZAÇÃO DO CRLV EM HTML + WINDOW.PRINT =====
  // Abre uma visualização HTML limpa reproduzindo o layout do CRLV, injeta os
  // dados reais da API nos campos textuais e oferece o botão "Baixar PDF" que
  // executa window.print() com CSS @media print otimizado para A4.
  const abrirVisualizacao = (modelo) => {
    // Normaliza e injeta TODOS os dados da API (Renavam, Placa, Exercício,
    // Ano Fabr., Ano Modelo, Chassi, Marca/Modelo, Cor, Combustível,
    // Espécie/Tipo, Categoria, Nome, CPF/CNPJ, Local, Data). Nenhum campo
    // mapeado fica em branco.
    const d = veicdbNormalizarParaCrlv(v, p);

    const esc = (val) => cmsEscapeHtml(val || '');
    const modeloLabel = (modelo === 'uber') ? 'UBER' : '99';
    const nomeArquivo = (modelo === 'uber')
      ? 'CRLV_' + p + '.pdf'
      : 'CRLV_' + p + '_' + modeloLabel + '.pdf';

    // Janela de visualização (overlay em tela cheia) com o documento A4.
    const view = document.createElement('div');
    view.id = 'crlvPrintView';
    view.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.92);z-index:99998;display:flex;flex-direction:column;align-items:center;padding:24px;overflow:auto;';

    view.innerHTML = `
      <style>
        /* ===== CSS DA VISUALIZAÇÃO (TELA) ===== */
        #crlvPrintView .crlv-toolbar {
          width: 100%; max-width: 820px; display: flex; align-items: center;
          justify-content: space-between; gap: 12px; margin-bottom: 16px;
          flex-wrap: wrap;
        }
        #crlvPrintView .crlv-toolbar-title {
          color: #fff; font-family: Arial, Helvetica, sans-serif;
          font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
        }
        #crlvPrintView .crlv-toolbar-actions { display: flex; gap: 10px; }
        #crlvPrintView .crlv-btn {
          font-family: Arial, Helvetica, sans-serif; font-size: 14px;
          font-weight: 700; border: none; border-radius: 8px; padding: 10px 18px;
          cursor: pointer; transition: all 0.2s;
        }
        #crlvPrintView .crlv-btn-print {
          background: #1a73e8; color: #fff;
        }
        #crlvPrintView .crlv-btn-print:hover { background: #1557b0; }
        #crlvPrintView .crlv-btn-close {
          background: rgba(255,255,255,0.15); color: #fff;
        }
        #crlvPrintView .crlv-btn-close:hover { background: rgba(255,255,255,0.25); }

        /* Folha A4 — exibe o documento CRLV 100% gerado por HTML/CSS
           (templateCRLV.js). O texto é desenhado DENTRO das caixas de CSS
           (display:flex, border, padding), sem imagem ou PDF externo — zero
           desalinhamento. O conteúdo (.crlv-doc) é injetado via JS. */
        #crlvPrintView .crlv-sheet {
          width: 210mm; height: 297mm; background: #fff; color: #000;
          font-family: Arial, Helvetica, sans-serif; margin: 0 auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          box-sizing: border-box; position: relative; overflow: hidden;
        }
        /* O documento .crlv-doc (do templateCRLV.js) preenche a folha A4. */
        #crlvPrintView .crlv-sheet .crlv-doc {
          width: 210mm; height: 297mm;
        }

        /* ===== CSS DE IMPRESSÃO (A4) ===== */
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          #crlvPrintView, #crlvPrintView * { visibility: visible !important; }
          #crlvPrintView {
            position: absolute !important; inset: 0 !important;
            padding: 0 !important; margin: 0 !important; background: #fff !important;
            overflow: visible !important; display: block !important;
          }
          #crlvPrintView .crlv-toolbar { display: none !important; }
          #crlvPrintView .crlv-sheet {
            width: 210mm !important; height: 297mm !important;
            margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; border: none !important;
            overflow: hidden !important;
          }
          #crlvPrintView .crlv-sheet .crlv-doc {
            width: 210mm !important; height: 297mm !important;
            margin: 0 !important;
          }
        }
      </style>

      <div class="crlv-toolbar">
        <div class="crlv-toolbar-title">📄 CRLV ${modeloLabel} · Placa ${esc(p)}</div>
        <div class="crlv-toolbar-actions">
          <button class="crlv-btn crlv-btn-print" id="crlvBtnPrint">⬇ Baixar PDF</button>
          <button class="crlv-btn crlv-btn-close" id="crlvBtnViewClose">✕ Fechar</button>
        </div>
      </div>

      <div class="crlv-sheet" id="crlvSheet">
        <!-- O CRLV é renderizado 100% via HTML/CSS pelo templateCRLV.js — o
             MESMO código usado na geração do PDF no servidor, garantindo que o
             preview seja idêntico ao arquivo baixado. O conteúdo (<style> +
             corpo .crlv-doc) é injetado via JS logo após a montagem da janela. -->
      </div>
    `;

    document.body.appendChild(view);

    // Injeta o documento CRLV gerado 100% via HTML/CSS (templateCRLV.js).
    // Usa o MESMO gerador do backend (gerarCrlvHtml com fragmento:true), então
    // o preview no navegador é idêntico ao PDF baixado via /api/gerar-crlv-pdf.
    const sheetEl = view.querySelector('#crlvSheet');
    if (sheetEl) {
      if (window.CRLVTemplate && typeof window.CRLVTemplate.gerarCrlvHtml === 'function') {
        sheetEl.innerHTML = window.CRLVTemplate.gerarCrlvHtml(d, modelo, { fragmento: true });
      } else {
        sheetEl.innerHTML =
          '<div style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#900;">' +
          'Erro: templateCRLV.js não foi carregado. Recarregue a página e tente novamente.</div>';
      }
    }

    // Botão "Baixar PDF" -> gera o PDF via Puppeteer (HTML-to-PDF) no backend.
    // Envia os dados normalizados do veículo para a rota /api/gerar-crlv-pdf,
    // recebe o PDF como blob e força o download. Garante 100% de precisão visual.
    const btnPrint = view.querySelector('#crlvBtnPrint');
    if (btnPrint) {
      btnPrint.addEventListener('click', async () => {
        const textoOriginal = btnPrint.textContent;
        btnPrint.textContent = '⏳ Gerando PDF...';
        btnPrint.disabled = true;
        try {
          const resp = await fetch('/api/gerar-crlv-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ veiculo: d, placa: p, modelo: modelo })
          });
          if (!resp.ok) {
            let msg = 'Erro ao gerar o PDF (' + resp.status + ').';
            try {
              const j = await resp.json();
              if (j && j.erro) msg = j.erro;
            } catch (e) { /* corpo não é JSON */ }
            throw new Error(msg);
          }
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = nomeArquivo;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        } catch (e) {
          console.error('[CRLV] ❌ Erro ao baixar o PDF:', e);
          alert('Não foi possível gerar o PDF: ' + (e && e.message ? e.message : 'erro desconhecido.'));
        } finally {
          btnPrint.textContent = textoOriginal;
          btnPrint.disabled = false;
        }
      });
    }

    // Botão fechar
    const btnClose = view.querySelector('#crlvBtnViewClose');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (view && view.parentNode) view.parentNode.removeChild(view);
      });
    }

    // Fecha o modal de seleção ao abrir a visualização
    fechar();
  };

  overlay.querySelector('#crlvBtnUber').addEventListener('click', () => abrirVisualizacao('uber'));
  overlay.querySelector('#crlvBtn99').addEventListener('click', () => abrirVisualizacao('99'));
}

/* ===== PLANOS E VENDAS (SINCRONIZAÇÃO COM O ADMIN) ===== */

const PLANS_STORAGE_KEY = 'FredContas_MasterPlanos';
const SIDEBAR_MENU_KEY = 'FredContas_SidebarMenu';

// Cores alternadas para os ícones dos planos
const PLAN_ICON_COLORS = ['cyan', 'pink', 'green', 'orange'];

// Carrega os planos do localStorage (com fallback seguro)
function plansLoad() {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.warn('[Planos] Falha ao ler planos no painel do usuário.', e);
  }
  return null;
}

// Renderiza a vitrine de planos no dashboard
function renderPlansVitrine() {
  const container = document.getElementById('plansVitrine');
  if (!container) return;

  const plans = plansLoad();
  if (!plans) return; // Sem dados -> mantém a vitrine vazia

  container.innerHTML = plans.map((p, index) => {
    const color = PLAN_ICON_COLORS[index % PLAN_ICON_COLORS.length];
    const featured = p.featured ? 'featured' : '';
    const price = (typeof p.price === 'number' && !isNaN(p.price))
      ? p.price.toFixed(2).replace('.', ',')
      : '0,00';
    const features = Array.isArray(p.features) && p.features.length > 0
      ? p.features
      : (p.desc ? p.desc.split(',').map(f => f.trim()).filter(Boolean) : []);

    return `
      <article class="plan-vitrine-card ${featured}">
        <div class="plan-vitrine-glow"></div>
        <div class="plan-vitrine-head">
          <div class="plan-vitrine-icon ${color}"><i class="fas fa-crown"></i></div>
          ${featured ? '<span class="plan-vitrine-badge">DESTAQUE</span>' : ''}
        </div>
        <h3 class="plan-vitrine-name">${cmsEscapeHtml(p.name || 'Plano')}</h3>
        <div class="plan-vitrine-price">
          <span class="plan-vitrine-currency">R$</span>
          <span class="plan-vitrine-value">${price}</span>
          <span class="plan-vitrine-period">/${p.period || 'mês'}</span>
        </div>
        <ul class="plan-vitrine-features">
          ${features.map(f => `<li><i class="fas fa-check"></i> ${cmsEscapeHtml(f)}</li>`).join('')}
        </ul>
        <button class="plan-vitrine-btn" data-plan-assinar="${cmsEscapeAttr(p.id)}">Assinar Plano</button>
      </article>
    `;
  }).join('');

  // Vincula os listeners dos botões de assinatura
  bindPlanSubscribeButtons();
}

// Vincula os listeners dos botões de assinar plano
function bindPlanSubscribeButtons() {
  document.querySelectorAll('.plan-vitrine-btn[data-plan-assinar]').forEach(btn => {
    if (btn.dataset.planBound) return;
    btn.dataset.planBound = 'true';
    btn.addEventListener('click', () => {
      openLoadingModal('config-perfil');
      setTimeout(() => {
        showToast('Plano Selecionado', 'Solicitação de assinatura enviada com sucesso!');
      }, CONFIG.modalDuration + 400);
    });
  });
}

/* ===== MENU LATERAL DINÂMICO (SINCRONIZAÇÃO COM O ADMIN) ===== */

// Carrega os itens do menu lateral do localStorage
function sidebarLoadItems() {
  try {
    const raw = localStorage.getItem(SIDEBAR_MENU_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.warn('[Sidebar] Falha ao ler menu lateral no painel do usuário.', e);
  }
  return null;
}

// Renderiza os itens do menu lateral (nativos + dinâmicos) a partir de
// FredContas_SidebarMenu. O admin controla nome, ícone e ordem de TODOS os itens.
function renderDynamicSidebar() {
  const container = document.getElementById('dynamicSidebarNav');
  if (!container) return;

  // Menu principal do usuário: exibe somente "Novidades" e "Dashboard".
  // Toda criação feita no painel admin entra nas CATEGORIAS do painel do
  // usuário (renderCmsSidebarCategories), nunca no menu principal.
  const mainItems = [
    { id: 'novidades', name: 'Novidades', icon: 'fa-bell', ref: 'novidades' },
    { id: 'dashboard', name: 'Dashboard', icon: 'fa-gauge-high', ref: 'dashboard' }
  ];

  // Renderiza o menu principal (somente Novidades e Dashboard)
  container.innerHTML = mainItems.map(item => `
    <a href="#" class="nav-item" data-tab="${cmsEscapeAttr(item.id)}">
      <i class="fas ${cmsEscapeAttr(item.icon || 'fa-circle')}"></i>
      <span>${cmsEscapeHtml(item.name || item.ref || item.id)}</span>
    </a>
  `).join('');

  // Remove o item de configurações do rodapé (não deve aparecer no menu do usuário)
  const configContainer = document.getElementById('dynamicConfigNav');
  if (configContainer) {
    configContainer.innerHTML = '';
  }

  // Vincula os listeners de navegação dos itens
  bindDynamicSidebarNav();
}

// Vincula os listeners de navegação dos itens dinâmicos da sidebar
function bindDynamicSidebarNav() {
  document.querySelectorAll('#dynamicSidebarNav .nav-item[data-tab]').forEach(item => {
    if (item.dataset.sidebarBound) return;
    item.dataset.sidebarBound = 'true';
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });
  document.querySelectorAll('#dynamicConfigNav .nav-item[data-tab]').forEach(item => {
    if (item.dataset.sidebarBound) return;
    item.dataset.sidebarBound = 'true';
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });
}

/* ============================================================
   CATEGORIAS REATIVAS DO CMS NA SIDEBAR (SINCRONIZAÇÃO REATIVA)
   Injeta as categorias de FredContas_MasterModules na sidebar,
   logo abaixo de "Geradores". Ao clicar, filtra a vitrine para
   exibir somente os serviços da categoria selecionada.
   ============================================================ */

// Categoria atualmente selecionada na sidebar (null = nenhuma)
let activeCmsCategory = null;

// Ícone padrão para categorias do CMS (fallback elegante)
function cmsCategoryIcon(cat) {
  // Se a categoria tiver ícone próprio, usa; senão, mapeia por nome
  if (cat.icone) return cat.icone;
  const norm = cmsNormalize(cat.nome || '');
  if (norm.includes('check') || norm.includes('consulta') || norm.includes('verifica')) return 'fas fa-shield-halved';
  if (norm.includes('facial') || norm.includes('foto') || norm.includes('imagem')) return 'fas fa-face-smile';
  if (norm.includes('gerador') || norm.includes('gera')) return 'fas fa-wand-magic-sparkles';
  if (norm.includes('ferramenta') || norm.includes('utilit') || norm.includes('editor')) return 'fas fa-toolbox';
  if (norm.includes('config') || norm.includes('perfil')) return 'fas fa-gear';
  return 'fas fa-layer-group';
}

// Localiza (ou cria programaticamente, de forma segura) o container de
// injeção das categorias do CMS na sidebar. O container é ancorado logo
// abaixo do menu principal (dynamicSidebarNav) dentro do .sidebar-nav.
function cmsEnsureSidebarContainer() {
  let container = document.getElementById('dynamicCmsNav');
  if (container) return container;

  // Container não existe no HTML -> cria programaticamente de forma segura.
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return null;

  container = document.createElement('div');
  container.id = 'dynamicCmsNav';
  // Insere após o menu principal dinâmico, se existir; senão, no fim do nav.
  const mainNav = document.getElementById('dynamicSidebarNav');
  if (mainNav && mainNav.nextSibling) {
    nav.insertBefore(container, mainNav.nextSibling);
  } else {
    nav.appendChild(container);
  }
  return container;
}

// Renderiza as categorias do CMS na sidebar, abaixo de "Geradores"
function renderCmsSidebarCategories() {
  const container = cmsEnsureSidebarContainer();
  if (!container) return;

  const modules = cmsLoadModules();
  const cats = (modules && Array.isArray(modules.categorias)) ? modules.categorias : [];

  // Filtra categorias com pelo menos um serviço ativo
  const visibleCats = cats.filter(cat =>
    (cat.servicos || []).some(s => s.status !== 'inativo')
  );

  // Garante que cada categoria seja ÚNICA (remove duplicatas por id e por nome)
  const seenIds = new Set();
  const seenNames = new Set();
  const uniqueCats = visibleCats.filter(cat => {
    const idKey = cat.id != null ? String(cat.id) : '';
    const nameKey = cmsNormalize(cat.nome || '');
    if (idKey && seenIds.has(idKey)) return false;
    if (nameKey && seenNames.has(nameKey)) return false;
    if (idKey) seenIds.add(idKey);
    if (nameKey) seenNames.add(nameKey);
    return true;
  });

  // LIMPA o contêiner do menu lateral explicitamente antes de popular
  container.innerHTML = '';

  if (uniqueCats.length === 0) {
    return;
  }

  // Renderiza um rótulo de seção + os itens de categoria
  container.innerHTML =
    '<span class="nav-label cms-nav-label">CATEGORIAS</span>' +
    uniqueCats.map(cat => {
      const icon = cmsCategoryIcon(cat);
      const active = activeCmsCategory === cat.id ? ' active' : '';
      return `
        <a href="#" class="nav-item cms-cat-item${active}" data-cat="${cmsEscapeAttr(cat.id)}">
          <i class="${cmsEscapeAttr(icon)}"></i>
          <span>${cmsEscapeHtml(cat.nome || 'Categoria')}</span>
        </a>
      `;
    }).join('');

  bindCmsSidebarNav();
}

// Vincula os listeners de clique dos itens de categoria da sidebar
function bindCmsSidebarNav() {
  document.querySelectorAll('#dynamicCmsNav .cms-cat-item[data-cat]').forEach(item => {
    if (item.dataset.cmsCatBound) return;
    item.dataset.cmsCatBound = 'true';
    item.addEventListener('click', (e) => {
      e.preventDefault();
      renderCategoryTab(item.dataset.cat);
    });
  });
}

// Exibe a vitrine filtrada para uma categoria específica do CMS
function renderCategoryTab(catId) {
  // Se a viewport interna de ferramentas estiver aberta, fecha ao navegar
  if (toolViewportActive) {
    closeToolViewport();
  }

  const modules = cmsLoadModules();
  const cat = modules && Array.isArray(modules.categorias)
    ? modules.categorias.find(c => c.id === catId)
    : null;

  if (!cat) {
    // Categoria não encontrada (foi removida) -> volta ao dashboard
    activeCmsCategory = null;
    renderCmsSidebarCategories();
    switchTab('dashboard');
    return;
  }

  activeCmsCategory = catId;

  // Atualiza o estado ativo na sidebar (categoria selecionada)
  document.querySelectorAll('#dynamicCmsNav .cms-cat-item').forEach(item => {
    item.classList.toggle('active', item.dataset.cat === catId);
  });

  // Limpa o estado ativo dos itens nativos do menu
  dom.navItems.forEach(item => item.classList.remove('active'));
  document.querySelectorAll('#dynamicSidebarNav .nav-item[data-tab]').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelectorAll('#dynamicConfigNav .nav-item[data-tab]').forEach(item => {
    item.classList.remove('active');
  });

  // Preenche a seção de categoria com os serviços da categoria
  const titleEl = document.getElementById('categoriaTitle');
  const subtitleEl = document.getElementById('categoriaSubtitle');
  const contentEl = document.getElementById('categoriaContent');
  if (titleEl) titleEl.textContent = cat.nome || 'Categoria';
  if (subtitleEl) subtitleEl.textContent = 'Serviços desta categoria';

  const servicos = (cat.servicos || []).filter(s => s.status !== 'inativo');
  if (contentEl) {
    if (servicos.length === 0) {
      contentEl.innerHTML = `
        <div class="cms-cat-empty">
          <i class="fas fa-box-open"></i>
          <p>Nenhum serviço disponível nesta categoria.</p>
        </div>`;
    } else {
      contentEl.innerHTML = `
        <div class="section-title cms-cat-title">
          <h2><i class="${cmsEscapeAttr(cmsCategoryIcon(cat))}"></i> ${cmsEscapeHtml(cat.nome)}</h2>
        </div>
        <div class="services-grid cms-grid">
          ${servicos.map((srv, si) => cmsBuildServiceCard(srv, si)).join('')}
        </div>`;
    }
  }

  // Ativa a seção de categoria e desativa as demais
  dom.tabSections.forEach(section => {
    section.classList.toggle('active', section.id === 'tab-categoria');
  });

  currentTab = 'categoria';
  document.getElementById('mainContent').scrollTop = 0;

  // Re-vincula os listeners dos novos botões de serviço
  bindCmsServiceButtons();
}

/* ===== MODAL DE NOVIDADES (WELCOME) ===== */
// Exibe o modal de novidades uma única vez por sessão (sessionStorage).
function initWelcomeModal() {
  const modal = document.getElementById('welcome-modal');
  if (!modal) return;

  const flag = 'espaco_uber_welcome_seen';
  if (sessionStorage.getItem(flag)) return; // já exibido nesta sessão

  // Mostra o modal após um pequeno atraso para não atrapalhar o carregamento
  setTimeout(() => {
    modal.classList.add('open');
    sessionStorage.setItem(flag, '1');
  }, 600);
}

// Fecha o modal de novidades
function closeWelcomeModal() {
  const modal = document.getElementById('welcome-modal');
  if (modal) modal.classList.remove('open');
}

// Vincula os botões "Ir direto" dos cards de destaque premium.
function bindPremiumCards() {
  document.querySelectorAll('.premium-card[data-open], .btn-premium[data-open]').forEach(el => {
    if (el.dataset.premiumBound) return;
    el.dataset.premiumBound = 'true';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleServiceOpen(el.dataset.open);
    });
  });
}

/* ===== EVENT LISTENERS ===== */

// Navegação da sidebar
dom.navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

// Botões de serviço - abrem modal de carregamento (ou viewport interna)
dom.serviceButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleServiceOpen(btn.dataset.open);
  });
});

// Clique em card de serviço também abre modal (ou viewport interna)
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    const btn = card.querySelector('.btn-service');
    if (btn) {
      handleServiceOpen(btn.dataset.open);
    }
  });
});

// Fechar modal ao clicar fora
dom.modal.addEventListener('click', (e) => {
  if (e.target === dom.modal) {
    closeLoadingModal();
  }
});

// Botão Renovar Plano
if (dom.btnRenovar) {
  dom.btnRenovar.addEventListener('click', () => {
    openLoadingModal('config-perfil');
    setTimeout(() => {
      showToast('Plano Renovado', 'Seu plano mensal foi renovado com sucesso!');
      if (dom.tempoRestante) {
        dom.tempoRestante.textContent = '30 dias';
      }
    }, CONFIG.modalDuration + 400);
  });
}

// Botão Sair - redireciona para a página de login
if (dom.btnLogout) {
  dom.btnLogout.addEventListener('click', () => {
    openLoadingModal('config-seguranca');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, CONFIG.modalDuration + 400);
  });
}

// Botão "Entendido" do modal de novidades
const btnWelcomeClose = document.getElementById('btnWelcomeClose');
if (btnWelcomeClose) {
  btnWelcomeClose.addEventListener('click', closeWelcomeModal);
}

// Fechar modal de novidades ao clicar no overlay
const welcomeModal = document.getElementById('welcome-modal');
if (welcomeModal) {
  welcomeModal.addEventListener('click', (e) => {
    if (e.target === welcomeModal) closeWelcomeModal();
  });
}

/* ===== TECLADO ===== */
document.addEventListener('keydown', (e) => {
  // ESC fecha o modal
  if (e.key === 'Escape' && dom.modal.classList.contains('active')) {
    closeLoadingModal();
  }
});

/* ===== INICIALIZAÇÃO ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Aplica as configurações vindas do painel admin (nome, features, manutenção)
  applyConfig();

  // Renderiza os serviços/categorias vindos do CMS do admin (se houver)
  renderCmsModules();

  // Renderiza a vitrine de planos e o menu lateral dinâmico (sincronizados com o admin)
  renderPlansVitrine();
  renderDynamicSidebar();

  // Injeta as categorias do CMS na sidebar (abaixo de "Geradores")
  renderCmsSidebarCategories();

  // Vincula os botões "Ir direto" dos cards de destaque premium
  bindPremiumCards();

  // Exibe o modal de novidades (uma vez por sessão)
  initWelcomeModal();

  // Garante que o dashboard está ativo ao carregar
  switchTab('dashboard');

  // Saudação dinâmica baseada na hora do dia
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const h1 = document.querySelector('.header-title h1');
  if (h1) {
    h1.innerHTML = `${greeting}, <span class="highlight-pink">FREDÃO</span> 👋`;
  }

  // Aplica o layout dinâmico (CMS White-Label) definido pelo Admin
  loadDynamicLayout();

  // Reage a mudanças de configuração feitas no painel admin (em outra aba)
  if (typeof ConfigStore !== 'undefined') {
    ConfigStore.onChange(applyConfig);
  }

  // ===== REATIVIDADE EM TEMPO REAL DO CMS (CATEGORIAS E SIDEBAR) =====
  // 1) Evento 'storage': dispara quando OUTRA aba altera o localStorage.
  // 2) Evento customizado 'fred-modules-updated': disparado pelo painel admin
  //    na MESMA aba, garantindo atualização instantânea sem refresh manual.
  function refreshCmsReactive() {
    renderCmsModules();
    renderCmsSidebarCategories();
    // Se uma categoria estava aberta e foi renomeada/removida, re-renderiza
    if (activeCmsCategory) {
      renderCategoryTab(activeCmsCategory);
    }
  }

  window.addEventListener('storage', (e) => {
    if (e.key === CMS_STORAGE_KEY) {
      refreshCmsReactive();
    }
  });

  window.addEventListener('fred-modules-updated', () => {
    refreshCmsReactive();
  });

  // POLLING OTIMIZADO: verifica se o valor bruto do localStorage mudou
  // (operação barata, sem JSON.parse). Só faz o parse quando detecta mudança.
  // Garante que o painel do cliente SEMPRE reflita as mudanças do admin,
  // mesmo na mesma aba ou se o evento 'storage' não disparar.
  let lastRawConfig = localStorage.getItem(ConfigStore.STORAGE_KEY);
  let lastRawLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
  let lastRawCms = localStorage.getItem(CMS_STORAGE_KEY);
  let lastRawPlans = localStorage.getItem(PLANS_STORAGE_KEY);
  let lastRawSidebar = localStorage.getItem(SIDEBAR_MENU_KEY);
  setInterval(() => {
    if (typeof ConfigStore === 'undefined') return;
    const raw = localStorage.getItem(ConfigStore.STORAGE_KEY);
    if (raw !== lastRawConfig) {
      lastRawConfig = raw;
      applyConfig();
    }
    // Polling do layout do CMS (userPanelConfig)
    const rawLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (rawLayout !== lastRawLayout) {
      lastRawLayout = rawLayout;
      loadDynamicLayout();
    }
    // Polling do catálogo de serviços (FredContas_MasterModules)
    const rawCms = localStorage.getItem(CMS_STORAGE_KEY);
    if (rawCms !== lastRawCms) {
      lastRawCms = rawCms;
      renderCmsModules();
      renderCmsSidebarCategories();
      // Se uma categoria estava aberta, re-renderiza o filtro ativo
      if (activeCmsCategory) {
        renderCategoryTab(activeCmsCategory);
      }
    }
    // Polling da vitrine de planos (FredContas_MasterPlanos)
    const rawPlans = localStorage.getItem(PLANS_STORAGE_KEY);
    if (rawPlans !== lastRawPlans) {
      lastRawPlans = rawPlans;
      renderPlansVitrine();
    }
    // Polling do menu lateral dinâmico (FredContas_SidebarMenu)
    const rawSidebar = localStorage.getItem(SIDEBAR_MENU_KEY);
    if (rawSidebar !== lastRawSidebar) {
      lastRawSidebar = rawSidebar;
      renderDynamicSidebar();
    }
  }, 2000);

  console.log('%c🚀 Espaço Uber Painel inicializado com sucesso!', 'color: #00f2fe; font-size: 14px; font-weight: bold;');
});

/* ============================================================
   CONSULTA LOSDADOS (CPF, CNH, TELEFONE, PLACA) — PROXY LOCAL
   ============================================================
   Serviços de consulta de dados (CPF, CNH, Telefone e Placa) via
   proxy server-to-server (api_losdados_controller.js). A API Key
   é injetada pelo servidor, eliminando erros de CORS. Este bloco
   é totalmente isolado e não interfere nos demais serviços.
   ============================================================ */

// Mapa de tipos de consulta LosDados -> configuração da interface.
// Cada tipo define o rótulo, o placeholder, o ícone e o parâmetro
// enviado ao proxy (/api/losdados/consulta?tipo=...&documento=...).
const LOSDADOS_TIPOS = {
  'consulta-cpf': {
    tipo: 'cpf',
    titulo: 'Consulta por CPF',
    descricao: 'Digite o CPF (apenas números) para consultar dados reais na base da LosDados.',
    placeholder: 'Ex.: 12345678901',
    icone: 'fas fa-id-card',
    maxlength: 11
  },
  'consulta-cnh': {
    tipo: 'cnh',
    titulo: 'Consulta por CNH',
    descricao: 'Digite o CPF do condutor para consultar os dados da CNH na base da LosDados.',
    placeholder: 'Ex.: 12345678901',
    icone: 'fas fa-id-badge',
    maxlength: 11
  },
  'consulta-telefone': {
    tipo: 'telefone',
    titulo: 'Consulta por Telefone',
    descricao: 'Digite o número de telefone (com DDD) para consultar dados na base da LosDados.',
    placeholder: 'Ex.: 11999999999',
    icone: 'fas fa-phone',
    maxlength: 13
  },
  'consulta-placa-losdados': {
    tipo: 'placa',
    titulo: 'Consulta por Placa',
    descricao: 'Digite a placa do veículo (formato Mercosul: ABC1D23 ou antigo: ABC-1234) para consultar dados na base da LosDados.',
    placeholder: 'Ex.: ABC1D23',
    icone: 'fas fa-car',
    maxlength: 8
  }
};

// Identifica o tipo de consulta LosDados a partir da chave do serviço.
// Retorna o objeto de configuração (LOSDADOS_TIPOS) ou um fallback genérico.
function losdadosTipoPorChave(serviceKey) {
  const key = String(serviceKey || '').toLowerCase();
  const normalized = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (LOSDADOS_TIPOS[normalized]) return LOSDADOS_TIPOS[normalized];
  // Fallback: tenta detectar pelo nome do serviço no CMS
  const srv = cmsFindServiceByKey(serviceKey);
  if (srv) {
    const nomeNorm = cmsNormalize(srv.nome);
    if (nomeNorm.includes('cnh')) return LOSDADOS_TIPOS['consulta-cnh'];
    if (nomeNorm.includes('telefone')) return LOSDADOS_TIPOS['consulta-telefone'];
    if (nomeNorm.includes('placa')) return LOSDADOS_TIPOS['consulta-placa-losdados'];
    if (nomeNorm.includes('cpf')) return LOSDADOS_TIPOS['consulta-cpf'];
  }
  return LOSDADOS_TIPOS['consulta-cpf'];
}

// Monta a interface da viewport de consulta LosDados.
function buildConsultaLosDadosTemplate(serviceKey) {
  const cfg = losdadosTipoPorChave(serviceKey);
  const nome = (serviceKey || cfg.titulo)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return `
    <section class="tool-viewport" id="toolViewport">
      <header class="tool-viewport-header">
        <button class="tool-back-btn" id="toolBackBtn" title="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Voltar
        </button>
        <div class="tool-viewport-title">
          <h1><i class="${cfg.icone}"></i> ${cmsEscapeHtml(nome)}</h1>
          <p>${cmsEscapeHtml(cfg.descricao)}</p>
        </div>
        <span class="tool-status-badge"><i class="fas fa-bolt"></i> ONLINE</span>
      </header>

      <div class="tool-panel active" id="toolPanel-consulta">
        <div class="tool-card">
          <div class="tool-card-title">
            <i class="${cfg.icone}"></i>
            <h3>${cmsEscapeHtml(cfg.titulo)}</h3>
          </div>
          <p class="tool-card-desc">${cmsEscapeHtml(cfg.descricao)}</p>

          <div class="consulta-input-wrap">
            <i class="${cfg.icone}"></i>
            <input type="text" id="losdadosConsultaInput" class="gerador-input" maxlength="${cfg.maxlength}" placeholder="${cmsEscapeHtml(cfg.placeholder)}" autocomplete="off" />
          </div>
          <div class="tool-action-area">
            <button class="tool-action-btn" id="btnConsultarLosDados">
              <i class="fas fa-search"></i> CONSULTAR
            </button>
            <span class="tool-action-price">Consulta via LosDados</span>
          </div>
        </div>

        <!-- Resultado da consulta -->
        <div class="consulta-result" id="losdadosResult" hidden>
          <div class="tool-results-header">
            <span><i class="fas fa-check-circle"></i> Informações Encontradas</span>
            <span class="tool-confidence-tag" id="losdadosTag"></span>
          </div>
          <div class="consulta-card" id="losdadosCard"></div>
        </div>
      </div>
    </section>
  `;
}

// Executa a consulta LosDados via proxy local (server.js).
async function executarConsultaLosDados() {
  const input = document.getElementById('losdadosConsultaInput');
  const resultEl = document.getElementById('losdadosResult');
  const cardEl = document.getElementById('losdadosCard');
  const tagEl = document.getElementById('losdadosTag');
  if (!input || !resultEl || !cardEl) return;

  const documento = (input.value || '').trim();
  if (!documento) {
    showToast('Dado obrigatório', 'Digite o documento para consultar.');
    return;
  }

  // Determina o tipo de consulta a partir da chave do serviço LosDados
  // que abriu a viewport (cpf/cnh/telefone/placa).
  const cfg = losdadosTipoPorChave(toolViewportLosDadosKey);
  const tipo = cfg.tipo;

  resultEl.hidden = false;
  if (tagEl) tagEl.textContent = `${cfg.titulo}: ${documento}`;
  cardEl.innerHTML = `
    <div class="consulta-loading">
      <i class="fas fa-spinner fa-spin"></i> Carregando... consultando na base da LosDados.
    </div>
  `;

  const urlApi = `${API_BASE}/api/losdados/consulta?tipo=${encodeURIComponent(tipo)}&documento=${encodeURIComponent(documento)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  let dados;
  try {
    const resp = await fetch(urlApi, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    // Trata erros HTTP retornados pelo proxy.
    if (!resp.ok) {
      let erroMsg = 'Falha na consulta (HTTP ' + resp.status + ').';
      let limiteAtingido = false;
      try {
        const errBody = await resp.json();
        if (errBody && errBody.erro) erroMsg = errBody.erro;
        if (errBody && errBody.limiteAtingido) limiteAtingido = true;
        // Atualiza o medidor com o saldo retornado (mesmo em bloqueio).
        if (errBody && errBody.saldo) consultaMeterRender(errBody.saldo);
      } catch (e) { /* corpo não-JSON */ }
      cardEl.innerHTML = `
        <div class="consulta-notfound">
          <i class="fas ${limiteAtingido ? 'fa-ban' : 'fa-exclamation-triangle'}"></i>
          <p>${limiteAtingido ? 'Limite de consultas esgotado' : 'Falha na consulta'}</p>
          <span>${cmsEscapeHtml(erroMsg)}</span>
        </div>
      `;
      showToast(limiteAtingido ? 'Limite esgotado' : 'Falha na consulta', erroMsg);
      return;
    }

    dados = await resp.json();
  } catch (e) {
    clearTimeout(timeout);
    const isAbort = (e && e.name === 'AbortError');
    const isCors = (e && (e.name === 'TypeError' || /cors|network|failed to fetch/i.test(String(e && e.message))));
    const msg = isAbort
      ? 'Tempo esgotado ao consultar a LosDados. Tente novamente.'
      : (isCors
          ? 'Falha de rede/CORS ao consultar a LosDados. Verifique se o servidor local (server.js) está rodando na porta 3000.'
          : 'Erro ao consultar a LosDados: ' + (e && e.message ? e.message : 'erro desconhecido.'));
    cardEl.innerHTML = `
      <div class="consulta-notfound">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Falha na consulta</p>
        <span>${cmsEscapeHtml(msg)}</span>
      </div>
    `;
    showToast('Falha na consulta', msg);
    return;
  }

  // Trata "não encontrado" (proxy converte 404 em HTTP 200 com notFound:true).
  if (!dados || typeof dados !== 'object' || dados.notFound === true) {
    cardEl.innerHTML = `
      <div class="consulta-notfound">
        <i class="fas fa-search-minus"></i>
        <p>Não encontrado</p>
        <span>Registro não encontrado na base da LosDados.</span>
      </div>
    `;
    showToast('Não encontrado', 'Registro não encontrado na base da LosDados.');
    return;
  }

  // Atualiza o medidor de consultas em tempo real com o saldo retornado
  // pelo servidor (injetado após a dedução da consulta bem-sucedida).
  if (dados && dados.saldo) {
    consultaMeterRender(dados.saldo);
  } else {
    // Fallback: busca o saldo atualizado no servidor.
    consultaMeterAtualizar();
  }

  // Renderiza os dados retornados em formato de planilha.
  const secoesHtml = losdadosMontarSecoes(dados, cfg, documento);
  cardEl.innerHTML = `
    <div class="consulta-actions">
      <button class="tool-action-btn consulta-copy-btn" id="btnCopiarDadosLosDados" type="button">
        <i class="fas fa-copy"></i> COPIAR
      </button>
    </div>
    ${secoesHtml}
  `;

  // Botão "Copiar": copia o conteúdo completo para a área de transferência.
  const copyBtn = document.getElementById('btnCopiarDadosLosDados');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const partes = [];
      const linhas = cardEl.querySelectorAll('.consulta-table tr');
      linhas.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 2) partes.push(`${cells[0].textContent}: ${cells[1].textContent}`);
      });
      const ok = veicdbCopiarTexto(partes.join('\n'));
      showToast(
        ok ? 'Dados copiados' : 'Falha ao copiar',
        ok ? 'Todos os dados foram copiados para a área de transferência.'
           : 'Não foi possível copiar os dados automaticamente.'
      );
    });
  }

  showToast('Consulta concluída', `Dados recuperados da LosDados (${cfg.titulo}).`);
}

// Converte o objeto de resposta da LosDados em seções estilo planilha.
// Percorre dinamicamente o objeto, ignorando campos vazios/indefinidos e
// formatando rótulos legíveis (ex.: "nomeCompleto" -> "Nome Completo").
function losdadosMontarSecoes(dados, cfg, documento) {
  const secoes = [];
  const ignorar = new Set(['ok', 'success', 'message', 'status', 'notFound', 'erro']);

  // Extrai o objeto principal de dados (aceita variações de nomenclatura).
  let obj = dados;
  if (dados && typeof dados === 'object') {
    if (dados.data && typeof dados.data === 'object' && !Array.isArray(dados.data)) obj = dados.data;
    else if (dados.result && typeof dados.result === 'object' && !Array.isArray(dados.result)) obj = dados.result;
    else if (dados.dados && typeof dados.dados === 'object' && !Array.isArray(dados.dados)) obj = dados.dados;
  }

  const linhas = [];
  const mono = new Set(['cpf', 'cnh', 'placa', 'telefone', 'renavam', 'chassi', 'numero']);

  const percorrer = (o, prefixo) => {
    if (!o || typeof o !== 'object') return;
    for (const [chave, valor] of Object.entries(o)) {
      if (ignorar.has(String(chave).toLowerCase())) continue;
      if (valor === null || valor === undefined || valor === '') continue;
      if (typeof valor === 'object') {
        // Objetos aninhados são achatados com prefixo no rótulo.
        percorrer(valor, prefixo ? prefixo + ' ' + chave : chave);
        continue;
      }
      const label = losdadosFormatarRotulo(prefixo ? prefixo + ' ' + chave : chave);
      linhas.push({
        label: label,
        valor: String(valor),
        mono: mono.has(String(chave).toLowerCase())
      });
    }
  };
  percorrer(obj, '');

  if (linhas.length > 0) {
    secoes.push({
      titulo: cfg.titulo,
      icone: cfg.icone,
      linhas: linhas
    });
  }

  // Se nada foi extraído, mostra o JSON bruto como fallback.
  if (secoes.length === 0) {
    secoes.push({
      titulo: 'Dados retornados',
      icone: 'fas fa-database',
      linhas: [{ label: 'Resposta', valor: JSON.stringify(dados), mono: true }]
    });
  }

  return secoes.map(sec => {
    if (!sec.linhas || sec.linhas.length === 0) return '';
    const linhasHtml = sec.linhas.map(l => `
      <tr>
        <td class="consulta-th">${cmsEscapeHtml(l.label)}</td>
        <td class="${l.mono ? 'mono' : ''}">${cmsEscapeHtml(l.valor)}</td>
      </tr>
    `).join('');
    return `
      <div class="consulta-secao">
        <div class="consulta-secao-titulo"><i class="${sec.icone}"></i> ${cmsEscapeHtml(sec.titulo)}</div>
        <div class="consulta-table-wrap">
          <table class="consulta-table">
            <tbody>${linhasHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

// Formata um rótulo legível a partir de uma chave camelCase/snake_case.
// Ex.: "nomeCompleto" -> "Nome Completo", "data_nascimento" -> "Data Nascimento".
function losdadosFormatarRotulo(chave) {
  return String(chave || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/* ============================================================
   MEDIDOR DINÂMICO DE CONSULTAS (RODAPÉ DO CLIENTE)
   Exibe a barra de progresso do saldo individual e o texto
   "Você ainda pode realizar X consultas no seu plano.",
   atualizando instantaneamente após cada consulta (sem F5).
   ============================================================ */

// Identifica o usuário logado no painel do cliente.
// Usa o nome salvo em userPanelConfig (texts.userName), com fallback
// para o usuário padrão 'FREDÃO'. Também aceita ?usuario= na URL.
function consultaMeterUsuarioAtual() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUser = urlParams.get('usuario');
    if (urlUser) return urlUser.trim();

    const config = loadLayoutConfig();
    if (config && config.texts && config.texts.userName) {
      return String(config.texts.userName).trim();
    }
  } catch (e) { /* ignora */ }
  return 'FREDÃO';
}

// Renderiza o medidor com base no saldo recebido do servidor.
function consultaMeterRender(saldo) {
  const footer = document.getElementById('consultaMeterFooter');
  const fill = document.getElementById('consultaMeterFill');
  const text = document.getElementById('consultaMeterText');
  const badge = document.getElementById('consultaMeterBadge');
  if (!footer || !fill || !text) return;

  const permitidas = Number(saldo && saldo.consultas_permitidas) || 0;
  const realizadas = Number(saldo && saldo.consultas_realizadas) || 0;
  const restantes = Number(saldo && saldo.consultas_restantes) || 0;

  // Percentual consumido (barra de progresso).
  const pct = permitidas > 0 ? Math.min(100, Math.max(0, (realizadas / permitidas) * 100)) : 0;
  fill.style.width = pct + '%';

  // Texto dinâmico exato solicitado.
  text.textContent = `Você ainda pode realizar ${restantes} consultas no seu plano.`;

  if (badge) {
    badge.textContent = restantes <= 0 ? 'Esgotado' : `${restantes} restantes`;
    badge.classList.toggle('esgotado', restantes <= 0);
  }

  footer.hidden = false;
}

// Carrega o saldo em tempo real do usuário logado e renderiza o medidor.
async function consultaMeterCarregar() {
  const footer = document.getElementById('consultaMeterFooter');
  if (!footer) return;

  const usuario = consultaMeterUsuarioAtual();
  try {
    const resp = await fetch(API_BASE + '/api/losdados/saldo?usuario=' + encodeURIComponent(usuario), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    const data = await resp.json();
    if (data && data.ok && data.saldo) {
      consultaMeterRender(data.saldo);
    } else {
      // Usuário não encontrado no servidor: esconde o medidor.
      footer.hidden = true;
    }
  } catch (e) {
    // Servidor offline: esconde o medidor silenciosamente.
    footer.hidden = true;
  }
}

// Atualiza o medidor (chamado após cada consulta bem-sucedida).
function consultaMeterAtualizar() {
  consultaMeterCarregar();
}

// Inicializa o medidor ao carregar a página.
document.addEventListener('DOMContentLoaded', () => {
  consultaMeterCarregar();
});
