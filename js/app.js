var URL_BASE = 'https://script.google.com/macros/s/AKfycbxxyKVmnx3rtoHVd4WUMCwu-qd5PcALIhZuV6M0FsKyiComnKPrGhpKYI3EG2mraJsw/exec';

var carregando = {};

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
}

function hideToast() {
  var t = document.getElementById('toast');
  if (t) t.classList.add('hidden');
}

function urlParams(a, dados) {
  var p = '?a=' + a;
  for (var k in dados) p += '&' + k + '=' + encodeURIComponent(dados[k]);
  return URL_BASE + p;
}

function getMinhasReservas() {
  try { return JSON.parse(sessionStorage.getItem('rifa_reservas') || '[]'); } catch(e) { return []; }
}

function addMinhaReserva(num) {
  var reservas = getMinhasReservas();
  if (reservas.indexOf(num) === -1) {
    reservas.push(num);
    sessionStorage.setItem('rifa_reservas', JSON.stringify(reservas));
  }
}

function removeMinhaReserva(num) {
  var reservas = getMinhasReservas().filter(function(n) { return n !== num; });
  sessionStorage.setItem('rifa_reservas', JSON.stringify(reservas));
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

function setLoading(num, ligado) {
  if (ligado) {
    carregando[num] = true;
  } else {
    delete carregando[num];
  }
  var el = document.getElementById('n-' + num);
  if (el) {
    if (ligado) el.classList.add('loading');
    else el.classList.remove('loading');
  }
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
  var minhas = getMinhasReservas();

  numeros.forEach(function(n) {
    var d = document.createElement('div');
    d.id = 'n-' + n.numero;
    var cls = 'grid-item';
    if (n.status === 'Disponivel') cls += ' available';
    else if (n.status === 'Reservado') cls += ' reserved';
    else cls += ' unavailable';
    if (n.pago === 'Sim') cls += ' paid';
    if (carregando[n.numero]) cls += ' loading';
    d.className = cls;

    if (n.status === 'Indisponivel' && n.nome) {
      d.innerHTML = n.numero + '<small>' + n.nome + '</small>';
    } else {
      d.textContent = n.numero;
    }

    if (n.status === 'Disponivel') {
      d.onclick = function() { reservar(n.numero); };
    } else if (n.status === 'Reservado' && minhas.indexOf(n.numero) !== -1) {
      d.onclick = function() { cancelarReserva(n.numero); };
      d.classList.add('my-reservation');
    }

    grid.appendChild(d);
  });
}

function reservar(num) {
  if (carregando[num]) return;
  setLoading(num, true);
  showToast('Você selecionou o número ' + num + ', aguarde um instante...');

  var x = new XMLHttpRequest();
  x.open('POST', urlParams('reservar', { n: num }), true);
  x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  x.onload = function() {
    hideToast();
    setLoading(num, false);
    var r = JSON.parse(x.responseText);
    if (r.success) {
      addMinhaReserva(num);
      alert('Número ' + num + ' reservado! Pague via PIX para garantir.');
      carregarNumeros();
    } else {
      alert(r.error || 'Erro ao reservar');
      carregarNumeros();
    }
  };
  x.onerror = function() {
    hideToast();
    setLoading(num, false);
    alert('Erro de conexão. Tente novamente.');
    carregarNumeros();
  };
  x.send();
}

function cancelarReserva(num) {
  if (!confirm('Cancelar reserva do número ' + num + '?')) return;
  if (carregando[num]) return;
  setLoading(num, true);
  showToast('Cancelando reserva do número ' + num + '...');

  var x = new XMLHttpRequest();
  x.open('POST', urlParams('cancelar', { n: num }), true);
  x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  x.onload = function() {
    hideToast();
    setLoading(num, false);
    var r = JSON.parse(x.responseText);
    if (r.success) {
      removeMinhaReserva(num);
      alert('Reserva do número ' + num + ' cancelada!');
      carregarNumeros();
    } else {
      alert(r.error || 'Erro ao cancelar');
      carregarNumeros();
    }
  };
  x.onerror = function() {
    hideToast();
    setLoading(num, false);
    alert('Erro de conexão. Tente novamente.');
    carregarNumeros();
  };
  x.send();
}

carregarNumeros();
setInterval(carregarNumeros, 60000);
