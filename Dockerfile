# ---- Imagem da aplicação EstuLanches ----
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Dependências primeiro (aproveita cache de camadas)
COPY package*.json ./
RUN npm ci --omit=dev

# Código da aplicação
COPY src ./src
COPY public ./public

# Executa como usuário não-root
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
