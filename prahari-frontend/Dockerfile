# ====================================================================
# Prahari Frontend — Multi-stage Docker Build
# Stage 1: Build React app with Node
# Stage 2: Serve static files with Nginx
# ====================================================================

# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
# Note: VITE_MAPBOX_TOKEN must be passed as a build arg
COPY . .
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

# --- Runtime Stage ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy built React app
COPY --from=build /app/dist .

# Custom nginx config for SPA routing + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
