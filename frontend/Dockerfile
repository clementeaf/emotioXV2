# Multi-stage build para Next.js SSR monorepo
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración del monorepo
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Construir shared y frontend
RUN npm run build --workspace=shared
RUN npm run build --workspace=frontend

FROM node:20-alpine AS runner
WORKDIR /app
# Copiar node_modules del builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend ./
COPY --from=builder /app/shared ./node_modules/@emotiox/shared

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
