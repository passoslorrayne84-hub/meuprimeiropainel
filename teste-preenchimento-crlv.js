// Teste de preenchimento do CRLV com os dados REAIS fornecidos pelo usuário.
// Simula o objeto veiculo retornado pela API LosDados (nomes reais das chaves)
// e verifica se veicdbNormalizarParaCrlv captura todos os campos.

// Dados reais fornecidos pelo usuário (placa NHF2707), com os nomes de chave
// que a API LosDados usa (camelCase, conforme os labels exibidos no painel).
const veiculoReal = {
  placa: 'NHF2707',
  anoModelo: 2008,
  chassi: '9BFZF10A588150273',
  situacao: 'EM_CIRCULACAO',
  potencia: 73,
  cilindradas: 999,
  codigoRenavam: '00926901427',
  codigoMunicipioEmplacamento: '0921',
  descricaoMunicipioEmplacamento: 'SAO LUIS',
  ufJurisdicao: 'MA',
  codigoRemarcacaoChassi: 2,
  descricaoRemarcacaoChassi: 'NORMAL',
  codigoTipoVeiculo: '06',
  descricaoTipoVeiculo: 'AUTOMOVEL',
  codigoMarcaModelo: '159923',
  descricaoMarcaModelo: 'FORD/FIESTA FLEX',
  codigoEspecieVeiculo: '01',
  descricaoEspecieVeiculo: 'PASSAGEIRO',
  codigoTipoCarroceria: '999',
  descricaoTipoCarroceria: 'NAO APLICAVEL',
  codigoCor: '15',
  descricaoCor: 'VERMELHA',
  codigoCategoria: '01',
  descricaoCategoria: 'PARTICULAR',
  anoFabricacao: 2007,
  codigoCombustivel: '16',
  descricaoCombustivel: 'ALCOOL/GASOLINA',
  numeroMotor: 'SMJA88150273',
  cmt: 0,
  pbt: 1.51,
  cmc: 0,
  procedencia: 'NACIONAL',
  codigoTipoProprietario: 1,
  descricaoTipoProprietario: 'FISICA',
  numeroIdentificacaoProprietario: '01133149308',
  codigoRestricao1: '01',
  descricaoRestricao1: 'RENAINF',
  codigoRestricao2: '02',
  descricaoRestricao2: 'COMUNICACAO_DE_VENDA',
  codigoRestricao3: '00',
  descricaoRestricao3: 'SEM RESTRICAO',
  codigoRestricao4: '00',
  descricaoRestricao4: 'SEM RESTRICAO',
  qtdEixos: 2,
  nomeProprietario: 'NATALIA LIDIA SILVA',
  lotacao: 5,
  dataEmissaoCrv: '2010-10-20',
  descricaoDocImportador: 'INEXISTENTE',
  codigoOrgaoRfb: '0000000',
  descricaoOrgaoRfb: 'INEXISTENTE',
  tipoDocFaturado: 'JURIDICA',
  numeroIdFaturamento: '41626169000139',
  ufFaturado: 'MA',
  numeroProcessoImportacao: 0,
  codigoPaisTransferencia: '00000',
  descricaoPaisTransferencia: 'INEXISTENTE',
  indicadorMultaRenainf: true,
  indicadorComunicacaoVenda: true,
  indicadorPendenciaEmissao: false,
  indicadorRestricaoRenajud: false,
  tipoDocProprietarioIndicado: 0,
  descricaoDocProprietarioIndicado: 'INEXISTENTE',
  codigoOrigemPropriedade: 0,
  indicadorRestricaoRfb: 0,
  descricaoRestricaoRfb: 'INEXISTENTE',
  indicadorLeilao: false,
  indicadorRouboFurto: false,
  indicadorAlarme: false,
  isPesquisado: true,
  servicoConsultado: 'RENAVAM'
};

