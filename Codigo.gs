// =====================================================
// RIFA ONLINE - Google Apps Script
// =====================================================
// INSTRUCOES DE INSTALACAO:
// 1. Crie uma planilha no Google Sheets
// 2. No menu Extensoes > Apps Script, cole este codigo
// 3. Crie os arquivos Index.html e Admin.html no Apps Script
// 4. Execute a funcao "configurarPlanilha()" uma vez
// 5. Implante > Nova implantacao > Aplicativo web
// 6. Execute como "Eu", acesso "Qualquer pessoa"
// =====================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rifa')
    .addItem('Configurar planilha', 'configurarPlanilha')
    .addToUi();
}

function configurarPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Aba Numeros
  var abaNum = ss.getSheetByName('Numeros');
  if (!abaNum) {
    abaNum = ss.insertSheet('Numeros');
  }
  abaNum.clear();
  var cabecalho = ['Numero', 'Status', 'Nome', 'Pago', 'ReservadoEm', 'Telefone'];
  var linhas = [cabecalho];
  for (var i = 1; i <= 100; i++) {
    linhas.push([i, 'Disponivel', '', 'Nao', '', '']);
  }
  abaNum.getRange(1, 1, 101, 6).setValues(linhas);
  abaNum.getRange(1, 1, 1, 6).setFontWeight('bold');

  // Aba Config
  var abaCfg = ss.getSheetByName('Config');
  if (!abaCfg) {
    abaCfg = ss.insertSheet('Config');
  }
  abaCfg.clear();
  abaCfg.getRange(1, 1, 4, 2).setValues([
    ['pix_key', '01648448216'],
    ['pix_nome', 'Aline Peres'],
    ['admin_user', 'admin'],
    ['admin_pass', 'admin123']
  ]);
  abaCfg.getRange(1, 1, 1, 2).setFontWeight('bold');

  SpreadsheetApp.getUi().alert('Planilha configurada com sucesso!');
}

function doGet(e) {
  var acao = e.parameter.a || '';
  var path = e.parameter.p || '';

  if (acao === 'listar') {
    return responderJSON(getNumeros());
  }

  if (path === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Rifa Online - Admin')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Rifa Online')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  var action = e.parameter.a || '';

  if (action === 'reservar') return reservarNumero(e);
  if (action === 'login') return adminLogin(e);
  if (action === 'atualizar') return adminAtualizar(e);

  return respErro('Acao invalida');
}

// ====================== DADOS ======================

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Numeros');
}

function getConfigSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
}

function getNumeros() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var nums = [];

  for (var i = 1; i < data.length; i++) {
    nums.push({
      numero: Number(data[i][0]),
      status: data[i][1] || 'Disponivel',
      nome: data[i][2] || '',
      pago: data[i][3] || 'Nao',
      reservadoEm: data[i][4] || '',
      telefone: data[i][5] || ''
    });
  }

  return nums;
}

function getConfig() {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 0; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  return config;
}

// ====================== API ======================

function reservarNumero(e) {
  var num = Number(e.parameter.n);
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === num) {
      if (data[i][1] !== 'Disponivel') {
        return respErro('Numero nao disponivel');
      }
      sheet.getRange(i + 1, 2).setValue('Reservado');
      sheet.getRange(i + 1, 5).setValue(new Date().toISOString());

      var config = getConfig();
      return respSucesso({
        numero: num,
        pixKey: config.pix_key || '01648448216',
        pixName: config.pix_nome || 'Aline Peres'
      });
    }
  }

  return respErro('Numero nao encontrado');
}

function adminLogin(e) {
  var config = getConfig();
  var user = config.admin_user || 'admin';
  var pass = config.admin_pass || 'admin123';

  if (e.parameter.u === user && e.parameter.s === pass) {
    var token = 'token_' + new Date().getTime() + '_' + Math.random().toString(36).slice(2, 8);
    return respSucesso({ token: token });
  }

  return respErro('Credenciais invalidas');
}

function adminAtualizar(e) {
  if (!e.parameter.tk || e.parameter.tk.indexOf('token_') !== 0) {
    return respErro('Nao autenticado');
  }

  var num = Number(e.parameter.n);
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === num) {
      sheet.getRange(i + 1, 2).setValue(e.parameter.st || data[i][1]);
      sheet.getRange(i + 1, 3).setValue(e.parameter.no || data[i][2]);
      sheet.getRange(i + 1, 4).setValue(e.parameter.pg || data[i][3]);
      sheet.getRange(i + 1, 5).setValue(e.parameter.st === 'Disponivel' ? '' : (data[i][4] || new Date().toISOString()));
      sheet.getRange(i + 1, 6).setValue(e.parameter.tl || data[i][5]);
      return respSucesso({});
    }
  }

  return respErro('Numero nao encontrado');
}

// ====================== RESPOSTA ======================

function responderJSON(dados) {
  return ContentService
    .createTextOutput(JSON.stringify(dados))
    .setMimeType(ContentService.MimeType.JSON);
}

function respSucesso(dados) {
  dados.success = true;
  return ContentService
    .createTextOutput(JSON.stringify(dados))
    .setMimeType(ContentService.MimeType.JSON);
}

function respErro(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
