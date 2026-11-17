# Lista de Verificação — Implantação EstuLanches

| # | Item | Comando / Evidência | OK |
|---|------|---------------------|----|
| 1 | Dockerfile presente e imagem constrói sem erro | `docker compose build` | [ ] |
| 2 | docker-compose.yml válido | `docker compose config -q` | [x] |
| 3 | `.env` criado a partir de `.env.example` (senha alterada) | `cat .env` | [ ] |
| 4 | Containers `db` e `app` no estado *Up (healthy)* | `docker compose ps` | [ ] |
| 5 | Portas ativas: app 3000, banco apenas na rede interna | `docker compose ps` | [ ] |
| 6 | Logs do banco sem erros críticos | `docker compose logs db` | [ ] |
| 7 | Logs da app mostram "Conexão com o banco estabelecida" | `docker compose logs app` | [ ] |
| 8 | Tabelas e dados iniciais criados (init.sql) | `GET /cardapio` retorna 4 itens | [ ] |
| 9 | Endpoint de saúde responde `ok` e a página web abre | `localhost:3000/health` e `localhost:3000/` | [ ] |
| 10 | Testes unitários passam | `npm run test:unit` (8/8) | [x] |
| 11 | Testes de integração passam | `npm run test:integration` (8/8) | [x] |
| 12 | Dados persistem após `docker compose restart` | volume `pgdata` | [ ] |
| 13 | Ficha RDM preenchida e exportada em PDF | `docs/RDM_EstuLanches.pdf` | [x] |

Itens `[x]` foram verificados; os demais dependem de executar `./scripts/validar.sh` em
uma máquina com acesso ao Docker Hub.
