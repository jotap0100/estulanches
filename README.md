# EstuLanches

Gestão de cardápio e pedidos da cantina escolar. Node.js 22 + Express + PostgreSQL 16, em containers Docker.

## Implantação

```bash
cp .env.example .env        # ajuste a senha do banco
docker compose up -d --build
docker compose ps           # estado dos serviços e portas
docker compose logs         # logs de inicialização
curl localhost:3000/health
```

Ou tudo de uma vez: `./scripts/validar.sh`

## Interface web

Após subir, abra **http://localhost:3000/**: cardápio, carrinho, finalização de pedido e acompanhamento de status.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /health | Saúde da app e do banco |
| GET | /cardapio | Lista o cardápio |
| POST | /cardapio | `{ "nome": "...", "preco": 5.5 }` |
| POST | /pedidos | `{ "cliente": "Ana", "itens": [{ "item_id": 1, "quantidade": 2 }] }` |
| GET | /pedidos | Lista pedidos |
| PATCH | /pedidos/:id/status | `{ "status": "EM_PREPARO" }` — fluxo: PENDENTE → EM_PREPARO → PRONTO → ENTREGUE (CANCELADO permitido antes de PRONTO) |

## Testes

```bash
npm ci
npm run test:unit          # regras de negócio, sem banco
npm run test:integration   # exige a stack no ar (docker compose up -d)
```
