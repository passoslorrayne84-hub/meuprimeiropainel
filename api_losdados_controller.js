/* ============================================================
   ESPAÇO UBER - CONTROLLER ISOLADO DA API LOSDADOS
   ============================================================
   Este módulo é a ÚNICA ponte de comunicação com a API LosDados.
   Ele:
     - Lê a API Key salva pelo admin (losdados_config.json)
     - Recebe do frontend o tipo_consulta e o documento
     - Limpa caracteres especiais (pontos, traços, espaços)
     - Faz a requisição HTTP server-to-server injetando a API Key
       no header X-API-Key (evitando CORS)
     - Retorna o JSON de resposta para o frontend

   Isolado e modular: não altera nenhuma outra funcionalidade.
   ============================================================ */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Store de usuários / franquia de consultas (saldo, bloqueio e dedução).
const usuariosStore = require('./usuarios_store');

// ===== CONFIGURAÇÃO =====
const LOSDADOS_BASE = 'https://app.losdados.com.br/api/v1/consulta/';
const CONFIG_FILE = path.join(__dirname, 'losdados_config.json');

// ===== MAPA DE ENDPOINTS (tipo_consulta -> rota) =====
// Cada tipo recebe o documento limpo como parâmetro de query.
const ENDPOINTS = {
  cpf:      { rota: 'cpf',          param: 'cpf' },
  telefone: { rota: 'telefone',     param: 'telefone' },
  placa:    { rota: 'placa/serpro', param: 'placa' },
  cnh:      { rota: 'cnh/serpro',   param: 'cpf' }
};

// ===== PERSISTÊNCIA DA API KEY =====

// Lê a API Key salva no arquivo de configuração.
function lerApiKey() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return '';
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return (data && data.apiKey) ? String(data.apiKey).trim() : '';
  } catch (e) {
    console.warn('[LosDados] Falha ao ler API Key:', e && e.message ? e.message : e);
    return '';
  }
}

// Salva a API Key no arquivo de configuração.
function salvarApiKey(apiKey) {
  try {
    const chave = String(apiKey || '').trim();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ apiKey: chave, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('[LosDados] Falha ao salvar API Key:', e && e.message ? e.message : e);
    return false;
  }
}

// ===== UTILITÁRIOS =====

// Limpa caracteres especiais (pontos, traços, espaços, parênteses) de um documento.
function limparDocumento(valor) {
  return String(valor || '')
    .replace(/[^\w@.-]/g, '') // remove tudo que não seja letra, número, @, ponto, traço
    .replace(/[.\-\s]/g, '')  // remove pontos, traços e espaços
    .trim();
}

// ===== REQUISIÇÃO SERVER-TO-SERVER =====

// Resolução de DNS com fallback para servidores públicos.
// Se o DNS configurado no sistema (roteador/corporativo) falhar com
// ENOTFOUND, tenta resolver usando Google DNS (8.8.8.8) e Cloudflare (1.1.1.1).
function lookupComFallback(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  // 1. Tenta a resolução padrão do sistema (getaddrinfo).
  dns.lookup(hostname, options, (err, address, family) => {
    if (!err) return callback(null, address, family);

    // 2. Fallback: tenta com DNS públicos e restaura a configuração original.
    const servidoresOriginais = dns.getServers();
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

    dns.resolve4(hostname, (err4, addr4) => {
      if (!err4 && addr4 && addr4.length) {
        dns.setServers(servidoresOriginais);
        return callback(null, addr4[0], 4);
      }
      dns.resolve6(hostname, (err6, addr6) => {
        dns.setServers(servidoresOriginais);
        if (!err6 && addr6 && addr6.length) {
          return callback(null, addr6[0], 6);
        }
        callback(err4 || err, null, null);
      });
    });
  });
}

