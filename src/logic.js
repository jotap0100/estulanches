// Regras de negócio puras (sem banco) — fáceis de testar.

const STATUS_VALIDOS = ['PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];

// Fluxo permitido de status
const TRANSICOES = {
  PENDENTE: ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: [],
};

function calcularTotal(itens) {
  return itens.reduce(
    (soma, i) => soma + Math.round(i.preco * 100) * i.quantidade,
    0
  ) / 100;
}

function validarItemCardapio(item) {
  const erros = [];
  if (!item || typeof item.nome !== 'string' || item.nome.trim() === '') {
    erros.push('nome é obrigatório');
  }
  if (typeof item?.preco !== 'number' || !(item.preco > 0)) {
    erros.push('preco deve ser um número maior que zero');
  }
  return erros;
}

function validarPedido(pedido) {
  const erros = [];
  if (!pedido || typeof pedido.cliente !== 'string' || pedido.cliente.trim() === '') {
    erros.push('cliente é obrigatório');
  }
  if (!Array.isArray(pedido?.itens) || pedido.itens.length === 0) {
    erros.push('itens deve ter ao menos 1 item');
  } else {
    pedido.itens.forEach((i, idx) => {
      if (!Number.isInteger(i.item_id) || i.item_id <= 0) {
        erros.push(`itens[${idx}].item_id inválido`);
      }
      if (!Number.isInteger(i.quantidade) || i.quantidade <= 0) {
        erros.push(`itens[${idx}].quantidade deve ser inteiro maior que zero`);
      }
    });
  }
  return erros;
}

function transicaoPermitida(de, para) {
  return (TRANSICOES[de] || []).includes(para);
}

module.exports = {
  STATUS_VALIDOS,
  calcularTotal,
  validarItemCardapio,
  validarPedido,
  transicaoPermitida,
};
