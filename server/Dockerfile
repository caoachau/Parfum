# ---------- build stage ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
# Dung npm ci khi co lockfile (tai lap chinh xac); fallback npm install neu chua commit lockfile.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# ---------- runtime stage ----------
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY --from=build /app/dist ./dist
# Chay bang user khong dac quyen (image node co san user 'node').
USER node
EXPOSE 5000
# Healthcheck goi /api/health (fetch co san tu Node 18+).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