// Faz a chamada GET à LosDados com a API Key no header X-API-Key.
function consultarLosDados(tipoConsulta, documento, apiKey) {
  return new Promise((resolve, reject) => {
    const endpoint = ENDPOINTS[tipoConsulta];
    if (!endpoint) {
      return reject(new Error('Tipo de consulta inválido: ' + tipoConsulta));
    }

    const docLimpo = limparDocumento(documento);
    if (!docLimpo) {
      return reject(new Error('Documento inválido ou vazio.'));
    }

    const url = LOSDADOS_BASE + endpoint.rota + '?' + endpoint.param + '=' + encodeURIComponent(docLimpo);

    const req = https.get(url, {
      lookup: lookupComFallback,
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (e) { /* corpo não-JSON */ }
        resolve({
          status: res.statusCode || 500,
          data: json !== null ? json : body
        });
      });
    });

    req.on('error', (e) => {
      const dica = (e && e.code === 'ENOTFOUND')
        ? ' (DNS local não respondeu; verifique a conexão/DNS do servidor)'
        : '';
      reject(new Error('Falha de rede ao consultar LosDados: ' + e.message + dica));
    });

    // Timeout de segurança (15s)
    req.setTimeout(15000, () => {
      req.destroy(new Error('Timeout ao consultar LosDados.'));
    });
  });
}

// ===== HANDLERS DAS ROTAS =====

// GET /api/losdados/key -> retorna se existe chave salva (sem expor o valor)
function handleGetKey(res, corsHeaders) {
  const hasKey = !!lerApiKey();
  res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
  res.end(JSON.stringify({ ok: true, hasKey: hasKey }));
}

// POST /api/losdados/key -> salva a API Key
function handleSaveKey(req, res, corsHeaders) {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    try {
      const body = JSON.parse(raw || '{}');
      const apiKey = String(body.apiKey || '').trim();
      if (!apiKey) {
        res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
        res.end(JSON.stringify({ ok: false, erro: 'API Key não informada.' }));
        return;
      }
      const salvou = salvarApiKey(apiKey);
      if (salvou) {
        res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
        res.end(JSON.stringify({ ok: true, message: 'API Key salva com sucesso.' }));
      } else {
        res.writeHead(500, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
        res.end(JSON.stringify({ ok: false, erro: 'Falha ao salvar a API Key no servidor.' }));
      }
    } catch (e) {
      res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
      res.end(JSON.stringify({ ok: false, erro: 'JSON inválido no corpo da requisição.' }));
    }
  });
}

// Identifica o usuário logado a partir da requisição.
// Prioriza o header X-Usuario-Id (enviado pelo frontend). Se ausente,
// tenta o parâmetro de query "usuario" (id, email ou nome).
function identificarUsuario(req, url) {
  const headerId = String(req.headers['x-usuario-id'] || '').trim();
  if (headerId) {
    const porId = usuariosStore.buscarPorId(headerId);
    if (porId) return porId;
  }

  const params = new URLSearchParams(url.split('?')[1] || '');
  const usuarioRef = String(params.get('usuario') || '').trim();
  if (!usuarioRef) return null;

  // Tenta por id numérico primeiro
  if (/^\d+$/.test(usuarioRef)) {
    const porId = usuariosStore.buscarPorId(usuarioRef);
    if (porId) return porId;
  }
  // Depois por email
  if (usuarioRef.indexOf('@') !== -1) {
    const porEmail = usuariosStore.buscarPorEmail(usuarioRef);
    if (porEmail) return porEmail;
  }
  // Por fim por nome
  return usuariosStore.buscarPorNome(usuarioRef);
}

