# ----------------------------------------------------------------------------
# Dockerfile de node-demo-typescript
#
# Build de la imagen:
#   docker build -t node-demo:latest .
#
# Estrategia en 3 fases (multi-stage):
#   1. deps    -> solo dependencias de PRODUCCIÓN (capa cacheadle aparte)
#   2. build   -> dependencias completas + compilación TypeScript
#   3. runtime -> imagen ligera: node_modules prod + dist/ + usuario sin root
# ----------------------------------------------------------------------------

# Imagen base alineada con la versión de Node usada en desarrollo (v24)
FROM node:24-alpine AS base
WORKDIR /app
# Los cambios en package*.json invalidan la caché de estas capas
COPY package*.json ./

# ----------------------------------------------------------------------------
# Fase DEPS: dependencias de producción
# ----------------------------------------------------------------------------
# NO usar `--ignore-scripts`: `bcrypt` descarga su binario nativo en el
# postinstall y sin él el módulo falla en tiempo de ejecución.
# `fetch-retries=5` hace más robusta la instalación ante cortes transitorios
# de red (común en runners de CI y en la descarga inicial de capas).
FROM base AS deps
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 1000 \
    && npm config set fetch-retry-maxtimeout 30000 \
    && npm ci --omit=dev \
    && npm cache clean --force

# ----------------------------------------------------------------------------
# Fase BUILD: dependencias completas (dev + prod) y compilación a dist/
# ----------------------------------------------------------------------------
FROM base AS build
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 1000 \
    && npm config set fetch-retry-maxtimeout 30000 \
    && npm ci
COPY tsconfig.json ./
# Copia el código fuente antes de compilar (respetando .dockerignore)
COPY src ./src
RUN npm run build

# ----------------------------------------------------------------------------
# Fase RUNTIME: imagen final sin devDependencies ni código fuente
# ----------------------------------------------------------------------------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# node_modules de producción + build compilado
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Usuario sin privilegios (buenas prácticas de Docker)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/public \
    && chown -R appuser:appgroup /app
USER appuser

# El cluster expone el puerto del servidor (Express). Si cambias PORT en .env,
# ajusta también EXPOSE.
EXPOSE 8000

# HEALTHCHECK: el servidor solo escucha tras conectar con la BD; durante el
# arranque puede responder 503/504, lo que hará que Docker reinicie el contenedor.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8000/docs/json || exit 1

CMD ["node", "dist/app.js"]