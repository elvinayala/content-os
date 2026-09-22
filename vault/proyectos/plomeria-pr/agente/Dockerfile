# Agente de Resuelto · Railway
FROM node:20-alpine
WORKDIR /app
# Fuentes de marca para las imágenes que genera Tati (sharp/librsvg usa fontconfig)
RUN apk add --no-cache fontconfig curl && mkdir -p /usr/share/fonts/resuelto \
 && curl -fsSL -o /usr/share/fonts/resuelto/Sora.ttf 'https://raw.githubusercontent.com/google/fonts/main/ofl/sora/Sora%5Bwght%5D.ttf' \
 && curl -fsSL -o /usr/share/fonts/resuelto/DMSans.ttf 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf' \
 && fc-cache -f
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=3100
EXPOSE 3100
CMD ["node", "dist/index.js"]