// GET /api/losdados/consulta?tipo=cpf&documento=... -> proxy para a LosDados
// Com controle de franquia: bloqueia (403) se o saldo estiver esgotado e
// deduz uma consulta quando a API LosDados responde com sucesso (HTTP 200).
async function handleConsulta(req, res, corsHeaders, url) {
  const params = new URLSearchParams(url.split('?')[1] || '');
  const tipo = String(params.get('tipo') || '').toLowerCase();
  const documento = String(params.get('documento') || '');

  const apiKey = lerApiKey();
  if (!apiKey) {
    res.writeHead(401, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
    res.end(JSON.stringify({
      ok: false,
      erro: 'API Key da LosDados não configurada. Configure-a no Painel Admin (Ajustes do Sistema).'
    }));
    return;
  }

  // ===== IDENTIFICA O USUÁRIO LOGADO =====
  const usuario = identificarUsuario(req, url);

  // ===== BLOQUEIO POR LIMITE DE CONSULTAS =====
  // Se o usuário foi identificado e não possui saldo, bloqueia o envio
  // com HTTP 403 ("Limite de consultas esgotado").
  if (usuario) {
    if (!usuariosStore.podeConsultar(usuario)) {
      res.writeHead(403, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
      res.end(JSON.stringify({
        ok: false,
        erro: 'Limite de consultas esgotado',
        limiteAtingido: true,
        saldo: {
          consultas_permitidas: usuario.consultas_permitidas,
          consultas_realizadas: usuario.consultas_realizadas,
          consultas_restantes: usuario.consultas_restantes
        }
      }));
      return;
    }
  }

  try {
    const resultado = await consultarLosDados(tipo, documento, apiKey);
    const status = resultado.status;

    // Tratamento de erros comuns
    if (status === 401 || status === 403) {
      res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
      res.end(JSON.stringify({ ok: false, erro: 'Chave inválida ou sem permissão (LosDados).' }));
      return;
    }
    if (status === 404) {
      res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
      res.end(JSON.stringify({ ok: false, notFound: true, message: 'Registro não encontrado na base da LosDados.' }));
      return;
    }
    if (status >= 500) {
      res.writeHead(502, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
      res.end(JSON.stringify({ ok: false, erro: 'Erro interno na API LosDados (HTTP ' + status + ').' }));
      return;
    }

    // ===== DEDUÇÃO DA CONSULTA (SOMENTE EM SUCESSO HTTP 200) =====
    // Ao receber uma resposta com sucesso (HTTP 200) da API LosDados,
    // incrementa consultas_realizadas +1 e decrementa consultas_restantes -1.
    let saldoAtualizado = null;
    if (status >= 200 && status < 300 && usuario) {
      saldoAtualizado = usuariosStore.deduzirConsulta(usuario);
      if (saldoAtualizado) {
        console.log('[Franquia] ✅ Consulta deduzida para ' + usuario.name +
          ' → restantes: ' + saldoAtualizado.consultas_restantes);
      }
    }

    // Sucesso: repassa o JSON da LosDados, incluindo o saldo atualizado
    // para que o frontend atualize o medidor em tempo real.
    let corpo = typeof resultado.data === 'string' ? resultado.data : JSON.stringify(resultado.data);
    if (saldoAtualizado) {
      try {
        const json = JSON.parse(corpo);
        json.saldo = {
          consultas_permitidas: saldoAtualizado.consultas_permitidas,
          consultas_realizadas: saldoAtualizado.consultas_realizadas,
          consultas_restantes: saldoAtualizado.consultas_restantes
        };
        corpo = JSON.stringify(json);
      } catch (e) { /* corpo não-JSON: não injeta saldo */ }
    }

    res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
    res.end(corpo);
  } catch (e) {
    res.writeHead(504, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
    res.end(JSON.stringify({ ok: false, erro: e && e.message ? e.message : 'Falha ao consultar LosDados.' }));
  }
}

// ===== ENDPOINTS DE FRANQUIA / SALDO =====

// GET /api/losdados/saldo?usuario=... -> saldo em tempo real do cliente logado
function handleSaldo(req, res, corsHeaders, url) {
  const usuario = identificarUsuario(req, url);
  if (!usuario) {
    res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
    res.end(JSON.stringify({
      ok: false,
      erro: 'Usuário não identificado. Informe o id/email/nome via header X-Usuario-Id ou parâmetro "usuario".'
    }));
    return;
  }

  const u = usuariosStore.normalizarUsuario(usuario);
  res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
  res.end(JSON.stringify({
    ok: true,
    usuario: {
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      status: u.status
    },
    saldo: {
      consultas_permitidas: u.consultas_permitidas,
      consultas_realizadas: u.consultas_realizadas,
      consultas_restantes: u.consultas_restantes
    },
    limiteAtingido: u.consultas_restantes <= 0
  }));
}

// GET /api/losdados/admin/usuarios -> lista todos os usuários com saldo
// (usado pelo Dashboard de Acompanhamento do Painel Admin)
function handleAdminUsuarios(res, corsHeaders) {
  const usuarios = usuariosStore.lerUsuarios().map(usuariosStore.normalizarUsuario);

  // Calcula o consumo global para o medidor geral.
  const totalPermitidas = usuarios.reduce((s, u) => s + (u.consultas_permitidas || 0), 0);
  const totalRealizadas = usuarios.reduce((s, u) => s + (u.consultas_realizadas || 0), 0);
  const totalRestantes = usuarios.reduce((s, u) => s + (u.consultas_restantes || 0), 0);

  res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
  res.end(JSON.stringify({
    ok: true,
    total: usuarios.length,
    global: {
      consultas_permitidas: totalPermitidas,
      consultas_realizadas: totalRealizadas,
      consultas_restantes: totalRestantes,
      percentualConsumido: totalPermitidas > 0
        ? Math.round((totalRealizadas / totalPermitidas) * 100)
        : 0
    },
    usuarios: usuarios.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      status: u.status,
      color: u.color,
      consultas_permitidas: u.consultas_permitidas,
      consultas_realizadas: u.consultas_realizadas,
      consultas_restantes: u.consultas_restantes,
      limiteAtingido: u.consultas_restantes <= 0
    }))
  }));
}

// POST /api/losdados/admin/ajustar-limite -> recarrega/altera o limite de
// consultas de um cliente manualmente (corpo: { id, consultas_permitidas })
function handleAdminAjustarLimite(req, res, corsHeaders) {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    try {
      const body = JSON.parse(raw || '{}');
      const id = String(body.id || '').trim();
      const permitidas = parseInt(body.consultas_permitidas, 10);

      if (!id) {
        res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
        res.end(JSON.stringify({ ok: false, erro: 'Informe o id do cliente.' }));
        return;
      }
      if (isNaN(permitidas) || permitidas < 0) {
        res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
        res.end(JSON.stringify({ ok: false, erro: 'Informe um valor válido para consultas_permitidas (>= 0).' }));
        return;
      }

      const usuario = usuariosStore.buscarPorId(id);
      if (!usuario) {
        res.writeHead(404, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
        res.end(JSON.stringify({ ok: false, erro: 'Cliente não encontrado.' }));
        return;
      }

      const atualizado = usuariosStore.ajustarLimite(usuario, permitidas);
      if (!atualizado) {
        res.writeHead(500, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
        res.end(JSON.stringify({ ok: false, erro: 'Falha ao ajustar o limite do cliente.' }));
        return;
      }

      res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
      res.end(JSON.stringify({
        ok: true,
        message: 'Limite de consultas atualizado com sucesso.',
        usuario: {
          id: atualizado.id,
          name: atualizado.name,
          consultas_permitidas: atualizado.consultas_permitidas,
          consultas_realizadas: atualizado.consultas_realizadas,
          consultas_restantes: atualizado.consultas_restantes
        }
      }));
    } catch (e) {
      res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders));
      res.end(JSON.stringify({ ok: false, erro: 'JSON inválido no corpo da requisição.' }));
    }
  });
}

