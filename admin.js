/* ============================================================
   ESPAÇO UBER - PAINEL DE ADMINISTRAÇÃO
   Lógica, Dados Simulados e Interações
   ============================================================ */

'use strict';

/* ===== DADOS SIMULADOS ===== */
const DATA = {
  users: [
    { id: 1, name: 'FREDÃO', email: 'fredao@email.com', plan: 'Mensal', status: 'active', lastAccess: 'Agora', color: 'cyan' },
    { id: 2, name: 'Maria Silva', email: 'maria@email.com', plan: 'Anual', status: 'active', lastAccess: '5 min atrás', color: 'pink' },
    { id: 3, name: 'João Santos', email: 'joao@email.com', plan: 'Mensal', status: 'inactive', lastAccess: '2 horas atrás', color: 'green' },
    { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', plan: 'Semanal', status: 'active', lastAccess: '30 min atrás', color: 'orange' },
    { id: 5, name: 'Carlos Lima', email: 'carlos@email.com', plan: 'Mensal', status: 'suspended', lastAccess: '1 dia atrás', color: 'cyan' },
    { id: 6, name: 'Beatriz Costa', email: 'bia@email.com', plan: 'Anual', status: 'active', lastAccess: '10 min atrás', color: 'pink' },
    { id: 7, name: 'Pedro Alves', email: 'pedro@email.com', plan: 'Mensal', status: 'pending', lastAccess: 'Nunca', color: 'green' },
    { id: 8, name: 'Lucas Pereira', email: 'lucas@email.com', plan: 'Semanal', status: 'active', lastAccess: '1 hora atrás', color: 'orange' }
  ],

  plans: [
    {
      id: 1,
      name: 'Básico',
      price: 29.90,
      period: 'mês',
      desc: 'Para motoristas que estão começando.',
      features: ['1 plataforma', 'Suporte por email', 'Atualizações mensais'],
      status: 'active',
      icon: 'cyan',
      featured: false
    },
    {
      id: 2,
      name: 'Pro',
      price: 59.90,
      period: 'mês',
      desc: 'Para motoristas profissionais.',
      features: ['3 plataformas', 'Suporte prioritário', 'Análise de rotas', 'Relatórios avançados'],
      status: 'active',
      icon: 'pink',
      featured: true
    },
    {
      id: 3,
      name: 'Premium',
      price: 99.90,
      period: 'mês',
      desc: 'Para motoristas que buscam o máximo.',
      features: ['Todas as plataformas', 'Suporte 24/7', 'Facial AI', 'Geradores ilimitados', 'Consultas avançadas'],
      status: 'active',
      icon: 'green',
      featured: false
    }
  ],

  transactions: [
    { id: 'TXN-001', user: 'FREDÃO', type: 'pagamento', value: 59.90, date: '2026-08-16', status: 'active' },
    { id: 'TXN-002', user: 'Maria Silva', type: 'renovacao', value: 99.90, date: '2026-08-16', status: 'active' },
    { id: 'TXN-003', user: 'João Santos', type: 'pagamento', value: 29.90, date: '2026-08-15', status: 'active' },
    { id: 'TXN-004', user: 'Ana Oliveira', type: 'reembolso', value: 29.90, date: '2026-08-15', status: 'pending' },
    { id: 'TXN-005', user: 'Carlos Lima', type: 'pagamento', value: 59.90, date: '2026-08-14', status: 'active' },
    { id: 'TXN-006', user: 'Beatriz Costa', type: 'renovacao', value: 99.90, date: '2026-08-14', status: 'active' },
    { id: 'TXN-007', user: 'Pedro Alves', type: 'pagamento', value: 29.90, date: '2026-08-13', status: 'pending' },
    { id: 'TXN-008', user: 'Lucas Pereira', type: 'renovacao', value: 59.90, date: '2026-08-13', status: 'active' }
  ],

  logs: [
    { time: '03:15:22', level: 'info', message: 'Usuário FREDÃO fez login no sistema' },
    { time: '03:12:45', level: 'info', message: 'Plano Pro renovado para Maria Silva' },
    { time: '03:08:10', level: 'warn', message: 'Tentativa de login suspeita para Carlos Lima' },
    { time: '02:55:33', level: 'info', message: 'Backup automático concluído com sucesso' },
    { time: '02:48:01', level: 'error', message: 'Falha na conexão com o gateway de pagamento' },
    { time: '02:30:19', level: 'info', message: 'Novo usuário registrado: Pedro Alves' },
    { time: '02:15:47', level: 'warn', message: 'Uso de CPU acima de 80% detectado' },
    { time: '02:00:00', level: 'info', message: 'Sistema iniciado com sucesso' }
  ],

  activities: [
    { icon: 'cyan', text: 'Novo usuário registrado', time: '5 min atrás' },
    { icon: 'pink', text: 'Plano Pro renovado', time: '12 min atrás' },
    { icon: 'green', text: 'Pagamento confirmado', time: '25 min atrás' },
    { icon: 'orange', text: 'Alerta de segurança', time: '1 hora atrás' },
    { icon: 'cyan', text: 'Backup concluído', time: '2 horas atrás' }
  ],

  sessions: [
    { device: 'Chrome - Windows', location: 'São Paulo, BR', current: true, icon: 'cyan' },
    { device: 'Safari - iPhone', location: 'São Paulo, BR', current: false, icon: 'green' },
    { device: 'Firefox - Linux', location: 'Rio de Janeiro, BR', current: false, icon: 'orange' }
  ],

  chartData: [
    { label: 'Seg', value: 5200 },
    { label: 'Ter', value: 6800 },
    { label: 'Qua', value: 6100 },
    { label: 'Qui', value: 7500 },
    { label: 'Sex', value: 8900 },
    { label: 'Sáb', value: 7200 },
    { label: 'Dom', value: 6400 }
  ]
};

/* ===== DOM REFERENCES ===== */
const dom = {
  navItems: document.querySelectorAll('.nav-item[data-tab]'),
  tabSections: document.querySelectorAll('.tab-section'),
  userCount: document.getElementById('userCount'),
  statUsers: document.getElementById('statUsers'),
  statPlans: document.getElementById('statPlans'),
  statRevenue: document.getElementById('statRevenue'),
  statAlerts: document.getElementById('statAlerts'),
  chartBars: document.getElementById('chartBars'),
  activityList: document.getElementById('activityList'),
  usersTableBody: document.getElementById('usersTableBody'),
  userSearch: document.getElementById('userSearch'),
  plansGrid: document.getElementById('plansGrid'),
  transactionsTableBody: document.getElementById('transactionsTableBody'),
  logList: document.getElementById('logList'),
  sessionList: document.getElementById('sessionList'),
  btnRefresh: document.getElementById('btnRefresh'),
  btnLogout: document.getElementById('btnLogout'),
  btnAddUser: document.getElementById('btnAddUser'),
  btnAddPlan: document.getElementById('btnAddPlan'),
  btnSaveAllPlans: document.getElementById('btnSaveAllPlans'),
  btnSaveAllUsers: document.getElementById('btnSaveAllUsers'),
  btnClearLogs: document.getElementById('btnClearLogs'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  sidebarMenuEditor: document.getElementById('sidebarMenuEditor'),
  newSidebarName: document.getElementById('newSidebarName'),
  newSidebarIcon: document.getElementById('newSidebarIcon'),
  newSidebarRef: document.getElementById('newSidebarRef'),
  btnAddSidebarItem: document.getElementById('btnAddSidebarItem'),
  btnSaveSidebarMenu: document.getElementById('btnSaveSidebarMenu'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose'),
  toast: document.getElementById('toast'),
  toastTitle: document.getElementById('toastTitle'),
  toastMessage: document.getElementById('toastMessage')
};

/* ===== ESTADO ===== */
let currentTab = 'dashboard';
let toastTimer = null;

/* ===== NAVEGAÇÃO SPA ===== */
function switchTab(tabName) {
  if (tabName === currentTab) return;

  dom.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  dom.tabSections.forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tabName}`);
  });

  currentTab = tabName;
  document.getElementById('mainContent').scrollTop = 0;
}

/* ===== TOAST ===== */
function showToast(title, message) {
  dom.toastTitle.textContent = title;
  dom.toastMessage.textContent = message;
  dom.toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 3200);
}

/* ===== MODAL ===== */
function openModal(title, content) {
  dom.modalTitle.textContent = title;
  dom.modalBody.innerHTML = content;
  dom.modal.classList.add('active');
}

function closeModal() {
  dom.modal.classList.remove('active');
}

/* ===== RENDERIZAÇÃO ===== */

// Renderiza o gráfico de receita
function renderChart() {
  const max = Math.max(...DATA.chartData.map(d => d.value));
  dom.chartBars.innerHTML = DATA.chartData.map(d => {
    const height = (d.value / max) * 100;
    return `
      <div class="chart-bar">
        <span class="chart-bar-value">R$ ${(d.value / 1000).toFixed(1)}k</span>
        <div class="chart-bar-fill" style="height: ${height}%"></div>
        <span class="chart-bar-label">${d.label}</span>
      </div>
    `;
  }).join('');
}

// Renderiza a lista de atividades
function renderActivities() {
  dom.activityList.innerHTML = DATA.activities.map(a => `
    <div class="activity-item">
      <div class="activity-icon ${a.icon}"><i class="fas fa-circle"></i></div>
      <div class="activity-info">
        <span class="activity-text">${a.text}</span>
        <span class="activity-time">${a.time}</span>
      </div>
    </div>
  `).join('');
}

// Renderiza a tabela de usuários
function renderUsers(filter = '') {
  const filtered = DATA.users.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  dom.userCount.textContent = DATA.users.length;

  dom.usersTableBody.innerHTML = filtered.map(u => {
    const statusLabels = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso',
      pending: 'Pendente'
    };
    return `
      <tr>
        <td>
          <div class="table-user">
            <div class="table-avatar ${u.color}">${u.name.charAt(0)}</div>
            <div>
              <div class="table-user-name">${u.name}</div>
              <div class="table-user-email">${u.email}</div>
            </div>
          </div>
        </td>
        <td>${u.email}</td>
        <td>${u.plan}</td>
        <td><span class="status-pill ${u.status}">${statusLabels[u.status]}</span></td>
        <td>${u.lastAccess}</td>
        <td>
          <div class="table-actions">
            <button class="table-action-btn" title="Editar" data-action="edit" data-id="${u.id}"><i class="fas fa-pen"></i></button>
            <button class="table-action-btn" title="Suspender" data-action="suspend" data-id="${u.id}"><i class="fas fa-ban"></i></button>
            <button class="table-action-btn danger" title="Excluir" data-action="delete" data-id="${u.id}"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Renderiza os planos
function renderPlans() {
  dom.plansGrid.innerHTML = DATA.plans.map(p => `
    <div class="plan-card ${p.featured ? 'featured' : ''}" data-plan-id="${p.id}">
      <div class="plan-card-head">
        <div class="plan-icon ${p.icon}"><i class="fas fa-crown"></i></div>
        <span class="plan-status ${p.status}">${p.status === 'active' ? 'Ativo' : 'Inativo'}</span>
      </div>
      <div class="plan-input-row">
        <label>Nome do Plano</label>
        <input type="text" class="plan-input plan-input-name" value="${p.name}" data-field="name">
      </div>
      <div class="plan-input-row">
        <label>Preço (R$/mês)</label>
        <input type="number" class="plan-input plan-input-price" value="${p.price}" step="0.01" min="0" data-field="price">
      </div>
      <div class="plan-input-row">
        <label>Benefícios (separados por vírgula)</label>
        <input type="text" class="plan-input plan-input-features" value="${p.features.join(', ')}" data-field="features">
      </div>
      <div class="plan-actions">
        <button class="plan-btn delete" data-action="delete-plan" data-id="${p.id}"><i class="fas fa-trash"></i> Excluir</button>
      </div>
      <div class="plan-sync-hint">
        <i class="fas fa-cloud-arrow-up"></i> Use "Salvar e Sincronizar" para aplicar as alterações
      </div>
    </div>
  `).join('');
}

/* ===== CHAVES DE STORAGE (SINCRONIZAÇÃO COM O PAINEL DO USUÁRIO) ===== */
const PLANS_STORAGE_KEY = 'FredContas_MasterPlanos';
const SIDEBAR_MENU_KEY = 'FredContas_SidebarMenu';
const USERS_STORAGE_KEY = 'FredContas_Clientes';

/* ===== PLANOS: PERSISTÊNCIA EM localStorage ===== */

// Salva os planos no localStorage para refletir no painel do usuário
function persistPlans() {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(DATA.plans));
    return true;
  } catch (err) {
    console.error('Erro ao salvar planos:', err);
    return false;
  }
}

// Carrega os planos do localStorage (mesclando com os padrões)
function loadPlans() {
  try {
    const stored = localStorage.getItem(PLANS_STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      DATA.plans = parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar planos:', err);
  }
}

/* ===== CLIENTES/LOGINS: PERSISTÊNCIA EM localStorage ===== */

// Salva os clientes/logins no localStorage para refletir no painel do usuário
function persistUsers() {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DATA.users));
    return true;
  } catch (err) {
    console.error('Erro ao salvar clientes:', err);
    return false;
  }
}

