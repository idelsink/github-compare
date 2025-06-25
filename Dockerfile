# Build stage
FROM docker.io/library/node:22.17.0-alpine3.22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM docker.io/library/nginx:1.29.0-alpine

# Add metadata labels
LABEL org.opencontainers.image.title="GitHub Compare"
LABEL org.opencontainers.image.description="A simple web application to compare release notes between two GitHub releases"
LABEL org.opencontainers.image.authors="Ingmar Delsink"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/idelsink/github-compare"
LABEL org.opencontainers.image.documentation="https://github.com/idelsink/github-compare#readme"

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
