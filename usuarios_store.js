/* ============================================================
   ESPAÇO UBER - STORE DE USUÁRIOS / FRANQUIA DE CONSULTAS
   ============================================================
   Armazena os usuários (clientes) em um arquivo JSON no servidor
   (usuarios.json) com os campos de controle de consultas:

     - consultas_permitidas  (INT - Total do plano)
     - consultas_realizadas  (INT - Quantidade já executada)
     - consultas_restantes   (INT - Saldo atual disponível)

   Este módulo é a ÚNICA fonte de verdade do saldo/franquia no
   servidor. Ele expõe funções para:
     - Listar usuários (para o Painel Admin)
     - Buscar um usuário por id/email/nome
     - Verificar e deduzir consultas (bloqueio 403)
     - Recarregar/alterar o limite de consultas manualmente
     - Obter o saldo em tempo real do cliente logado
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

// ===== ARQUIVO DE PERSISTÊNCIA =====
const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');

// ===== USUÁRIOS PADRÃO (seed inicial) =====
// Usados apenas na primeira execução, quando o arquivo ainda não existe.
// Cada usuário possui os campos de franquia de consultas.
const USUARIOS_PADRAO = [
  {
    id: 1,
    name: 'FREDÃO',
    email: 'fredao@email.com',
    password: '1234',
    plan: 'Mensal',
    status: 'active',
    lastAccess: 'Agora',
    color: 'cyan',
    consultas_permitidas: 100,
    consultas_realizadas: 0,
    consultas_restantes: 100
  },
  {
    id: 2,
    name: 'Maria Silva',
    email: 'maria@email.com',
    password: '1234',
    plan: 'Anual',
    status: 'active',
    lastAccess: '5 min atrás',
    color: 'pink',
    consultas_permitidas: 500,
    consultas_realizadas: 0,
    consultas_restantes: 500
  },
  {
    id: 3,
    name: 'João Santos',
    email: 'joao@email.com',
    password: '1234',
    plan: 'Mensal',
    status: 'inactive',
    lastAccess: '2 horas atrás',
    color: 'green',
    consultas_permitidas: 50,
    consultas_realizadas: 0,
    consultas_restantes: 50
  },
  {
    id: 4,
    name: 'Ana Oliveira',
    email: 'ana@email.com',
    password: '1234',
    plan: 'Semanal',
    status: 'active',
    lastAccess: '30 min atrás',
    color: 'orange',
    consultas_permitidas: 30,
    consultas_realizadas: 0,
    consultas_restantes: 30
  },
  {
    id: 5,
    name: 'Carlos Lima',
    email: 'carlos@email.com',
    password: '1234',
    plan: 'Mensal',
    status: 'suspended',
    lastAccess: '1 dia atrás',
    color: 'cyan',
    consultas_permitidas: 100,
    consultas_realizadas: 0,
    consultas_restantes: 100
  },
  {
    id: 6,
    name: 'Beatriz Costa',
    email: 'bia@email.com',
    password: '1234',
    plan: 'Anual',
    status: 'active',
    lastAccess: '10 min atrás',
    color: 'pink',
    consultas_permitidas: 500,
    consultas_realizadas: 0,
    consultas_restantes: 500
  },
  {
    id: 7,
    name: 'Pedro Alves',
    email: 'pedro@email.com',
    password: '1234',
    plan: 'Mensal',
    status: 'pending',
    lastAccess: 'Nunca',
    color: 'green',
    consultas_permitidas: 100,
    consultas_realizadas: 0,
    consultas_restantes: 100
  },
  {
    id: 8,
    name: 'Lucas Pereira',
    email: 'lucas@email.com',
    password: '1234',
    plan: 'Semanal',
    status: 'active',
    lastAccess: '1 hora atrás',
    color: 'orange',
    consultas_permitidas: 30,
    consultas_realizadas: 0,
    consultas_restantes: 30
  }
];

// ===== LEITURA / ESCRITA =====

// Lê todos os usuários do arquivo JSON. Se o arquivo não existir,
// cria com os usuários padrão (seed). Retorna sempre um array.
function lerUsuarios() {
  try {
    if (!fs.existsSync(USUARIOS_FILE)) {
      fs.writeFileSync(USUARIOS_FILE, JSON.stringify(USUARIOS_PADRAO, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(USUARIOS_PADRAO));
    }
    const raw = fs.readFileSync(USUARIOS_FILE, 'utf-8');
    const dados = JSON.parse(raw);
    return Array.isArray(dados) ? dados : [];
  } catch (e) {
    console.warn('[UsuariosStore] Falha ao ler usuários:', e && e.message ? e.message : e);
    return [];
  }
}

// Salva o array de usuários no arquivo JSON.
function salvarUsuarios(usuarios) {
  try {
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('[UsuariosStore] Falha ao salvar usuários:', e && e.message ? e.message : e);
    return false;
  }
}

// ===== NORMALIZAÇÃO =====

// Garante que um usuário possua os campos de franquia de consultas.
// Usado ao carregar dados antigos que ainda não têm esses campos.
function normalizarUsuario(u) {
  const permitidas = parseInt(u.consultas_permitidas, 10);
  const realizadas = parseInt(u.consultas_realizadas, 10);
  const restantes = parseInt(u.consultas_restantes, 10);

  const permitidasFinal = isNaN(permitidas) ? 0 : permitidas;
  const realizadasFinal = isNaN(realizadas) ? 0 : realizadas;
  // Se restantes não estiver definido, calcula a partir de permitidas - realizadas.
  const restantesFinal = isNaN(restantes)
    ? Math.max(0, permitidasFinal - realizadasFinal)
    : restantes;

  return Object.assign({}, u, {
    consultas_permitidas: permitidasFinal,
    consultas_realizadas: realizadasFinal,
    consultas_restantes: restantesFinal
  });
}

// ===== BUSCAS =====

// Busca um usuário por id (número ou string).
function buscarPorId(id) {
  const usuarios = lerUsuarios().map(normalizarUsuario);
  const alvo = String(id).trim();
  return usuarios.find(u => String(u.id) === alvo) || null;
}

// Busca um usuário por email (case-insensitive).
function buscarPorEmail(email) {
  const usuarios = lerUsuarios().map(normalizarUsuario);
  const alvo = String(email || '').trim().toLowerCase();
  return usuarios.find(u => String(u.email || '').trim().toLowerCase() === alvo) || null;
}

// Busca um usuário por nome (case-insensitive).
function buscarPorNome(nome) {
  const usuarios = lerUsuarios().map(normalizarUsuario);
  const alvo = String(nome || '').trim().toLowerCase();
  return usuarios.find(u => String(u.name || '').trim().toLowerCase() === alvo) || null;
}

// ===== LÓGICA DE FRANQUIA =====

// Verifica se o usuário ainda possui consultas restantes (> 0).
// Retorna true se pode consultar, false se o limite foi atingido.
function podeConsultar(usuario) {
  const u = normalizarUsuario(usuario);
  return u.consultas_restantes > 0;
}

// Deduz uma consulta do saldo do usuário (incrementa realizadas,
// decrementa restantes). Retorna o usuário atualizado ou null se falhar.
function deduzirConsulta(usuario) {
  const usuarios = lerUsuarios().map(normalizarUsuario);
  const idx = usuarios.findIndex(u => String(u.id) === String(usuario.id));
  if (idx === -1) return null;

  const u = usuarios[idx];
  if (u.consultas_restantes <= 0) return null; // já esgotado

  u.consultas_realizadas = (u.consultas_realizadas || 0) + 1;
  u.consultas_restantes = Math.max(0, (u.consultas_restantes || 0) - 1);
  u.ultimaConsulta = new Date().toISOString();

  if (!salvarUsuarios(usuarios)) return null;
  return u;
}

// Recarrega/ajusta o limite de consultas de um usuário manualmente.
// Se novoPermitidas for informado, redefine o total do plano e recalcula
// o saldo restante (mantendo as realizadas). Retorna o usuário atualizado.
function ajustarLimite(usuario, novoPermitidas) {
  const usuarios = lerUsuarios().map(normalizarUsuario);
  const idx = usuarios.findIndex(u => String(u.id) === String(usuario.id));
  if (idx === -1) return null;

  const u = usuarios[idx];
  const permitidas = parseInt(novoPermitidas, 10);
  if (!isNaN(permitidas) && permitidas >= 0) {
    u.consultas_permitidas = permitidas;
    // Recalcula o saldo restante com base nas realizadas atuais.
    u.consultas_restantes = Math.max(0, permitidas - (u.consultas_realizadas || 0));
  }

  if (!salvarUsuarios(usuarios)) return null;
  return u;
}

// ===== API PÚBLICA =====
module.exports = {
  lerUsuarios,
  salvarUsuarios,
  normalizarUsuario,
  buscarPorId,
  buscarPorEmail,
  buscarPorNome,
  podeConsultar,
  deduzirConsulta,
  ajustarLimite,
  USUARIOS_FILE
};