// Carrega os clientes/logins do localStorage (mesclando com os padrões)
function loadUsers() {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      DATA.users = parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar clientes:', err);
  }
}

/* ===== GESTÃO DO MENU LATERAL ===== */

// Itens padrão do menu lateral (usados como fallback)
const DEFAULT_SIDEBAR_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: 'fa-gauge-high', ref: 'dashboard' },
  { id: 'checkers', name: 'Checkers', icon: 'fa-shield-halved', ref: 'checkers' },
  { id: 'facial', name: 'Facial AI', icon: 'fa-face-smile', ref: 'facial' },
  { id: 'geradores', name: 'Geradores', icon: 'fa-bolt', ref: 'geradores' },
  { id: 'configuracoes', name: 'Configurações', icon: 'fa-gear', ref: 'configuracoes' }
];

// Carrega os itens do menu lateral do localStorage
function loadSidebarItems() {
  try {
    const stored = localStorage.getItem(SIDEBAR_MENU_KEY);
    if (!stored) return [...DEFAULT_SIDEBAR_ITEMS];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [...DEFAULT_SIDEBAR_ITEMS];
  } catch (err) {
    console.warn('Erro ao carregar menu lateral:', err);
    return [...DEFAULT_SIDEBAR_ITEMS];
  }
}

// Salva os itens do menu lateral no localStorage
function persistSidebarItems(items) {
  try {
    localStorage.setItem(SIDEBAR_MENU_KEY, JSON.stringify(items));
    return true;
  } catch (err) {
    console.error('Erro ao salvar menu lateral:', err);
    return false;
  }
}

