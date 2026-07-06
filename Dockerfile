# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm install

# Build the Astro app (server output -> ./dist)
COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Astro standalone server settings
ENV HOST=0.0.0.0
ENV PORT=4321

# Only ship what the server needs
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Run as the non-root user that the node image already provides
USER node

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