// ===== ROTEADOR PRINCIPAL =====
// Retorna true se a rota foi tratada por este controller.
function handleLosDados(req, res, corsHeaders) {
  const url = req.url || '';
  const cleanUrl = url.split('?')[0];

  if (req.method === 'GET' && cleanUrl === '/api/losdados/key') {
    handleGetKey(res, corsHeaders);
    return true;
  }

  if (req.method === 'POST' && cleanUrl === '/api/losdados/key') {
    handleSaveKey(req, res, corsHeaders);
    return true;
  }

  if (req.method === 'GET' && cleanUrl === '/api/losdados/consulta') {
    handleConsulta(req, res, corsHeaders, url);
    return true;
  }

  // ===== FRANQUIA / SALDO =====
  if (req.method === 'GET' && cleanUrl === '/api/losdados/saldo') {
    handleSaldo(req, res, corsHeaders, url);
    return true;
  }

  if (req.method === 'GET' && cleanUrl === '/api/losdados/admin/usuarios') {
    handleAdminUsuarios(res, corsHeaders);
    return true;
  }

  if (req.method === 'POST' && cleanUrl === '/api/losdados/admin/ajustar-limite') {
    handleAdminAjustarLimite(req, res, corsHeaders);
    return true;
  }

  return false; // não é uma rota deste controller
}

module.exports = {
  handleLosDados,
  lerApiKey,
  salvarApiKey,
  limparDocumento,
  consultarLosDados
};
