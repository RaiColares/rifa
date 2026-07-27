// =====================================================
// URL do seu Web App do Google Apps Script
// Apos implantar o Apps Script, cole a URL aqui:
// =====================================================
var URL_BASE = 'https://script.google.com/macros/s/AKfycbxxyKVmnx3rtoHVd4WUMCwu-qd5PcALIhZuV6M0FsKyiComnKPrGhpKYI3EG2mraJsw/exec';

// =====================================================

function urlParams(a, dados) {
  var p = '?a=' + a;
  for (var k in dados) p += '&' + k + '=' + encodeURIComponent(dados[k]);
  return URL_BASE + p;
}

function copiarChave() {
  var el = document.createElement('textarea');
  el.value = '01648448216';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  alert('Chave PIX copiada!');
}

function carregarNumeros() {
  var x = new XMLHttpRequest();
  x.open('GET', urlParams('listar', {}));
  x.onload = function() {
    var dados = JSON.parse(x.responseText);
    if (dados && dados.length) renderizar(dados);
  };
  x.send();
}

function renderizar(numeros) {
  var grid = document.getElementById('gridNumeros');
  grid.innerHTML = '';

  numeros.forEach(function(n) {
    var d = document.createElement('div');
    var cls = 'grid-item';
    if (n.status === 'Disponivel') cls += ' available';
    else if (n.status === 'Reservado') cls += ' reserved';
    else cls += ' unavailable';
    if (n.pago === 'Sim') cls += ' paid';
    d.className = cls;

    if (n.status === 'Indisponivel' && n.nome) {
      d.innerHTML = n.numero + '<small>' + n.nome + '</small>';
    } else {
      d.textContent = n.numero;
    }

    if (n.status === 'Disponivel') {
      d.onclick = function() { reservar(n.numero); };
    }

    grid.appendChild(d);
  });
}

function reservar(num) {
  var x = new XMLHttpRequest();
  x.open('POST', urlParams('reservar', { n: num }), true);
  x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  x.onload = function() {
    var r = JSON.parse(x.responseText);
    if (r.success) {
      alert('Numero ' + num + ' reservado! Pague via PIX para garantir.');
      carregarNumeros();
    } else {
      alert(r.error || 'Erro ao reservar');
      carregarNumeros();
    }
  };
  x.send();
}

carregarNumeros();
