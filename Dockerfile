# Frontend de Dropspy (Next.js 16) para Easypanel (SPEC-002, fase 1).
#
#   docker build -t scout-frontend .
#   docker run -p 3000:3000 scout-frontend
#
# NEXT_PUBLIC_API_URL se incrusta en el JavaScript al compilar, por eso es un argumento de build.
# El valor por defecto es la API de producción (ya es pública: viaja en el JavaScript del sitio).
# Para otro backend: --build-arg NEXT_PUBLIC_API_URL=https://…/api
# Node 24 y pnpm 9 fijos: son los mismos del workflow sync-ads, que instala este lockfile a diario.

FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@9.15.9
WORKDIR /app

# Dependencias (se cachean mientras no cambien package.json ni pnpm-lock.yaml).
# Playwright es del sync de anuncios, no del sitio: no hace falta bajar navegadores.
FROM base AS deps
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG NEXT_PUBLIC_API_URL=https://mujertrendy-shoptracker-api.agb62a.easypanel.host/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec next build

# Imagen final: solo el servidor autónomo (output: 'standalone'), los estáticos y public/.
FROM node:24-slim AS run
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
