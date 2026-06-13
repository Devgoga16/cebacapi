# Etapa 1: Build (con herramientas para compilar módulos nativos)
FROM node:18-alpine AS builder

WORKDIR /app

# Herramientas necesarias para bcrypt y sharp (módulos con código nativo)
RUN apk add --no-cache python3 make g++ vips-dev

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción (se recompilan para Linux aquí)
RUN npm ci --only=production

# Etapa 2: Production
FROM node:18-alpine

WORKDIR /app

# Librerías de runtime para sharp y bcrypt
RUN apk add --no-cache libvips libstdc++

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias desde builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=3000

# Health check (apunta al endpoint /health añadido en app.js)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar la aplicación
CMD ["node", "src/server.js"]
