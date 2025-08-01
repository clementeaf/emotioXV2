# Multi-stage build para Next.js SSR monorepo
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y lockfiles primero para aprovechar cache
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Instalar dependencias solo una vez
RUN npm install --legacy-peer-deps --include=dev

# Copiar solo el código fuente necesario
COPY shared ./shared
COPY frontend ./frontend

# Copiar .env.production al lugar correcto para el build
COPY frontend/.env.production ./frontend/.env.production

# Build del frontend con variables correctas
WORKDIR /app/frontend
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Copiar solo node_modules y el frontend compilado
COPY --from=builder /app/frontend .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./node_modules/@emotiox/shared

# Limpiar archivos de desarrollo
RUN rm -rf node_modules/.cache && rm -rf frontend/.next/cache || true

EXPOSE 3000

CMD ["npm", "start"]
