/* ============================================================
   ESPAÇO UBER - STORE DE CONFIGURAÇÕES COMPARTILHADAS
   Ponte entre o Painel Admin e o Painel do Cliente via localStorage
   Sistema de sincronização em tempo real (mesma aba + outras abas)
   ============================================================ */

'use strict';

/* ===== CHAVE DO STORAGE ===== */
const CONFIG_STORAGE_KEY = 'espaco_uber_config';
const CONFIG_EVENT = 'espaco-uber-config-changed';

/* ===== CONFIGURAÇÕES PADRÃO ===== */
const DEFAULT_CONFIG = {
  systemName: 'Espaço Uber',
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  notifications: {
    email: true,
    push: true,
    weeklyReport: false
  },
  theme: {
    primaryColor: '#00f2fe',
    secondaryColor: '#fe0979',
    accentColor: '#00ffa3'
  },
  features: {
    showFacialAI: true,
    showGenerators: true,
    showCheckers: true,
    showTools: true
  },
  maintenance: {
    enabled: false,
    message: 'Sistema em manutenção. Volte em breve!'
  },
  updatedAt: null
};

/* ===== LISTA DE LISTENERS ===== */
const _listeners = [];

/* ===== FUNÇÕES DE LEITURA/ESCRITA ===== */

// Carrega as configurações do localStorage (mesclando com padrões)
function loadConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_CONFIG };

    const parsed = JSON.parse(stored);
    // Mescla com padrões para garantir que todas as chaves existam
    return deepMerge({ ...DEFAULT_CONFIG }, parsed);
  } catch (err) {
    console.warn('Erro ao carregar configurações:', err);
    return { ...DEFAULT_CONFIG };
  }
}

// Salva as configurações no localStorage e notifica todos os painéis
function saveConfig(config) {
  try {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));

    // Notifica a PRÓPRIA aba (o evento 'storage' não dispara na aba que salvou)
    _emitLocal(config);

    return true;
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    return false;
  }
}

// Mescla objetos profundamente
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Reseta as configurações para o padrão
function resetConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  const config = { ...DEFAULT_CONFIG };
  _emitLocal(config);
  return config;
}

/* ===== SISTEMA DE EVENTOS ===== */

// Notifica os listeners da própria aba
function _emitLocal(config) {
  _listeners.forEach(cb => {
    try {
      cb(config);
    } catch (err) {
      console.error('Erro em listener de configuração:', err);
    }
  });
}

// Registra um listener para mudanças de configuração
// Dispara tanto para mudanças na própria aba quanto em outras abas
function onConfigChange(callback) {
  if (typeof callback !== 'function') return;

  // Listener local (mesma aba)
  _listeners.push(callback);

  // Listener entre abas (evento 'storage' dispara em outras abas)
  window.addEventListener('storage', (e) => {
    if (e.key === CONFIG_STORAGE_KEY) {
      callback(loadConfig());
    }
  });

  // Listener via CustomEvent (redundância para máxima compatibilidade)
  window.addEventListener(CONFIG_EVENT, (e) => {
    if (e.detail && e.detail.config) {
      callback(e.detail.config);
    }
  });
}

// Dispara um CustomEvent manualmente (para sincronização explícita)
function notifyChange(config) {
  const event = new CustomEvent(CONFIG_EVENT, {
    detail: { config: config || loadConfig() }
  });
  window.dispatchEvent(event);
}

/* ===== EXPORTAÇÃO GLOBAL ===== */
window.ConfigStore = {
  load: loadConfig,
  save: saveConfig,
  reset: resetConfig,
  onChange: onConfigChange,
  notify: notifyChange,
  DEFAULT: DEFAULT_CONFIG,
  STORAGE_KEY: CONFIG_STORAGE_KEY
};
