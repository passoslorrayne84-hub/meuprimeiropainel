/* ============================================================
   ESPAÇO UBER - PÁGINA DE LOGIN
   Lógica de Autenticação, Captcha e Redirecionamento
   ============================================================ */

'use strict';

/* ===== CONFIGURAÇÕES ===== */
const CONFIG = {
  authDelay: 1800, // atraso de autenticação em ms (1.8s)
  captchaDelay: 800, // atraso do captcha em ms
  redirectUrl: 'index.html' // destino após login
};

/* ===== DOM REFERENCES ===== */
const dom = {
  form: document.getElementById('loginForm'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  togglePassword: document.getElementById('togglePassword'),
  btnLogin: document.getElementById('btnLogin'),
  btnText: document.getElementById('btnText'),
  btnLoading: document.getElementById('btnLoading'),
  captchaBox: document.getElementById('captchaBox'),
  captchaCheckbox: document.getElementById('captchaCheckbox'),
  errorMessage: document.getElementById('errorMessage'),
  errorText: document.getElementById('errorText'),
  registerLink: document.getElementById('registerLink')
};

/* ===== ESTADO ===== */
let captchaVerified = false;
let isAuthenticating = false;

/* ===== FUNÇÕES AUXILIARES ===== */

// Exibe mensagem de erro
function showError(message) {
  dom.errorText.textContent = message;
  dom.errorMessage.classList.add('show');

  // Esconde após 3 segundos
  setTimeout(() => {
    dom.errorMessage.classList.remove('show');
  }, 3000);
}

// Limpa mensagem de erro
function clearError() {
  dom.errorMessage.classList.remove('show');
}

// Validação dos campos
function validateFields() {
  const username = dom.username.value.trim();
  const password = dom.password.value.trim();

  if (!username) {
    showError('Por favor, informe seu usuário.');
    dom.username.focus();
    return false;
  }

  if (!password) {
    showError('Por favor, informe sua senha.');
    dom.password.focus();
    return false;
  }

  if (password.length < 4) {
    showError('A senha deve ter pelo menos 4 caracteres.');
    dom.password.focus();
    return false;
  }

  return true;
}

// Simula verificação do captcha
function verifyCaptcha() {
  return new Promise((resolve) => {
    // Estado de loading
    dom.captchaCheckbox.classList.add('loading');
    dom.captchaCheckbox.classList.remove('checked');
    dom.captchaBox.classList.remove('verified');

    setTimeout(() => {
      dom.captchaCheckbox.classList.remove('loading');
      dom.captchaCheckbox.classList.add('checked');
      dom.captchaBox.classList.add('verified');
      captchaVerified = true;
      resolve(true);
    }, CONFIG.captchaDelay);
  });
}

// Simula autenticação no banco de dados
function authenticate() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, CONFIG.authDelay);
  });
}

// Redireciona para o dashboard
function redirectToDashboard() {
  window.location.href = CONFIG.redirectUrl;
}

/* ===== EVENT LISTENERS ===== */

// Envio do formulário
dom.form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Evita múltiplos envios
  if (isAuthenticating) return;

  clearError();

  // Valida campos
  if (!validateFields()) return;

  // Ativa estado de loading
  isAuthenticating = true;
  dom.btnLogin.classList.add('loading');
  dom.btnLogin.disabled = true;

  try {
    // Verifica captcha se ainda não foi verificado
    if (!captchaVerified) {
      await verifyCaptcha();
    }

    // Simula autenticação
    await authenticate();

    // Redireciona para o dashboard
    redirectToDashboard();
  } catch (err) {
    // Em caso de erro, restaura o botão
    isAuthenticating = false;
    dom.btnLogin.classList.remove('loading');
    dom.btnLogin.disabled = false;
    showError('Erro na autenticação. Tente novamente.');
  }
});

// Clique no captcha
dom.captchaBox.addEventListener('click', () => {
  if (!captchaVerified && !isAuthenticating) {
    verifyCaptcha();
  }
});

// Teclado no captcha (acessibilidade)
dom.captchaCheckbox.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && !captchaVerified && !isAuthenticating) {
    e.preventDefault();
    verifyCaptcha();
  }
});

// Mostrar/ocultar senha
dom.togglePassword.addEventListener('click', () => {
  const type = dom.password.type === 'password' ? 'text' : 'password';
  dom.password.type = type;

  // Alterna o ícone
  const icon = dom.togglePassword.querySelector('i');
  icon.classList.toggle('fa-eye');
  icon.classList.toggle('fa-eye-slash');
});

// Limpa erro ao digitar
dom.username.addEventListener('input', clearError);
dom.password.addEventListener('input', clearError);

// Link de registro (demonstração)
dom.registerLink.addEventListener('click', (e) => {
  e.preventDefault();
  showError('O registro de novas contas está disponível em breve.');
});

/* ===== INICIALIZAÇÃO ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Foca no campo de usuário ao carregar
  dom.username.focus();

  console.log('%c🔐 Espaço Uber Login inicializado!', 'color: #00f2fe; font-size: 14px; font-weight: bold;');
});
