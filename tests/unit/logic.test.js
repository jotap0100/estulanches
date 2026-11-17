const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calcularTotal,
  validarItemCardapio,
  validarPedido,
  transicaoPermitida,
} = require('../../src/logic');

test('calcularTotal soma preço x quantidade sem erro de ponto flutuante', () => {
  const total = calcularTotal([
    { preco: 4.5, quantidade: 2 },
    { preco: 0.1, quantidade: 3 },
  ]);
  assert.equal(total, 9.3);
});

test('calcularTotal de lista vazia é 0', () => {
  assert.equal(calcularTotal([]), 0);
});

test('validarItemCardapio aceita item válido', () => {
  assert.deepEqual(validarItemCardapio({ nome: 'Coxinha', preco: 6 }), []);
});

test('validarItemCardapio rejeita nome vazio e preço <= 0', () => {
  assert.equal(validarItemCardapio({ nome: ' ', preco: 0 }).length, 2);
});

test('validarPedido aceita pedido válido', () => {
  assert.deepEqual(
    validarPedido({ cliente: 'Ana', itens: [{ item_id: 1, quantidade: 2 }] }),
    []
  );
});

test('validarPedido rejeita pedido sem cliente e sem itens', () => {
  assert.equal(validarPedido({ cliente: '', itens: [] }).length, 2);
});

test('validarPedido rejeita quantidade inválida', () => {
  const erros = validarPedido({ cliente: 'Ana', itens: [{ item_id: 1, quantidade: 0 }] });
  assert.equal(erros.length, 1);
});

test('transicaoPermitida respeita o fluxo de status', () => {
  assert.equal(transicaoPermitida('PENDENTE', 'EM_PREPARO'), true);
  assert.equal(transicaoPermitida('PENDENTE', 'ENTREGUE'), false);
  assert.equal(transicaoPermitida('ENTREGUE', 'CANCELADO'), false);
});
