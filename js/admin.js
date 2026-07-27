// =====================================================
// URL do seu Web App do Google Apps Script
// Apos implantar o Apps Script, cole a URL aqui:
// =====================================================
var URL_BASE = 'https://script.google.com/macros/s/AKfycbxxyKVmnx3rtoHVd4WUMCwu-qd5PcALIhZuV6M0FsKyiComnKPrGhpKYI3EG2mraJsw/exec';

// =====================================================

var TOKEN = localStorage.getItem('adminToken') || '';
var numeros = [];
var editandoNum = null;

function urlParams(a, dados) {
  var p = '?a=' + a;
  for (var k in dados) p += '&' + k + '=' + encodeURIComponent(dados[k]);
  return URL_BASE + p;
}

function req(acao, dados, cb) {
  dados = dados || {};
  if (TOKEN) dados.tk = TOKEN;
  var x = new XMLHttpRequest();
  x.open('POST', urlParams(acao, dados), true);
  x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  x.onload = function() { cb(JSON.parse(x.responseText)); };
  x.onerror = function() { cb({ error: 'Erro de conexao' }); };
  x.send();
}

function get(acao, dados, cb) {
  var x = new XMLHttpRequest();
  x.open('GET', urlParams(acao, dados || {}));
  x.onload = function() { cb(JSON.parse(x.responseText)); };
  x.onerror = function() { cb({ error: 'Erro de conexao' }); };
  x.send();
}

// ==================== LOGIN ====================

document.addEventListener('DOMContentLoaded', function() {
  var formLogin = document.getElementById('formLogin');
  if (formLogin) {
    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();
      var u = document.getElementById('username').value;
      var s = document.getElementById('password').value;

      req('login', { u: u, s: s }, function(r) {
        if (r.success) {
          TOKEN = r.token;
          localStorage.setItem('adminToken', TOKEN);
          mostrarDashboard();
        } else {
          document.getElementById('erroLogin').textContent = r.error || 'Credenciais invalidas';
          document.getElementById('erroLogin').classList.remove('hidden');
        }
      });
    });
  }

  var formEditar = document.getElementById('formEditar');
  if (formEditar) {
    formEditar.addEventListener('submit', function(e) {
      e.preventDefault();
      req('atualizar', {
        n: editandoNum,
        st: document.getElementById('editStatus').value,
        no: document.getElementById('editNome').value,
        pg: document.getElementById('editPago').value,
        tl: document.getElementById('editTel').value
      }, function(r) {
        if (r.success) {
          fecharModal();
          carregarNumeros();
        } else {
          document.getElementById('erroEditar').textContent = r.error || 'Erro ao salvar';
          document.getElementById('erroEditar').classList.remove('hidden');
        }
      });
    });
  }

  var modal = document.getElementById('modalEditar');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) fecharModal();
    });
  }

  if (TOKEN) mostrarDashboard();
  else mostrarLogin();
});

// ==================== DASHBOARD ====================

function mostrarLogin() {
  var el = document.getElementById('telaLogin');
  if (el) el.classList.remove('hidden');
  el = document.getElementById('telaDashboard');
  if (el) el.classList.add('hidden');
}

function mostrarDashboard() {
  document.getElementById('telaLogin').classList.add('hidden');
  document.getElementById('telaDashboard').classList.remove('hidden');
  carregarNumeros();
}

function carregarNumeros() {
  get('listar', {}, function(dados) {
    if (dados && dados.length) {
      numeros = dados;
      renderizarGrid(numeros);
      atualizarStats();
    }
  });
}

function renderizarGrid(lista) {
  var grid = document.getElementById('gridAdmin');
  grid.innerHTML = '';
  (lista || numeros).forEach(function(n) {
    var d = document.createElement('div');
    var cls = 'grid-item';
    if (n.status === 'Disponivel') cls += ' available';
    else if (n.status === 'Reservado') cls += ' reserved';
    else cls += ' unavailable';
    if (n.pago === 'Sim') cls += ' paid';
    d.className = cls;
    var label = n.nome || n.status;
    d.innerHTML = n.numero + '<small>' + label + '</small>';
    d.onclick = function() { abrirModal(n); };
    grid.appendChild(d);
  });
}

function abrirModal(n) {
  editandoNum = n.numero;
  document.getElementById('editNum').textContent = n.numero;
  document.getElementById('editNome').value = n.nome || '';
  document.getElementById('editTel').value = n.telefone || '';
  document.getElementById('editStatus').value = n.status;
  document.getElementById('editPago').value = n.pago || 'Nao';
  document.getElementById('erroEditar').classList.add('hidden');
  document.getElementById('modalEditar').classList.add('open');
}

function fecharModal() {
  document.getElementById('modalEditar').classList.remove('open');
  editandoNum = null;
}

function buscar() {
  var n = parseInt(document.getElementById('buscaNum').value);
  if (n >= 1 && n <= 100) {
    renderizarGrid(numeros.filter(function(x) { return x.numero === n; }));
  }
}

function limparFiltro() {
  document.getElementById('buscaNum').value = '';
  document.getElementById('filtroStatus').value = 'all';
  renderizarGrid(numeros);
}

function filtrar() {
  var f = document.getElementById('filtroStatus').value;
  if (f === 'all') renderizarGrid(numeros);
  else renderizarGrid(numeros.filter(function(x) { return x.status === f; }));
}

function atualizarStats() {
  document.getElementById('contDisp').textContent = numeros.filter(function(x) { return x.status === 'Disponivel'; }).length;
  document.getElementById('contReserv').textContent = numeros.filter(function(x) { return x.status === 'Reservado'; }).length;
  document.getElementById('contIndisp').textContent = numeros.filter(function(x) { return x.status === 'Indisponivel'; }).length;
  document.getElementById('contPago').textContent = numeros.filter(function(x) { return x.pago === 'Sim'; }).length;
}

function sair() {
  TOKEN = '';
  localStorage.removeItem('adminToken');
  mostrarLogin();
}