// Renderiza os itens do menu lateral no editor
function renderSidebarEditor() {
  if (!dom.sidebarMenuEditor) return;
  const items = loadSidebarItems();
  dom.sidebarMenuEditor.innerHTML = items.map((item, index) => `
    <div class="sidebar-menu-item" data-sidebar-id="${item.id}">
      <div class="sidebar-menu-index">${index + 1}</div>
      <div class="sidebar-menu-fields">
        <input type="text" class="sidebar-menu-name" value="${item.name}" placeholder="Nome da Aba">
        <input type="text" class="sidebar-menu-icon" value="${item.icon}" placeholder="Ícone (fa-...)">
        <input type="text" class="sidebar-menu-ref" value="${item.ref}" placeholder="ID de referência">
      </div>
      <div class="sidebar-menu-actions">
        <button class="plan-btn delete" data-action="delete-sidebar" data-id="${item.id}" title="Excluir"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

// Renderiza as transações
function renderTransactions(filter = 'all') {
  const filtered = filter === 'all'
    ? DATA.transactions
    : DATA.transactions.filter(t => t.type === filter);

  const typeLabels = {
    pagamento: 'Pagamento',
    renovacao: 'Renovação',
    reembolso: 'Reembolso'
  };

  const statusLabels = {
    active: 'Confirmado',
    pending: 'Pendente'
  };

  dom.transactionsTableBody.innerHTML = filtered.map(t => `
    <tr>
      <td>${t.id}</td>
      <td>${t.user}</td>
      <td>${typeLabels[t.type]}</td>
      <td>R$ ${t.value.toFixed(2).replace('.', ',')}</td>
      <td>${t.date}</td>
      <td><span class="status-pill ${t.status}">${statusLabels[t.status]}</span></td>
    </tr>
  `).join('');
}

// Renderiza os logs
function renderLogs(filter = 'all') {
  const filtered = filter === 'all'
    ? DATA.logs
    : DATA.logs.filter(l => l.level === filter);

  dom.logList.innerHTML = filtered.map(l => `
    <div class="log-entry">
      <span class="log-time">${l.time}</span>
      <span class="log-level ${l.level}">${l.level}</span>
      <span class="log-message">${l.message}</span>
    </div>
  `).join('');
}

// Renderiza as sessões
function renderSessions() {
  if (!dom.sessionList) return;
  dom.sessionList.innerHTML = DATA.sessions.map(s => `
    <div class="session-item">
      <div class="session-icon ${s.icon}"><i class="fas fa-desktop"></i></div>
      <div class="session-info">
        <span class="session-device">${s.device}</span>
        <span class="session-meta">${s.location}</span>
      </div>
      ${s.current ? '<span class="session-current">ATUAL</span>' : ''}
    </div>
  `).join('');
}

/* ===== MODAIS DE FORMULÁRIO ===== */

// Modal de novo usuário
function openUserModal() {
  // Popula o dropdown de planos com os planos cadastrados
  const planOptions = DATA.plans.length
    ? DATA.plans.map(p => `<option value="${p.name}">${p.name}</option>`).join('')
    : '<option value="Mensal">Mensal</option><option value="Anual">Anual</option>';

  openModal('Novo Cliente', `
    <form class="modal-form" id="userForm">
      <div class="modal-field">
        <label>Nome</label>
        <input type="text" id="newUserName" placeholder="Nome do cliente" required>
      </div>
      <div class="modal-field">
        <label>Email</label>
        <input type="email" id="newUserEmail" placeholder="email@exemplo.com" required>
      </div>
      <div class="modal-field">
        <label>Senha</label>
        <input type="password" id="newUserPassword" placeholder="Senha de acesso" required>
      </div>
      <div class="modal-field">
        <label>Plano</label>
        <select id="newUserPlan">
          ${planOptions}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="modal-btn cancel" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="modal-btn confirm">Criar Cliente</button>
      </div>
    </form>
  `);

  document.getElementById('userForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value.trim();
    const plan = document.getElementById('newUserPlan').value;

    if (!name || !email || !password) {
      showToast('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    DATA.users.push({
      id: DATA.users.length + 1,
      name,
      email,
      password,
      plan,
      status: 'active',
      lastAccess: 'Agora',
      color: 'cyan'
    });

    persistUsers();
    renderUsers();
    closeModal();
    showToast('Sucesso', `Cliente ${name} criado com sucesso!`);
  });
}

// Modal de novo plano
function openPlanModal() {
  openModal('Novo Plano', `
    <form class="modal-form" id="planForm">
      <div class="modal-field">
        <label>Nome do Plano</label>
        <input type="text" id="newPlanName" placeholder="Ex: Plano VIP" required>
        <small class="modal-hint">Pacote vendido para acesso ao painel.</small>
      </div>
      <div class="modal-field">
        <label>Preço (R$)</label>
        <input type="number" id="newPlanPrice" placeholder="59.90" step="0.01" required>
      </div>
      <div class="modal-field">
        <label>Benefícios (separados por vírgula)</label>
        <input type="text" id="newPlanBenefits" placeholder="Ex: Acesso total, Suporte VIP, 10 consultas/mês" required>
        <small class="modal-hint">Separe cada benefício com vírgula.</small>
      </div>
      <div class="modal-actions">
        <button type="button" class="modal-btn cancel" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="modal-btn confirm">Criar Plano</button>
      </div>
    </form>
  `);

  document.getElementById('planForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newPlanName').value.trim();
    const price = parseFloat(document.getElementById('newPlanPrice').value);
    const benefits = document.getElementById('newPlanBenefits').value.trim();

    if (!name || !price || !benefits) {
      showToast('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    // Converte a lista separada por vírgulas em um array de benefícios
    const features = benefits.split(',').map(b => b.trim()).filter(Boolean);

    DATA.plans.push({
      id: DATA.plans.length + 1,
      name,
      price,
      period: 'mês',
      desc: features.join(', '),
      features,
      status: 'active',
      icon: 'cyan',
      featured: false
    });

    persistPlans();
    renderPlans();
    closeModal();
    showToast('Sucesso', `Plano ${name} criado com sucesso!`);
  });
}

/* ===== EVENT LISTENERS ===== */

// Navegação
dom.navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

// Links internos de painel
document.querySelectorAll('[data-tab-link]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(link.dataset.tabLink);
  });
});

// Botão atualizar
if (dom.btnRefresh) {
  dom.btnRefresh.addEventListener('click', () => {
    dom.btnRefresh.classList.add('rotating');
    setTimeout(() => {
      renderChart();
      renderActivities();
      renderUsers();
      renderPlans();
      renderTransactions();
      renderLogs();
      renderSessions();
      dom.btnRefresh.classList.remove('rotating');
      showToast('Atualizado', 'Dados do painel atualizados com sucesso!');
    }, 800);
  });
}

// Botão sair
if (dom.btnLogout) {
  dom.btnLogout.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
}

// Botão novo usuário
if (dom.btnAddUser) {
  dom.btnAddUser.addEventListener('click', openUserModal);
}

// Botão novo plano
if (dom.btnAddPlan) {
  dom.btnAddPlan.addEventListener('click', openPlanModal);
}

// Botão "Salvar e Sincronizar" global da aba Planos e Vendas
// Lê todos os inputs dos cards de plano e persiste tudo em FredContas_MasterPlanos
if (dom.btnSaveAllPlans) {
  dom.btnSaveAllPlans.addEventListener('click', () => {
    const cards = document.querySelectorAll('#plansGrid .plan-card');
    if (cards.length === 0) {
      showToast('Nada a Salvar', 'Não há planos cadastrados para sincronizar.');
      return;
    }

    let saved = 0;
    cards.forEach(card => {
      const id = parseInt(card.dataset.planId);
      const plan = DATA.plans.find(p => p.id === id);
      if (!plan) return;

      const name = card.querySelector('.plan-input-name').value.trim();
      const price = parseFloat(card.querySelector('.plan-input-price').value);
      const featuresRaw = card.querySelector('.plan-input-features').value.trim();

      if (!name || isNaN(price)) return;

      const features = featuresRaw.split(',').map(f => f.trim()).filter(Boolean);
      plan.name = name;
      plan.price = price;
      plan.features = features;
      plan.desc = features.join(', ');
      saved++;
    });

    if (saved === 0) {
      showToast('Erro', 'Preencha nome e preço de pelo menos um plano.');
      return;
    }

    const ok = persistPlans();
    renderPlans();
    showToast(
      ok ? 'Planos Sincronizados' : 'Erro ao Salvar',
      ok ? `${saved} plano(s) salvos e sincronizados com o painel do usuário.` : 'Não foi possível salvar os planos.'
    );
  });
}

// Botão "Salvar e Sincronizar" global da Gestão de Clientes
// Persiste todos os clientes/logins em FredContas_Clientes
if (dom.btnSaveAllUsers) {
  dom.btnSaveAllUsers.addEventListener('click', () => {
    if (DATA.users.length === 0) {
      showToast('Nada a Salvar', 'Não há clientes cadastrados para sincronizar.');
      return;
    }
    const ok = persistUsers();
    renderUsers(dom.userSearch.value);
    showToast(
      ok ? 'Clientes Sincronizados' : 'Erro ao Salvar',
      ok ? `${DATA.users.length} cliente(s)/login(s) salvos e sincronizados.` : 'Não foi possível salvar os clientes.'
    );
  });
}

// Busca de usuários
if (dom.userSearch) {
  dom.userSearch.addEventListener('input', (e) => {
    renderUsers(e.target.value);
  });
}

// Filtros de transações
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTransactions(btn.dataset.filter);
  });
});

// Filtros de logs
document.querySelectorAll('.log-filter').forEach(filter => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('.log-filter').forEach(f => f.classList.remove('active'));
    filter.classList.add('active');
    renderLogs(filter.dataset.level);
  });
});

// Limpar logs
if (dom.btnClearLogs) {
  dom.btnClearLogs.addEventListener('click', () => {
    DATA.logs = [];
    renderLogs();
    showToast('Logs Limpos', 'Todos os registros foram removidos.');
  });
}

// Salvar configurações - grava no localStorage para refletir no painel do cliente
if (dom.btnSaveSettings) {
  dom.btnSaveSettings.addEventListener('click', () => {
    const config = ConfigStore.load();

    // Preferências gerais
    config.systemName = document.getElementById('settingName').value.trim() || ConfigStore.DEFAULT.systemName;
    config.language = document.getElementById('settingLang').value;
    config.timezone = document.getElementById('settingTz').value;

    // Notificações
    config.notifications.email = document.getElementById('settingEmail').checked;
    config.notifications.push = document.getElementById('settingPush').checked;
    config.notifications.weeklyReport = document.getElementById('settingReport').checked;

    // Funcionalidades (se existirem)
    if (document.getElementById('settingFacialAI')) {
      config.features.showFacialAI = document.getElementById('settingFacialAI').checked;
    }
    if (document.getElementById('settingGenerators')) {
      config.features.showGenerators = document.getElementById('settingGenerators').checked;
    }
    if (document.getElementById('settingCheckers')) {
      config.features.showCheckers = document.getElementById('settingCheckers').checked;
    }
    if (document.getElementById('settingTools')) {
      config.features.showTools = document.getElementById('settingTools').checked;
    }

    // Manutenção
    if (document.getElementById('settingMaintenance')) {
      config.maintenance.enabled = document.getElementById('settingMaintenance').checked;
    }
    if (document.getElementById('settingMaintenanceMsg')) {
      config.maintenance.message = document.getElementById('settingMaintenanceMsg').value.trim() || ConfigStore.DEFAULT.maintenance.message;
    }

    // Salva no localStorage
    const saved = ConfigStore.save(config);

    if (saved) {
      showToast('Configurações Salvas', 'As alterações foram aplicadas e refletidas no painel dos clientes!');
    } else {
      showToast('Erro', 'Não foi possível salvar as configurações.');
    }
  });
}

// Carrega configurações existentes nos campos ao abrir a aba
function loadSettingsIntoForm() {
  const config = ConfigStore.load();

  if (document.getElementById('settingName')) {
    document.getElementById('settingName').value = config.systemName;
  }
  if (document.getElementById('settingLang')) {
    document.getElementById('settingLang').value = config.language;
  }
  if (document.getElementById('settingTz')) {
    document.getElementById('settingTz').value = config.timezone;
  }
  if (document.getElementById('settingEmail')) {
    document.getElementById('settingEmail').checked = config.notifications.email;
  }
  if (document.getElementById('settingPush')) {
    document.getElementById('settingPush').checked = config.notifications.push;
  }
  if (document.getElementById('settingReport')) {
    document.getElementById('settingReport').checked = config.notifications.weeklyReport;
  }
  if (document.getElementById('settingFacialAI')) {
    document.getElementById('settingFacialAI').checked = config.features.showFacialAI;
  }
  if (document.getElementById('settingGenerators')) {
    document.getElementById('settingGenerators').checked = config.features.showGenerators;
  }
  if (document.getElementById('settingCheckers')) {
    document.getElementById('settingCheckers').checked = config.features.showCheckers;
  }
  if (document.getElementById('settingTools')) {
    document.getElementById('settingTools').checked = config.features.showTools;
  }
  if (document.getElementById('settingMaintenance')) {
    document.getElementById('settingMaintenance').checked = config.maintenance.enabled;
  }
  if (document.getElementById('settingMaintenanceMsg')) {
    document.getElementById('settingMaintenanceMsg').value = config.maintenance.message;
  }
}

/* ============================================================
   CONSTRUTOR DE LAYOUT (CMS WHITE-LABEL)
   Salva a configuração de interface em 'userPanelConfig'
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

// Carrega a configuração de layout salva (ou o padrão)
function loadLayoutConfig() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    const parsed = JSON.parse(raw);
    // Merge profundo com o padrão para garantir que todos os campos existam
    return deepMergeLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)), parsed);
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
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

// Preenche o formulário do construtor com a configuração atual
function loadLayoutIntoForm() {
  const config = loadLayoutConfig();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  // Textos globais
  setVal('layoutPanelName', config.texts.panelName);
  setVal('layoutUserName', config.texts.userName);

  // Sidebar
  setVal('layoutSidebarWidth', config.sidebar.width);
  setVal('layoutTabDashboard', config.sidebar.tabs.dashboard);
  setVal('layoutTabFerramentas', config.sidebar.tabs.ferramentas);
  setVal('layoutTabCheckers', config.sidebar.tabs.checkers);
  setVal('layoutTabFacial', config.sidebar.tabs.facial);
  setVal('layoutTabGeradores', config.sidebar.tabs.geradores);
  setVal('layoutTabConfig', config.sidebar.tabs.configuracoes);

  // Painel principal
  setVal('layoutSectionServicos', config.main.sections.servicos);
  setVal('layoutSectionFerramentas', config.main.sections.ferramentas);
  setVal('layoutSectionCheckers', config.main.sections.checkers);
  setVal('layoutSectionFacial', config.main.sections.facial);
  setVal('layoutSectionGeradores', config.main.sections.geradores);
  setVal('layoutSectionConfig', config.main.sections.configuracoes);

  // Estilização
  setVal('layoutGridGap', config.style.gridGap);
  setVal('layoutRadius', config.style.radius);
  setVal('layoutAccentColor', config.style.accentColor);
  setVal('layoutAccentColorHex', config.style.accentColor);
}

// Captura os valores do formulário e salva no localStorage
function saveLayoutConfig() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const config = {
    texts: {
      panelName: getVal('layoutPanelName') || DEFAULT_LAYOUT.texts.panelName,
      userName: getVal('layoutUserName') || DEFAULT_LAYOUT.texts.userName
    },
    sidebar: {
      width: parseInt(getVal('layoutSidebarWidth'), 10) || DEFAULT_LAYOUT.sidebar.width,
      tabs: {
        dashboard: getVal('layoutTabDashboard') || DEFAULT_LAYOUT.sidebar.tabs.dashboard,
        ferramentas: getVal('layoutTabFerramentas') || DEFAULT_LAYOUT.sidebar.tabs.ferramentas,
        checkers: getVal('layoutTabCheckers') || DEFAULT_LAYOUT.sidebar.tabs.checkers,
        facial: getVal('layoutTabFacial') || DEFAULT_LAYOUT.sidebar.tabs.facial,
        geradores: getVal('layoutTabGeradores') || DEFAULT_LAYOUT.sidebar.tabs.geradores,
        configuracoes: getVal('layoutTabConfig') || DEFAULT_LAYOUT.sidebar.tabs.configuracoes
      }
    },
    main: {
      sections: {
        servicos: getVal('layoutSectionServicos') || DEFAULT_LAYOUT.main.sections.servicos,
        ferramentas: getVal('layoutSectionFerramentas') || DEFAULT_LAYOUT.main.sections.ferramentas,
        checkers: getVal('layoutSectionCheckers') || DEFAULT_LAYOUT.main.sections.checkers,
        facial: getVal('layoutSectionFacial') || DEFAULT_LAYOUT.main.sections.facial,
        geradores: getVal('layoutSectionGeradores') || DEFAULT_LAYOUT.main.sections.geradores,
        configuracoes: getVal('layoutSectionConfig') || DEFAULT_LAYOUT.main.sections.configuracoes
      }
    },
    style: {
      gridGap: parseInt(getVal('layoutGridGap'), 10) || DEFAULT_LAYOUT.style.gridGap,
      radius: parseInt(getVal('layoutRadius'), 10) || DEFAULT_LAYOUT.style.radius,
      accentColor: getVal('layoutAccentColorHex') || getVal('layoutAccentColor') || DEFAULT_LAYOUT.style.accentColor
    }
  };

  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    return false;
  }
}

// Restaura o layout padrão
function resetLayoutConfig() {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    loadLayoutIntoForm();
    return true;
  } catch (e) {
    return false;
  }
}

// Botão salvar layout
if (document.getElementById('btnSaveLayout')) {
  document.getElementById('btnSaveLayout').addEventListener('click', () => {
    const saved = saveLayoutConfig();
    if (saved) {
      showToast('Layout Aplicado', 'O layout foi salvo e aplicado no painel dos clientes em tempo real!');
    } else {
      showToast('Erro', 'Não foi possível salvar o layout.');
    }
  });
}

// Botão restaurar padrão
if (document.getElementById('btnResetLayout')) {
  document.getElementById('btnResetLayout').addEventListener('click', () => {
    const reset = resetLayoutConfig();
    if (reset) {
      showToast('Layout Restaurado', 'O layout padrão foi restaurado e aplicado.');
    }
  });
}

// Sincroniza o campo hex com o color picker
if (document.getElementById('layoutAccentColor') && document.getElementById('layoutAccentColorHex')) {
  document.getElementById('layoutAccentColor').addEventListener('input', (e) => {
    document.getElementById('layoutAccentColorHex').value = e.target.value;
  });
  document.getElementById('layoutAccentColorHex').addEventListener('input', (e) => {
    const val = e.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      document.getElementById('layoutAccentColor').value = val;
    }
  });
}

// Ações da tabela de usuários (delegação)
if (dom.usersTableBody) {
  dom.usersTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);
    const user = DATA.users.find(u => u.id === id);

    if (!user) return;

    if (action === 'edit') {
      showToast('Editar', `Editando usuário ${user.name}...`);
    } else if (action === 'suspend') {
      user.status = user.status === 'suspended' ? 'active' : 'suspended';
      persistUsers();
      renderUsers(dom.userSearch.value);
      showToast('Status Atualizado', `${user.name} ${user.status === 'suspended' ? 'suspenso' : 'reativado'}.`);
    } else if (action === 'delete') {
      DATA.users = DATA.users.filter(u => u.id !== id);
      persistUsers();
      renderUsers(dom.userSearch.value);
      showToast('Usuário Removido', `${user.name} foi excluído.`);
    }
  });
}

// Ações dos planos (delegação)
if (dom.plansGrid) {
  dom.plansGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id);
    const plan = DATA.plans.find(p => p.id === id);

    if (!plan) return;

    if (action === 'save-plan') {
      // Lê os inputs diretos do card
      const card = btn.closest('.plan-card');
      const name = card.querySelector('.plan-input-name').value.trim();
      const price = parseFloat(card.querySelector('.plan-input-price').value);
      const featuresRaw = card.querySelector('.plan-input-features').value.trim();

      if (!name || isNaN(price)) {
        showToast('Erro', 'Preencha o nome e o preço do plano.');
        return;
      }

      const features = featuresRaw.split(',').map(f => f.trim()).filter(Boolean);
      plan.name = name;
      plan.price = price;
      plan.features = features;
      plan.desc = features.join(', ');
      persistPlans();
      renderPlans();
      showToast('Plano Salvo', `Plano ${plan.name} atualizado com sucesso!`);
    } else if (action === 'delete-plan') {
      DATA.plans = DATA.plans.filter(p => p.id !== id);
      persistPlans();
      renderPlans();
      showToast('Plano Removido', `Plano ${plan.name} foi excluído.`);
    }
  });
}

// Ações do editor de menu lateral (delegação)
if (dom.sidebarMenuEditor) {
  dom.sidebarMenuEditor.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const items = loadSidebarItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (action === 'save-sidebar') {
      const row = btn.closest('.sidebar-menu-item');
      const name = row.querySelector('.sidebar-menu-name').value.trim();
      const icon = row.querySelector('.sidebar-menu-icon').value.trim();
      const ref = row.querySelector('.sidebar-menu-ref').value.trim();

      if (!name || !icon || !ref) {
        showToast('Erro', 'Preencha nome, ícone e ID de referência.');
        return;
      }

      item.name = name;
      item.icon = icon;
      item.ref = ref;
      persistSidebarItems(items);
      renderSidebarEditor();
      showToast('Aba Salva', `Aba "${name}" atualizada com sucesso!`);
    } else if (action === 'delete-sidebar') {
      const updated = items.filter(i => i.id !== id);
      persistSidebarItems(updated);
      renderSidebarEditor();
      showToast('Aba Removida', `Aba "${item.name}" foi excluída.`);
    }
  });
}

// Adicionar novo item ao menu lateral
if (dom.btnAddSidebarItem) {
  dom.btnAddSidebarItem.addEventListener('click', () => {
    const name = dom.newSidebarName.value.trim();
    const icon = dom.newSidebarIcon.value.trim();
    const ref = dom.newSidebarRef.value.trim();

    if (!name || !icon || !ref) {
      showToast('Erro', 'Preencha nome, ícone e ID de referência.');
      return;
    }

    const items = loadSidebarItems();
    const newId = ref.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (items.some(i => i.id === newId)) {
      showToast('Erro', 'Já existe uma aba com esse ID de referência.');
      return;
    }

    items.push({ id: newId, name, icon, ref });
    persistSidebarItems(items);
    renderSidebarEditor();
    dom.newSidebarName.value = '';
    dom.newSidebarIcon.value = '';
    dom.newSidebarRef.value = '';
    showToast('Aba Adicionada', `Aba "${name}" adicionada ao menu lateral!`);
  });
}

// Botão "Salvar e Sincronizar Menu" do editor de menu lateral
// Lê todos os inputs do editor e persiste tudo em FredContas_SidebarMenu
if (dom.btnSaveSidebarMenu) {
  dom.btnSaveSidebarMenu.addEventListener('click', () => {
    const rows = document.querySelectorAll('#sidebarMenuEditor .sidebar-menu-item');
    if (rows.length === 0) {
      showToast('Nada a Salvar', 'Não há itens de menu para sincronizar.');
      return;
    }

    const items = loadSidebarItems();
    let saved = 0;

    rows.forEach(row => {
      const id = row.dataset.sidebarId;
      const item = items.find(i => i.id === id);
      if (!item) return;

      const name = row.querySelector('.sidebar-menu-name').value.trim();
      const icon = row.querySelector('.sidebar-menu-icon').value.trim();
      const ref = row.querySelector('.sidebar-menu-ref').value.trim();

      if (!name || !icon || !ref) return;

      item.name = name;
      item.icon = icon;
      item.ref = ref;
      saved++;
    });

    if (saved === 0) {
      showToast('Erro', 'Preencha nome, ícone e ID de referência de pelo menos um item.');
      return;
    }

    const ok = persistSidebarItems(items);
    renderSidebarEditor();
    showToast(
      ok ? 'Menu Sincronizado' : 'Erro ao Salvar',
      ok ? `${saved} item(ns) do menu salvos e sincronizados com o painel do usuário.` : 'Não foi possível salvar o menu.'
    );
  });
}

// Fechar modal
if (dom.modalClose) {
  dom.modalClose.addEventListener('click', closeModal);
}

dom.modal.addEventListener('click', (e) => {
  if (e.target === dom.modal) closeModal();
});

// Teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dom.modal.classList.contains('active')) {
    closeModal();
  }
});

/* ============================================================
   TEMPLATES: GERADOR DE CHASSI
   Gerencia as imagens base (Base64) usadas para fundir o texto
   (VIN) no gerador de chassi do painel do usuário.
   ============================================================ */

// Chave unificada de persistência permanente dos templates de imagens.
// Garante que NADA seja perdido ao desligar o computador ou reiniciar o
// navegador, pois todos os templates ficam gravados no localStorage.
const CHASSI_TEMPLATES_KEY = 'espaco_uber_templates_db';
// Chave antiga (legado) usada apenas como fallback de migração.
const CHASSI_TEMPLATES_LEGACY_KEY = 'templates_chassi';

// Carrega os templates de chassi do localStorage (com fallback seguro).
// Prioriza a chave unificada espaco_uber_templates_db e, caso não exista,
// faz fallback para a chave antiga templates_chassi (migração).
function chassiTemplatesLoad() {
  try {
    const raw = localStorage.getItem(CHASSI_TEMPLATES_KEY) || localStorage.getItem(CHASSI_TEMPLATES_LEGACY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Chassi] Falha ao ler templates.', e);
  }
  return [];
}

// Salva os templates de chassi no localStorage.
// Grava em AMBAS as chaves (unificada e antiga) para garantir persistência
// permanente e compatibilidade com versões anteriores.
function chassiTemplatesSave(templates) {
  try {
    const json = JSON.stringify(templates);
    localStorage.setItem(CHASSI_TEMPLATES_KEY, json);
    localStorage.setItem(CHASSI_TEMPLATES_LEGACY_KEY, json);
    return true;
  } catch (e) {
    console.warn('[Chassi] Falha ao salvar templates.', e);
    return false;
  }
}

// Renderiza a listagem das imagens base salvas no Admin.
function renderChassiTemplates() {
  const grid = document.getElementById('chassiTemplatesGrid');
  const countEl = document.getElementById('chassiCount');
  if (!grid) return;

  const templates = chassiTemplatesLoad();
  if (countEl) countEl.textContent = `${templates.length} template(s)`;

  if (templates.length === 0) {
    grid.innerHTML = `
      <div class="chassi-empty">
        <i class="fas fa-images"></i>
        <p>Nenhuma imagem base salva ainda. Envie uma imagem acima para começar.</p>
      </div>`;
    return;
  }

  grid.innerHTML = templates.map((tpl, idx) => `
    <div class="chassi-template-card">
      <div class="chassi-template-thumb">
        <img src="${tpl.data}" alt="Template ${idx + 1}" />
      </div>
      <div class="chassi-template-info">
        <span class="chassi-template-name">Template ${idx + 1}</span>
        <span class="chassi-template-size">${tpl.name || 'Imagem base'}</span>
      </div>
      <button class="chassi-template-delete" data-index="${idx}" title="Excluir template">
        <i class="fas fa-trash"></i> Excluir
      </button>
    </div>
  `).join('');

  // Vincula os botões de excluir
  grid.querySelectorAll('.chassi-template-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const templates = chassiTemplatesLoad();
      if (idx >= 0 && idx < templates.length) {
        templates.splice(idx, 1);
        chassiTemplatesSave(templates);
        renderChassiTemplates();
        showToast('Template excluído', 'A imagem base foi removida do banco.');
      }
    });
  });
}

// Inicializa os eventos da seção de templates de chassi.
function initChassiTemplates() {
  const fileInput = document.getElementById('chassiFileInput');
  const btnSave = document.getElementById('btnSaveChassiTemplate');
  const btnReset = document.getElementById('btnResetChassiTemplates');
  const btnExport = document.getElementById('btnChassiExportJson');
  const btnRestore = document.getElementById('btnChassiRestoreBackup');
  const restoreInput = document.getElementById('chassiRestoreInput');

  if (btnSave && fileInput) {
    btnSave.addEventListener('click', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        showToast('Selecione uma imagem', 'Escolha um arquivo de imagem antes de salvar.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Formato inválido', 'Envie apenas arquivos de imagem.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const templates = chassiTemplatesLoad();
        templates.push({ data: e.target.result, name: file.name });
        if (chassiTemplatesSave(templates)) {
          renderChassiTemplates();
          fileInput.value = '';
          showToast('Template salvo', 'Imagem base adicionada ao banco de templates.');
        } else {
          showToast('Erro ao salvar', 'Não foi possível salvar a imagem (tamanho excedido?).');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (chassiTemplatesSave([])) {
        renderChassiTemplates();
        showToast('Templates restaurados', 'O banco de imagens base foi limpo.');
      }
    });
  }

  // Exportar templates como arquivo JSON (backup manual).
  if (btnExport) {
    btnExport.addEventListener('click', chassiExportJson);
  }

  // Restaurar templates a partir de um arquivo JSON (upload).
  if (btnRestore && restoreInput) {
    btnRestore.addEventListener('click', () => restoreInput.click());
    restoreInput.addEventListener('change', chassiRestoreFromFile);
  }

  renderChassiTemplates();
}

/* ============================================================
   EXPORTAÇÃO E RESTAURAÇÃO DE TEMPLATES (BACKUP)
   Permite baixar os templates salvos como arquivo JSON e
   restaurá-los a partir de um arquivo JSON previamente baixado,
   garantindo que imagens e configurações não sejam perdidas.
   ============================================================ */

// Formata a data/hora atual para nome de arquivo (ex.: 2026-08-17_23-41).
function chassiTimestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

// Exporta os templates salvos como arquivo JSON.
function chassiExportJson() {
  const templates = chassiTemplatesLoad();
  if (templates.length === 0) {
    showToast('Sem templates', 'Não há templates salvos para exportar.');
    return;
  }
  const nome = `templates_chassi_${chassiTimestamp()}.json`;
  if (downloadFile(nome, JSON.stringify(templates, null, 2), 'application/json')) {
    showToast('Exportado', `${templates.length} template(s) exportado(s) em JSON.`);
  } else {
    showToast('Erro ao exportar', 'Não foi possível gerar o arquivo JSON.');
  }
}

// Restaura os templates a partir de um arquivo JSON selecionado pelo usuário.
function chassiRestoreFromFile(event) {
  const input = event && event.target;
  const file = input && input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      // Aceita tanto um array direto quanto um objeto { templates: [...] }.
      const templates = Array.isArray(dados) ? dados : (dados && Array.isArray(dados.templates) ? dados.templates : null);
      if (!templates) {
        showToast('Arquivo inválido', 'O arquivo JSON não contém uma lista de templates válida.');
        return;
      }
      // Valida a estrutura mínima de cada template (data em Base64 + nome).
      const validos = templates.filter(t => t && typeof t === 'object' && typeof t.data === 'string' && t.data.length > 0);
      if (validos.length === 0) {
        showToast('Arquivo inválido', 'Nenhum template válido encontrado no arquivo JSON.');
        return;
      }
      if (chassiTemplatesSave(validos)) {
        renderChassiTemplates();
        showToast('Backup restaurado', `${validos.length} template(s) restaurado(s) do arquivo.`);
      } else {
        showToast('Erro ao restaurar', 'Não foi possível salvar os templates restaurados.');
      }
    } catch (err) {
      console.warn('[Chassi] Falha ao ler arquivo de backup.', err);
      showToast('Arquivo inválido', 'Não foi possível ler o arquivo JSON de backup.');
    } finally {
      // Limpa o input para permitir selecionar o mesmo arquivo novamente.
      if (input) input.value = '';
    }
  };
  reader.readAsText(file);
}

/* ============================================================
   BACKUP MESTRE (TUDO EM UM SÓ ARQUIVO JSON)
   Exporta e restaura TODOS os dados do sistema em um único
   arquivo JSON: templates de imagens + configurações do admin.
   Garante que absolutamente NADA seja perdido, mesmo ao trocar
   de computador ou navegador.
   ============================================================ */

// Chave do backup mestre persistente (cópia de segurança unificada).
const MASTER_BACKUP_KEY = 'espaco_uber_master_backup';

// Monta o objeto completo com todos os dados do sistema.
function masterBackupColetar() {
  const dados = {
    versao: 1,
    geradoEm: new Date().toISOString(),
    templates: chassiTemplatesLoad(),
    configuracoes: null
  };
  // Configurações do admin (via ConfigStore, se disponível).
  try {
    if (typeof ConfigStore !== 'undefined' && ConfigStore.load) {
      dados.configuracoes = ConfigStore.load();
    } else {
      const raw = localStorage.getItem('espaco_uber_config');
      dados.configuracoes = raw ? JSON.parse(raw) : null;
    }
  } catch (e) {
    console.warn('[MasterBackup] Falha ao coletar configurações.', e);
    dados.configuracoes = null;
  }
  return dados;
}

// Formata a data/hora atual para nome de arquivo (ex.: 2026-08-17_23-41).
function masterBackupTimestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

// Exporta TUDO (templates + configurações) em um único JSON.
function masterBackupExportar() {
  const dados = masterBackupColetar();
  const nome = `backup_mestre_espaco_uber_${masterBackupTimestamp()}.json`;
  if (downloadFile(nome, JSON.stringify(dados, null, 2), 'application/json')) {
    const totalTemplates = Array.isArray(dados.templates) ? dados.templates.length : 0;
    showToast(
      'Backup Mestre exportado',
      `${totalTemplates} template(s) e configurações salvos em um único arquivo JSON.`
    );
  } else {
    showToast('Erro ao exportar', 'Não foi possível gerar o arquivo de backup mestre.');
  }
}

// Restaura TUDO a partir de um arquivo JSON de backup mestre.
function masterBackupRestaurar(event) {
  const input = event && event.target;
  const file = input && input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!dados || typeof dados !== 'object') {
        showToast('Arquivo inválido', 'O arquivo JSON não é um backup mestre válido.');
        return;
      }

      // 1) Restaura os templates de imagens (se presentes no backup).
      if (Array.isArray(dados.templates)) {
        chassiTemplatesSave(dados.templates);
      }

      // 2) Restaura as configurações do admin (se presentes no backup).
      if (dados.configuracoes && typeof dados.configuracoes === 'object') {
        try {
          if (typeof ConfigStore !== 'undefined' && ConfigStore.save) {
            ConfigStore.save(dados.configuracoes);
          } else {
            localStorage.setItem('espaco_uber_config', JSON.stringify(dados.configuracoes));
          }
        } catch (err) {
          console.warn('[MasterBackup] Falha ao restaurar configurações.', err);
        }
      }

      // Re-renderiza as seções afetadas.
      if (typeof renderChassiTemplates === 'function') renderChassiTemplates();
      if (typeof loadSettingsIntoForm === 'function') loadSettingsIntoForm();

      showToast(
        'Backup Mestre restaurado',
        'Templates e configurações foram restaurados com sucesso.'
      );
    } catch (err) {
      console.warn('[MasterBackup] Falha ao ler arquivo de backup mestre.', err);
      showToast('Arquivo inválido', 'Não foi possível ler o arquivo JSON de backup mestre.');
    } finally {
      // Limpa o input para permitir selecionar o mesmo arquivo novamente.
      if (input) input.value = '';
    }
  };
  reader.readAsText(file);
}

// Dispara o download de um arquivo no navegador.
function downloadFile(nomeArquivo, conteudo, tipo) {
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
    console.warn('[Download] Falha ao baixar arquivo.', e);
    return false;
  }
}

/* ===== INICIALIZAÇÃO ===== */
document.addEventListener('DOMContentLoaded', () => {
  loadPlans();
  loadUsers();
  renderChart();
  renderActivities();
  renderUsers();
  renderPlans();
  renderTransactions();
  renderLogs();
  renderSessions();
  loadSettingsIntoForm();
  loadLayoutIntoForm();
  renderSidebarEditor();
  initChassiTemplates();

  // Sincronização em tempo real: se as configurações mudarem (em outra aba
  // admin ou no painel do cliente), atualiza o formulário automaticamente.
  if (typeof ConfigStore !== 'undefined') {
    ConfigStore.onChange(() => {
      loadSettingsIntoForm();
      showToast('Configurações Sincronizadas', 'As configurações foram atualizadas em tempo real.');
    });
  }

  console.log('%c🛡️ Espaço Uber Admin Console inicializado!', 'color: #00f2fe; font-size: 14px; font-weight: bold;');
});

/* ============================================================
   DOCS UBER E 99 (GERADOR DE PDF)
   Seção do Painel Admin para upload dos templates PDF em branco
   (CRLV da Uber e da 99) e visualização das coordenadas dos campos.
   ============================================================ */

// Verifica o status dos templates (se já foram enviados)
async function docsCheckStatus() {
  try {
    const resp = await fetch('/api/template/status');
    const data = await resp.json();
    if (!data.ok) return;

    const uberCard = document.getElementById('docsStatusUber');
    const t99Card = document.getElementById('docsStatus99');

    if (uberCard) {
      const msg = uberCard.querySelector('.docs-status-msg');
      if (data.uber) {
        uberCard.classList.add('status-ok');
        uberCard.classList.remove('status-missing');
        if (msg) msg.textContent = 'Template enviado ✓';
      } else {
        uberCard.classList.add('status-missing');
        uberCard.classList.remove('status-ok');
        if (msg) msg.textContent = 'Nenhum template enviado ainda';
      }
    }

    if (t99Card) {
      const msg = t99Card.querySelector('.docs-status-msg');
      if (data['99']) {
        t99Card.classList.add('status-ok');
        t99Card.classList.remove('status-missing');
        if (msg) msg.textContent = 'Template enviado ✓';
      } else {
        t99Card.classList.add('status-missing');
        t99Card.classList.remove('status-ok');
        if (msg) msg.textContent = 'Nenhum template enviado ainda';
      }
    }
  } catch (e) {
    console.warn('[Docs] Falha ao verificar status dos templates.', e);
  }
}

// Envia o template PDF selecionado para o servidor
async function docsUploadTemplate() {
  const fileInput = document.getElementById('docsTemplateFile');
  const modeloSelect = document.getElementById('docsTemplateModelo');
  const btn = document.getElementById('btnDocsUploadTemplate');
  const feedback = document.getElementById('docsUploadFeedback');

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    if (typeof showToast === 'function') showToast('Atenção', 'Selecione um arquivo PDF para enviar.');
    else alert('Selecione um arquivo PDF para enviar.');
    return;
  }

  const file = fileInput.files[0];
  const modelo = modeloSelect ? modeloSelect.value : 'uber';

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    if (typeof showToast === 'function') showToast('Formato inválido', 'O arquivo deve ser um PDF.');
    else alert('O arquivo deve ser um PDF.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  }
  if (feedback) {
    feedback.className = 'docs-feedback';
    feedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando template ' + modelo.toUpperCase() + '...';
  }

  try {
    // Usa FormData (padrão e mais confiável para upload de arquivos)
    const formData = new FormData();
    formData.append('template', file);

    const resp = await fetch('/api/template/upload', {
      method: 'POST',
      headers: { 'X-Template-Model': modelo },
      body: formData
    });

    let data = {};
    try { data = await resp.json(); } catch (e) { data = {}; }

    if (resp.ok && data.ok) {
      if (feedback) {
        feedback.className = 'docs-feedback feedback-success';
        feedback.innerHTML = '<i class="fas fa-check-circle"></i> Template ' + modelo.toUpperCase() + ' enviado com sucesso!';
      }
      if (typeof showToast === 'function') showToast('Template Enviado', 'Template ' + modelo.toUpperCase() + ' salvo com sucesso!');
      else alert('Template ' + modelo.toUpperCase() + ' enviado com sucesso!');
      fileInput.value = '';
      docsCheckStatus();
    } else {
      const erro = data.erro || ('Erro HTTP ' + resp.status);
      if (feedback) {
        feedback.className = 'docs-feedback feedback-error';
        feedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + erro;
      }
      if (typeof showToast === 'function') showToast('Erro ao Enviar', erro);
      else alert('Erro ao enviar template: ' + erro);
    }
  } catch (e) {
    console.warn('[Docs] Falha ao enviar template.', e);
    if (feedback) {
      feedback.className = 'docs-feedback feedback-error';
      feedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> Falha de rede. Verifique se o servidor está rodando.';
    }
    if (typeof showToast === 'function') showToast('Falha de Rede', 'Não foi possível enviar o template. Verifique se o servidor está rodando.');
    else alert('Falha de rede ao enviar o template. Verifique se o servidor está rodando.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-upload"></i> Enviar Template';
    }
  }
}

// Inicializa a seção DOCS UBER E 99
function docsInit() {
  const btnUpload = document.getElementById('btnDocsUploadTemplate');
  if (btnUpload) {
    btnUpload.addEventListener('click', docsUploadTemplate);
  }

  // Verifica o status dos templates
  docsCheckStatus();
}

// Chama a inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', docsInit);
} else {
  docsInit();
}

/* ============================================================
   INTEGRAÇÃO LOSDADOS - PAINEL ADMIN
   Gestão da API Key da LosDados (salva no servidor).
   Isolado e modular: não interfere em outras funcionalidades.
   ============================================================ */
(function losdadosAdminInit() {
  const inputKey = document.getElementById('losdadosApiKey');
  const btnSave = document.getElementById('btnSaveLosdadosKey');
  const btnToggle = document.getElementById('btnToggleLosdadosKey');
  const statusEl = document.getElementById('losdadosKeyStatus');

  if (!inputKey || !btnSave) return; // elemento não existe nesta página

  function setStatus(msg, tipo) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'losdados-status' + (tipo ? ' losdados-status-' + tipo : '');
  }

  // Mostrar/ocultar a chave
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      const isPassword = inputKey.type === 'password';
      inputKey.type = isPassword ? 'text' : 'password';
      btnToggle.innerHTML = isPassword
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });
  }

  // Carrega a chave salva (mascarada) ao abrir a página
  async function carregarChave() {
    try {
      const resp = await fetch('/api/losdados/key', { cache: 'no-store' });
      const data = await resp.json();
      if (data && data.ok && data.hasKey) {
        // Preenche com um placeholder indicando que já existe chave salva
        inputKey.placeholder = '•••••••••••• (chave salva)';
        setStatus('Chave já configurada no servidor.', 'ok');
      } else {
        inputKey.placeholder = 'Cole aqui a sua API Key da LosDados';
      }
    } catch (e) {
      // Servidor pode não estar rodando; mantém placeholder padrão
      inputKey.placeholder = 'Cole aqui a sua API Key da LosDados';
    }
  }

  // Salva a chave no servidor
  btnSave.addEventListener('click', async () => {
    const chave = inputKey.value.trim();
    if (!chave) {
      setStatus('Informe a API Key antes de salvar.', 'error');
      return;
    }
    btnSave.disabled = true;
    setStatus('Salvando...', '');
    try {
      const resp = await fetch('/api/losdados/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: chave })
      });
      const data = await resp.json();
      if (data && data.ok) {
        inputKey.value = '';
        inputKey.placeholder = '•••••••••••• (chave salva)';
        setStatus('API Key da LosDados salva com sucesso!', 'ok');
        if (typeof showToast === 'function') showToast('LosDados', 'API Key salva com sucesso!');
      } else {
        setStatus((data && data.erro) || 'Erro ao salvar a chave.', 'error');
      }
    } catch (e) {
      setStatus('Falha de rede. Verifique se o servidor está rodando.', 'error');
    } finally {
      btnSave.disabled = false;
    }
  });

  carregarChave();
})();

/* ============================================================
   ACOMPANHAMENTO DE CONSULTAS (MEDIDOR DINÂMICO)
   Dashboard no Painel Admin que exibe o consumo global e por
   cliente das franquias de consultas (LosDados), com botão para
   recarregar/alterar o limite de consultas manualmente.
   ============================================================ */
(function acompanhamentoInit() {
  const tableBody = document.getElementById('acompTableBody');
  const searchInput = document.getElementById('acompSearch');
  const btnRefresh = document.getElementById('btnRefreshAcompanhamento');
  const globalFill = document.getElementById('acompGlobalFill');
  const globalLabel = document.getElementById('acompGlobalLabel');
  const globalRealizadas = document.getElementById('acompGlobalRealizadas');
  const globalPermitidas = document.getElementById('acompGlobalPermitidas');
  const globalRestantes = document.getElementById('acompGlobalRestantes');

  // Estado local: últimos dados carregados (para filtro de busca).
  let dadosAtuais = { global: null, usuarios: [] };
  let filtro = '';

  // Formata um número inteiro com separador de milhar.
  function fmt(n) {
    return Number(n || 0).toLocaleString('pt-BR');
  }

  // Renderiza o medidor global (barra de progresso).
  function renderGlobal(global) {
    if (!global) return;
    const pct = Math.min(100, Math.max(0, Number(global.percentualConsumido) || 0));
    if (globalFill) globalFill.style.width = pct + '%';
    if (globalLabel) globalLabel.textContent = pct + '% consumido';
    if (globalRealizadas) globalRealizadas.textContent = fmt(global.consultas_realizadas);
    if (globalPermitidas) globalPermitidas.textContent = fmt(global.consultas_permitidas);
    if (globalRestantes) globalRestantes.textContent = fmt(global.consultas_restantes);
  }

  // Renderiza a tabela por cliente (com filtro de busca).
  function renderTabela() {
    if (!tableBody) return;
    const lista = dadosAtuais.usuarios.filter(u => {
      if (!filtro) return true;
      const alvo = filtro.toLowerCase();
      return String(u.name || '').toLowerCase().includes(alvo) ||
             String(u.email || '').toLowerCase().includes(alvo);
    });

    if (lista.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:24px;color:#8b93a7;">
            Nenhum cliente encontrado.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = lista.map(u => {
      const status = u.limiteAtingido
        ? '<span class="status-pill suspended">Limite Atingido</span>'
        : '<span class="status-pill active">Ativo</span>';
      const pct = u.consultas_permitidas > 0
        ? Math.round((u.consultas_realizadas / u.consultas_permitidas) * 100)
        : 0;
      return `
        <tr>
          <td>
            <div class="table-user">
              <div class="table-avatar ${u.color || 'cyan'}">${String(u.name || '?').charAt(0)}</div>
              <div>
                <div class="table-user-name">${u.name}</div>
                <div class="table-user-email">${u.email}</div>
              </div>
            </div>
          </td>
          <td>${u.plan}</td>
          <td>
            <div class="acomp-cell">
              <span class="acomp-num">${fmt(u.consultas_realizadas)}</span>
              <span class="acomp-sub">de ${fmt(u.consultas_permitidas)}</span>
            </div>
          </td>
          <td>
            <div class="acomp-cell">
              <span class="acomp-num ${u.limiteAtingido ? 'acomp-esgotado' : ''}">${fmt(u.consultas_restantes)}</span>
              <span class="acomp-sub">${pct}% consumido</span>
            </div>
          </td>
          <td>${status}</td>
          <td>
            <div class="table-actions">
              <button class="table-action-btn" title="Ajustar limite de consultas" data-acomp-ajustar="${u.id}">
                <i class="fas fa-sliders"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // Carrega os dados do servidor e renderiza.
  async function carregar() {
    try {
      const resp = await fetch('/api/losdados/admin/usuarios', { cache: 'no-store' });
      const data = await resp.json();
      if (data && data.ok) {
        dadosAtuais = { global: data.global, usuarios: data.usuarios || [] };
        renderGlobal(data.global);
        renderTabela();
      }
    } catch (e) {
      // Servidor pode não estar rodando; exibe aviso na tabela.
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center;padding:24px;color:#8b93a7;">
              Não foi possível carregar os dados. Verifique se o servidor (server.js) está rodando.
            </td>
          </tr>`;
      }
    }
  }

  // Abre o modal para ajustar o limite de consultas de um cliente.
  function abrirAjuste(id) {
    const u = dadosAtuais.usuarios.find(x => String(x.id) === String(id));
    if (!u) return;
    openModal('Ajustar Limite de Consultas', `
      <form class="modal-form" id="acompAjustarForm">
        <div class="modal-field">
          <label>Cliente</label>
          <input type="text" value="${u.name}" disabled>
        </div>
        <div class="modal-field">
          <label>Consultas Realizadas</label>
          <input type="text" value="${fmt(u.consultas_realizadas)}" disabled>
        </div>
        <div class="modal-field">
          <label>Consultas Restantes (atual)</label>
          <input type="text" value="${fmt(u.consultas_restantes)}" disabled>
        </div>
        <div class="modal-field">
          <label>Novo Total de Consultas do Plano</label>
          <input type="number" id="acompNovoPermitidas" value="${u.consultas_permitidas}" min="0" step="1" required>
          <small class="modal-hint">O saldo restante será recalculado com base nas consultas já realizadas.</small>
        </div>
        <div class="modal-actions">
          <button type="button" class="modal-btn cancel" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="modal-btn confirm">Salvar Limite</button>
        </div>
      </form>
    `);

    const form = document.getElementById('acompAjustarForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const novo = parseInt(document.getElementById('acompNovoPermitidas').value, 10);
        if (isNaN(novo) || novo < 0) {
          showToast('Valor inválido', 'Informe um total de consultas válido (>= 0).');
          return;
        }
        try {
          const resp = await fetch('/api/losdados/admin/ajustar-limite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, consultas_permitidas: novo })
          });
          const data = await resp.json();
          if (data && data.ok) {
            closeModal();
            showToast('Limite Atualizado', `Limite de ${u.name} atualizado para ${fmt(novo)} consultas.`);
            carregar();
          } else {
            showToast('Erro', (data && data.erro) || 'Falha ao ajustar o limite.');
          }
        } catch (err) {
          showToast('Falha de Rede', 'Não foi possível ajustar o limite. Verifique o servidor.');
        }
      });
    }
  }

  // Eventos
  if (btnRefresh) btnRefresh.addEventListener('click', carregar);
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filtro = e.target.value.trim();
      renderTabela();
    });
  }
  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-acomp-ajustar]');
      if (btn) abrirAjuste(btn.getAttribute('data-acomp-ajustar'));
    });
  }

  // Auto-refresh a cada 10s para acompanhamento em tempo real.
  carregar();
  setInterval(carregar, 10000);
})();
