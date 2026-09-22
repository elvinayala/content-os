# Agente de Resuelto · Railway
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=3100
EXPOSE 3100
CMD ["node", "dist/index.js"]
