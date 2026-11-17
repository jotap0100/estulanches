-- Executado automaticamente pelo Postgres na primeira inicialização do volume.

CREATE TABLE IF NOT EXISTS cardapio (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  preco      NUMERIC(8,2) NOT NULL CHECK (preco > 0),
  disponivel BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pedidos (
  id        SERIAL PRIMARY KEY,
  cliente   VARCHAR(100) NOT NULL,
  total     NUMERIC(10,2) NOT NULL,
  status    VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id             SERIAL PRIMARY KEY,
  pedido_id      INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  item_id        INTEGER NOT NULL REFERENCES cardapio(id),
  quantidade     INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(8,2) NOT NULL
);

INSERT INTO cardapio (nome, preco) VALUES
  ('Pão de queijo', 4.50),
  ('Coxinha', 6.00),
  ('Suco natural', 5.50),
  ('Sanduíche natural', 8.00);
