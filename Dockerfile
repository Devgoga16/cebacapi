# =====================================================================
# Dockerfile — cebacapi (Express + MongoDB)
# =====================================================================

# ── Stage 1: Instalar dependencias de producción ──────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
# (sharp necesita rebuild nativo, --ignore-scripts no aplica aquí)
RUN npm ci --omit=dev

# ── Stage 2: Imagen final de producción ───────────────────────────────
FROM node:22-alpine AS runner

# Instalar librerías nativas requeridas por sharp y bcrypt
RUN apk add --no-cache \
    libc6-compat \
    vips-dev

WORKDIR /app

# Copiar node_modules ya instalados
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente de la API
COPY src ./src

# Copiar archivos de configuración raíz
COPY package.json ./

# Crear usuario sin privilegios para mayor seguridad
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 apiuser \
 && chown -R apiuser:nodejs /app

USER apiuser

# Puerto expuesto (configurable por variable de entorno)
EXPOSE 3000

# Variables de entorno por defecto (sobreescribir en runtime)
ENV NODE_ENV=production \
    PORT=3000

# Healthcheck: verifica que el servidor responda
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

# Comando de inicio
CMD ["node", "src/server.js"]
