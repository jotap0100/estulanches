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

## Vídeo de apresentação






ROTEIRO EXPLICAÇÃO 

Olá, eu sou [Seu Nome] e apresento o **EstuLanches**, um sistema criado para acabar com as filas, as anotações no papel e os erros de cálculo nas cantinas escolares. Ele digitaliza o cardápio, soma o pedido automaticamente e mostra o status do preparo em tempo real, tudo rodando em Node.js 22, Express e PostgreSQL 16 dentro de containers Docker.

Na infraestrutura, o `Dockerfile` usa uma imagem leve do Node (`node:22-alpine`), instala só o necessário para produção, roda com usuário sem privilégios (`USER node`) e verifica se a API está saudável na rota `/health`. Já o `docker-compose.yml` sobe dois containers juntos: o banco PostgreSQL com os dados salvos no volume `pgdata` e a aplicação, que só inicia depois que o banco estiver pronto (`service_healthy`), usando as senhas do arquivo `.env`.

Para garantir que tudo funciona sem erros, temos dois tipos de testes. Os testes unitários (`tests/unit/logic.test.js`) validam as regras de cálculo e os status sem precisar do banco, e os testes de integração (`tests/integration/api.test.js`) testam a API completa junto com o PostgreSQL, conferindo rotas, validações e erros.

No código, tudo fica bem separado dentro da pasta `src`: o `logic.js` guarda as regras de negócio, o `app.js` controla as rotas e grava os pedidos com segurança no banco, e o `server.js` faz a conexão inicial e o encerramento limpo. Já a pasta `public` traz a interface moderna com busca no cardápio, carrinho, filtros de pedidos e modo claro ou escuro.

Aqui no sistema funcionando em `http://localhost:3000`, podemos buscar um lanche, cadastrar um novo item, montar o pedido colocando o nome do aluno e finalizar. Assim que o pedido entra na lista como Pendente, conseguimos avançar o status para Em preparo, Pronto e Entregue, ou cancelar se necessário.

Toda essa entrega também está documentada na Ficha RDM (`docs/RDM_EstuLanches.pdf`), que mostra a versão implantada, os parâmetros do ambiente, os resultados dos testes, o checklist de verificação (`docs/CHECKLIST.md`) e o plano de reversão com `docker compose down` mantendo os dados intactos.

Na parte de segurança, a aplicação roda sem usuário administrador, a porta do banco (`5432`) fica fechada para fora e as senhas ficam protegidas no `.env`. Além disso, as consultas ao banco usam parâmetros para evitar invasões por SQL, a tela protege contra scripts maliciosos e o valor total é sempre calculado no servidor.

Por fim, se o EstuLanches crescesse para atender o Brasil inteiro, com 1 milhão de usuários e 100 mil acessos ao mesmo tempo na hora do recreio, bastaria evoluir a arquitetura em camadas: usar CDN para entregar o site mais rápido, colocar várias cópias da API atrás de um balanceador de carga, usar Redis para cache e filas de pedidos, dividir a carga do banco com réplicas de leitura e usar WebSockets para avisar quando o lanche ficar pronto em tempo real.

