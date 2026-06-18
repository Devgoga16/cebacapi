# Etapa 1: Build (con herramientas para compilar módulos nativos)
FROM node:18-alpine AS builder

WORKDIR /app

# python3/make/g++ son requeridos por bcrypt para compilar su addon nativo
# sharp >=0.30 ya incluye libvips empaquetado, no necesita vips-dev
# cairo/pango/jpeg/giflib/pixman + pkgconfig son requeridos por "canvas" (usado por chartjs-node-canvas)
RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev jpeg-dev giflib-dev

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción (recompila bcrypt para Linux aquí)
RUN npm ci --only=production

# Etapa 2: Production
FROM node:18-alpine

WORKDIR /app

# Librerías de runtime requeridas por "canvas" (chartjs-node-canvas las necesita en producción, no solo al compilar)
RUN apk add --no-cache cairo pango jpeg giflib

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias compiladas para Linux desde el builder
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

# Health check (apunta al endpoint /health en app.js)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar la aplicación
CMD ["node", "src/server.js"]
