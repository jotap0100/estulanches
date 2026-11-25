const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PROXIMO = {
  PENDENTE: 'EM_PREPARO',
  EM_PREPARO: 'PRONTO',
  PRONTO: 'ENTREGUE',
};

const NOME_STATUS = {
  PENDENTE: 'Pendente',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_ATIVOS = new Set(['PENDENTE', 'EM_PREPARO', 'PRONTO']);

let cardapio = [];
let pedidos = [];
let filtroStatus = 'TODOS';
let termoBusca = '';
const carrinho = new Map(); // item_id -> quantidade

const $ = (id) => document.getElementById(id);

function el(tag, texto, classe) {
  const e = document.createElement(tag);
  if (texto !== undefined && texto !== null) e.textContent = texto;
  if (classe) e.className = classe;
  return e;
}

function emojiParaItem(nome) {
  const n = (nome || '').toLowerCase();
  if (n.includes('suco') || n.includes('refri') || n.includes('água') || n.includes('agua')) return '🥤';
  if (n.includes('café') || n.includes('cafe') || n.includes('achocolatado')) return '☕';
  if (n.includes('pão') || n.includes('pao') || n.includes('queijo')) return '🧀';
  if (n.includes('coxinha') || n.includes('pastel') || n.includes('empada') || n.includes('salgado')) return '🥟';
  if (n.includes('sanduíche') || n.includes('sanduiche') || n.includes('lanche') || n.includes('hambúrguer')) return '🥪';
  if (n.includes('bolo') || n.includes('torta') || n.includes('doce') || n.includes('brigadeiro')) return '🍰';
  if (n.includes('fruta') || n.includes('salada') || n.includes('maçã') || n.includes('banana')) return '🍎';
  return '🍽️';
}

function formatarHora(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function aviso(texto, erro = false) {
  const msgEl = $('msg');
  msgEl.textContent = texto;
  msgEl.className = erro ? 'erro' : '';
  msgEl.style.display = 'block';
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => {
    msgEl.style.display = 'none';
  }, 3500);
}

async function api(metodo, caminho, corpo) {
  const res = await fetch(caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await res.json();
  if (!res.ok) throw new Error((dados.erros || ['Erro inesperado']).join('; '));
  return dados;
}

function atualizarKPIs() {
  $('kpiCardapio').textContent = String(cardapio.filter((i) => i.disponivel).length);
  $('kpiAtivos').textContent = String(pedidos.filter((p) => STATUS_ATIVOS.has(p.status)).length);
}

function criarEstadoVazio(icone, texto) {
  const li = el('li', null, 'empty-state');
  li.append(el('span', icone, 'empty-state-icon'), el('span', texto));
  return li;
}

function desenharCardapio() {
  const ul = $('cardapio');
  ul.replaceChildren();

  const busca = termoBusca.trim().toLowerCase();
  const filtrados = busca
    ? cardapio.filter((i) => i.nome.toLowerCase().includes(busca))
    : cardapio;

  if (!filtrados.length) {
    ul.append(criarEstadoVazio('🔍', busca ? 'Nenhum lanche encontrado para essa busca.' : 'Cardápio vazio no momento.'));
    return;
  }

  filtrados.forEach((item) => {
    const li = el('li', null, 'menu-item');

    const left = el('div', null, 'menu-item-left');
    left.append(el('div', emojiParaItem(item.nome), 'food-avatar'));

    const info = el('div', null, 'menu-item-info');
    info.append(el('span', item.nome, 'menu-item-name'));

    const meta = el('div', null, 'menu-item-meta');
    meta.append(el('span', brl(item.preco), 'preco'));

    const qtdNoCarrinho = carrinho.get(item.id) || 0;
    if (qtdNoCarrinho > 0) {
      meta.append(el('span', `${qtdNoCarrinho} no pedido`, 'in-cart-tag'));
    }
    if (!item.disponivel) {
      meta.append(el('span', 'Indisponível', 'unavailable-tag'));
    }

    info.append(meta);
    left.append(info);

    const btn = el('button', item.disponivel ? '+ Adicionar' : 'Indisponível', 'btn btn-add');
    btn.type = 'button';
    btn.disabled = !item.disponivel;
    btn.onclick = () => {
      carrinho.set(item.id, (carrinho.get(item.id) || 0) + 1);
      desenharCarrinho();
      desenharCardapio();
    };

    li.append(left, btn);
    ul.append(li);
  });
}

function desenharCarrinho() {
  const ul = $('carrinho');
  ul.replaceChildren();

  let totalCentavos = 0;
  let totalItens = 0;

  if (carrinho.size === 0) {
    ul.append(criarEstadoVazio('🛒', 'Seu pedido está vazio. Adicione itens do cardápio.'));
  }

  carrinho.forEach((qtd, id) => {
    const item = cardapio.find((i) => i.id === id);
    if (!item) return;

    const subtotalCentavos = Math.round(item.preco * 100) * qtd;
    totalCentavos += subtotalCentavos;
    totalItens += qtd;

    const li = el('li', null, 'cart-item');

    const info = el('div', null, 'cart-item-info');
    info.append(
      el('span', item.nome, 'cart-item-name'),
      el('span', `${brl(item.preco)} × ${qtd} = ${brl(subtotalCentavos / 100)}`, 'cart-item-sub')
    );

    const stepper = el('div', null, 'qty-stepper');

    const btnMenos = el('button', '−', 'qty-btn');
    btnMenos.type = 'button';
    btnMenos.setAttribute('aria-label', `Diminuir quantidade de ${item.nome}`);
    btnMenos.onclick = () => {
      if (qtd > 1) carrinho.set(id, qtd - 1);
      else carrinho.delete(id);
      desenharCarrinho();
      desenharCardapio();
    };

    const valor = el('span', String(qtd), 'qty-value');

    const btnMais = el('button', '+', 'qty-btn');
    btnMais.type = 'button';
    btnMais.setAttribute('aria-label', `Aumentar quantidade de ${item.nome}`);
    btnMais.onclick = () => {
      carrinho.set(id, qtd + 1);
      desenharCarrinho();
      desenharCardapio();
    };

    stepper.append(btnMenos, valor, btnMais);
    li.append(info, stepper);
    ul.append(li);
  });

  $('badgeQtdCarrinho').textContent = String(totalItens);
  $('total').textContent = brl(totalCentavos / 100);
}

function desenharPedidos() {
  const ul = $('pedidos');
  ul.replaceChildren();

  const lista = filtroStatus === 'TODOS'
    ? pedidos
    : pedidos.filter((p) => p.status === filtroStatus);

  if (!lista.length) {
    ul.append(criarEstadoVazio('🧾', filtroStatus === 'TODOS' ? 'Nenhum pedido registrado ainda.' : `Nenhum pedido com status "${NOME_STATUS[filtroStatus]}".`));
    return;
  }

  lista.forEach((p) => {
    const card = el('li', null, 'order-card');

    const top = el('div', null, 'order-top');
    const info = el('div');
    info.append(
      el('div', `Pedido #${p.id}`, 'order-id'),
      el('div', p.cliente, 'order-client')
    );
    const hora = formatarHora(p.criado_em);
    if (hora) {
      info.append(el('div', `Realizado às ${hora}`, 'order-time'));
    }

    const badge = el('span', null, `badge ${p.status}`);
    badge.append(el('span', '', 'badge-dot'), document.createTextNode(NOME_STATUS[p.status] || p.status));

    top.append(info, badge);

    const bottom = el('div', null, 'order-bottom');
    bottom.append(el('span', brl(p.total), 'order-total'));

    const actions = el('div', null, 'order-actions');
    if (PROXIMO[p.status]) {
      const b = el('button', `→ ${NOME_STATUS[PROXIMO[p.status]]}`, 'btn btn-advance');
      b.type = 'button';
      b.onclick = () => mudarStatus(p.id, PROXIMO[p.status], b);
      actions.append(b);
    }
    if (p.status === 'PENDENTE' || p.status === 'EM_PREPARO') {
      const c = el('button', 'Cancelar', 'btn btn-danger-outline');
      c.type = 'button';
      c.onclick = () => mudarStatus(p.id, 'CANCELADO', c);
      actions.append(c);
    }

    bottom.append(actions);
    card.append(top, bottom);
    ul.append(card);
  });
}

async function carregarCardapio() {
  cardapio = await api('GET', '/cardapio');
  desenharCardapio();
  desenharCarrinho();
  atualizarKPIs();
}

async function carregarPedidos() {
  pedidos = await api('GET', '/pedidos');
  desenharPedidos();
  atualizarKPIs();
}

async function mudarStatus(id, status, btn) {
  if (btn) btn.disabled = true;
  try {
    await api('PATCH', `/pedidos/${id}/status`, { status });
    aviso(`Pedido #${id} atualizado para ${NOME_STATUS[status]}`);
    await carregarPedidos();
  } catch (e) {
    aviso(e.message, true);
    if (btn) btn.disabled = false;
  }
}

$('btnPedido').onclick = async () => {
  const btn = $('btnPedido');
  btn.disabled = true;
  try {
    const itens = [...carrinho].map(([item_id, quantidade]) => ({ item_id, quantidade }));
    const p = await api('POST', '/pedidos', { cliente: $('cliente').value, itens });
    aviso(`Pedido #${p.id} criado! Total ${brl(p.total)}`);
    carrinho.clear();
    $('cliente').value = '';
    desenharCarrinho();
    desenharCardapio();
    await carregarPedidos();
  } catch (e) {
    aviso(e.message, true);
  } finally {
    btn.disabled = false;
  }
};

$('btnLimpar').onclick = () => {
  carrinho.clear();
  desenharCarrinho();
  desenharCardapio();
};

$('btnNovo').onclick = async () => {
  const btn = $('btnNovo');
  btn.disabled = true;
  try {
    await api('POST', '/cardapio', {
      nome: $('novoNome').value,
      preco: parseFloat($('novoPreco').value),
    });
    $('novoNome').value = '';
    $('novoPreco').value = '';
    aviso('Item adicionado ao cardápio');
    await carregarCardapio();
  } catch (e) {
    aviso(e.message, true);
  } finally {
    btn.disabled = false;
  }
};

$('buscaCardapio').oninput = (e) => {
  termoBusca = e.target.value;
  desenharCardapio();
};

$('filtrosPedidos').onclick = (e) => {
  const pill = e.target.closest('.filter-pill');
  if (!pill) return;
  filtroStatus = pill.dataset.status;
  document.querySelectorAll('.filter-pill').forEach((p) => {
    p.classList.toggle('active', p === pill);
  });
  desenharPedidos();
};

$('btnAtualizar').onclick = async () => {
  try {
    await carregarPedidos();
    aviso('Lista de pedidos atualizada');
  } catch (e) {
    aviso(e.message, true);
  }
};

$('cliente').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('btnPedido').click();
});

$('novoNome').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('novoPreco').focus();
});

$('novoPreco').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('btnNovo').click();
});

// ---- Tema Claro / Escuro ----
function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  const escuro = tema === 'dark';
  $('iconeTemaLua').classList.toggle('hidden', escuro);
  $('iconeTemaSol').classList.toggle('hidden', !escuro);
  localStorage.setItem('estulanches_tema', tema);
}

const temaSalvo = localStorage.getItem('estulanches_tema');
if (temaSalvo === 'dark' || (!temaSalvo && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  aplicarTema('dark');
} else {
  aplicarTema('light');
}

$('btnTema').onclick = () => {
  const atual = document.documentElement.getAttribute('data-theme');
  aplicarTema(atual === 'dark' ? 'light' : 'dark');
};

carregarCardapio()
  .then(carregarPedidos)
  .catch((e) => aviso(e.message, true));
