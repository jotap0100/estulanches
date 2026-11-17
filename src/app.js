const path = require('path');
const express = require('express');
const {
  STATUS_VALIDOS,
  calcularTotal,
  validarItemCardapio,
  validarPedido,
  transicaoPermitida,
} = require('./logic');

// `pool` é injetado (pg.Pool), o que facilita testar.
function criarApp(pool) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const asyncH = (fn) => (req, res, next) => fn(req, res, next).catch(next);

  app.get('/health', asyncH(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', versao: process.env.APP_VERSION || '1.0.0' });
  }));

  // ---- Cardápio ----
  app.get('/cardapio', asyncH(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, nome, preco::float AS preco, disponivel FROM cardapio ORDER BY id'
    );
    res.json(rows);
  }));

  app.post('/cardapio', asyncH(async (req, res) => {
    const erros = validarItemCardapio(req.body);
    if (erros.length) return res.status(400).json({ erros });
    const { rows } = await pool.query(
      'INSERT INTO cardapio (nome, preco) VALUES ($1, $2) RETURNING id, nome, preco::float AS preco, disponivel',
      [req.body.nome.trim(), req.body.preco]
    );
    res.status(201).json(rows[0]);
  }));

  // ---- Pedidos ----
  app.post('/pedidos', asyncH(async (req, res) => {
    const erros = validarPedido(req.body);
    if (erros.length) return res.status(400).json({ erros });

    const ids = req.body.itens.map((i) => i.item_id);
    const { rows: itensDb } = await pool.query(
      'SELECT id, preco::float AS preco, disponivel FROM cardapio WHERE id = ANY($1)',
      [ids]
    );
    const mapa = new Map(itensDb.map((i) => [i.id, i]));
    for (const i of req.body.itens) {
      const db = mapa.get(i.item_id);
      if (!db) return res.status(400).json({ erros: [`item ${i.item_id} não existe no cardápio`] });
      if (!db.disponivel) return res.status(400).json({ erros: [`item ${i.item_id} indisponível`] });
    }

    const linhas = req.body.itens.map((i) => ({
      item_id: i.item_id,
      quantidade: i.quantidade,
      preco: mapa.get(i.item_id).preco,
    }));
    const total = calcularTotal(linhas);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        "INSERT INTO pedidos (cliente, total) VALUES ($1, $2) RETURNING id, cliente, total::float AS total, status, criado_em",
        [req.body.cliente.trim(), total]
      );
      for (const l of linhas) {
        await client.query(
          'INSERT INTO pedido_itens (pedido_id, item_id, quantidade, preco_unitario) VALUES ($1,$2,$3,$4)',
          [rows[0].id, l.item_id, l.quantidade, l.preco]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ ...rows[0], itens: linhas });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }));

  app.get('/pedidos', asyncH(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, cliente, total::float AS total, status, criado_em FROM pedidos ORDER BY id DESC'
    );
    res.json(rows);
  }));

  app.patch('/pedidos/:id/status', asyncH(async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!Number.isInteger(id)) return res.status(400).json({ erros: ['id inválido'] });
    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erros: [`status deve ser um de: ${STATUS_VALIDOS.join(', ')}`] });
    }
    const { rows } = await pool.query('SELECT status FROM pedidos WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ erros: ['pedido não encontrado'] });
    if (!transicaoPermitida(rows[0].status, status)) {
      return res.status(409).json({ erros: [`transição ${rows[0].status} -> ${status} não permitida`] });
    }
    const upd = await pool.query(
      'UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING id, cliente, total::float AS total, status',
      [status, id]
    );
    res.json(upd.rows[0]);
  }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[ERRO]', err.message);
    res.status(500).json({ erros: ['erro interno'] });
  });

  return app;
}

module.exports = { criarApp };