// ===== CÓPIA DA FUNÇÃO veicdbNormalizarParaCrlv (extraída do script.js) =====
function veicdbNormalizarParaCrlv(veiculo, placa) {
  const v = veiculo || {};
  const limpar = (val) => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  };

  const buscar = (...chaves) => {
    for (const c of chaves) {
      const val = limpar(v[c]);
      if (val !== '') return val;
    }
    return '';
  };

  const marca = buscar('marca', 'marcaModelo', 'descricaoMarca', 'descricao_marca');
  const modelo = buscar('modelo', 'descricaoModelo', 'descricao_modelo');
  const marcaModelo = buscar('marcaModelo', 'descricaoMarcaModelo', 'descricao_marca_modelo', 'marcaModeloVersao')
    || (marca && modelo ? marca + ' ' + modelo : (marca || modelo));

  const especie = buscar('especie', 'espécie', 'descricaoEspecieVeiculo', 'descricao_especie_veiculo');
  const tipo = buscar('tipo', 'descricaoTipoVeiculo', 'descricao_tipo_veiculo', 'tipoVeiculo');
  const especieTipo = buscar('especieTipo', 'especie_tipo')
    || (especie && tipo ? especie + ' / ' + tipo : (especie || tipo));

  const potencia = buscar('potencia', 'potência');
  const cilindradas = buscar('cilindradas');
  const potenciaCilindrada = buscar('potenciaCilindrada', 'potencia_cilindrada')
    || (potencia && cilindradas ? potencia + '/' + cilindradas : (potencia || cilindradas));

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
    numeroCrv: buscar('numeroCrv', 'crv', 'numeroDoCrv', 'numero_do_crv'),
    codigoSeguranca: buscar('codigoSeguranca', 'codigoDeSeguranca', 'cla', 'codigoSegurancaCla', 'codigo_de_seguranca'),
    placaAnteriorUf: buscar('placaAnteriorUf', 'placaAnterior', 'placaAnteriorUF', 'placa_anterior_uf'),
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

// ===== EXECUTA O TESTE =====
const d = veicdbNormalizarParaCrlv(veiculoReal, 'NHF2707');

console.log('===== RESULTADO DO PREENCHIMENTO DO CRLV =====');
const campos = [
  ['placa', 'Placa'],
  ['renavam', 'Renavam'],
  ['anoFabricacao', 'Ano Fabricação'],
  ['anoModelo', 'Ano Modelo'],
  ['marcaModelo', 'Marca/Modelo'],
  ['chassi', 'Chassi'],
  ['cor', 'Cor'],
  ['especieTipo', 'Espécie/Tipo'],
  ['combustivel', 'Combustível'],
  ['categoria', 'Categoria'],
  ['capacidade', 'Capacidade'],
  ['potenciaCilindrada', 'Potência/Cilindrada'],
  ['pesoBruto', 'Peso Bruto'],
  ['motor', 'Motor'],
  ['carroceria', 'Carroceria'],
  ['eixos', 'Eixos'],
  ['situacao', 'Situação'],
  ['nome', 'Nome'],
  ['cpfCnpj', 'CPF/CNPJ'],
  ['municipio', 'Município'],
  ['uf', 'UF'],
  ['data', 'Data'],
  ['restricao', 'Restrição']
];

let preenchidos = 0;
let vazios = 0;
for (const [chave, label] of campos) {
  const valor = d[chave];
  const ok = valor !== undefined && valor !== null && String(valor).trim() !== '';
  if (ok) preenchidos++; else vazios++;
  console.log((ok ? '  ✅' : '  ❌') + ' ' + label + ': ' + (ok ? JSON.stringify(valor) : '(VAZIO)'));
}

console.log('\n===== RESUMO =====');
console.log('Campos preenchidos: ' + preenchidos + '/' + campos.length);
console.log('Campos vazios: ' + vazios);

if (vazios > 0) {
  console.log('\n⚠️  AINDA HÁ CAMPOS VAZIOS!');
  process.exit(1);
} else {
  console.log('\n✅ TODOS OS CAMPOS FORAM PREENCHIDOS!');
}
