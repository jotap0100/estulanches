// Testes de integração: exigem a aplicação + banco no ar.
// Uso: docker compose up -d && npm run test:integration
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

test('GET /health confirma app e banco conectados', async () => {
  const r = await api('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'ok');
});

test('GET /cardapio retorna os itens iniciais (seed)', async () => {
  const r = await api('GET', '/cardapio');
  assert.equal(r.status, 200);
  assert.ok(r.body.length >= 4);
});

test('POST /cardapio cria um item e ele aparece no cardápio', async () => {
  const nome = `Teste ${Date.now()}`;
  const criado = await api('POST', '/cardapio', { nome, preco: 3.25 });
  assert.equal(criado.status, 201);
  const lista = await api('GET', '/cardapio');
  assert.ok(lista.body.some((i) => i.nome === nome && i.preco === 3.25));
});

test('POST /cardapio rejeita dados inválidos', async () => {
  const r = await api('POST', '/cardapio', { nome: '', preco: -1 });
  assert.equal(r.status, 400);
});

test('fluxo completo: criar pedido, calcular total e avançar status', async () => {
  const cardapio = (await api('GET', '/cardapio')).body;
  const [a, b] = cardapio;
  const pedido = await api('POST', '/pedidos', {
    cliente: 'Aluno Teste',
    itens: [
      { item_id: a.id, quantidade: 2 },
      { item_id: b.id, quantidade: 1 },
    ],
  });
  assert.equal(pedido.status, 201);
  assert.equal(pedido.body.total, Math.round((a.preco * 2 + b.preco) * 100) / 100);
  assert.equal(pedido.body.status, 'PENDENTE');

  const id = pedido.body.id;
  const ok = await api('PATCH', `/pedidos/${id}/status`, { status: 'EM_PREPARO' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.status, 'EM_PREPARO');

  const invalido = await api('PATCH', `/pedidos/${id}/status`, { status: 'ENTREGUE' });
  assert.equal(invalido.status, 409);

  const lista = await api('GET', '/pedidos');
  assert.ok(lista.body.some((p) => p.id === id));
});

test('POST /pedidos rejeita item inexistente', async () => {
  const r = await api('POST', '/pedidos', {
    cliente: 'Aluno',
    itens: [{ item_id: 999999, quantidade: 1 }],
  });
  assert.equal(r.status, 400);
});

test('PATCH /pedidos/:id/status retorna 404 para pedido inexistente', async () => {
  const r = await api('PATCH', '/pedidos/999999/status', { status: 'PRONTO' });
  assert.equal(r.status, 404);
});

test('GET / serve a página web do EstuLanches', async () => {
  const res = await fetch(BASE + '/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(await res.text(), /EstuLanches/);
});
