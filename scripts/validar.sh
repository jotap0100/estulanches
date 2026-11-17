#!/usr/bin/env bash
# Implanta e valida o EstuLanches. Uso: ./scripts/validar.sh
set -e
[ -f .env ] || cp .env.example .env

echo "== 1. Build e subida dos containers =="
docker compose up -d --build

echo "== 2. Aguardando a aplicação ficar saudável =="
for i in $(seq 1 30); do
  curl -fs http://localhost:${APP_PORT:-3000}/health >/dev/null && break
  sleep 2
done

echo "== 3. Estado dos serviços e portas (docker compose ps) =="
docker compose ps

echo "== 4. Logs de inicialização (docker compose logs) =="
docker compose logs --no-color --tail=40
echo "-- Ocorrências de erro nos logs (esperado: nenhuma) --"
docker compose logs --no-color | grep -iE "error|fatal|panic" | grep -v "error_log" || echo "nenhuma"

echo "== 5. Testes =="
npm ci
npm test
