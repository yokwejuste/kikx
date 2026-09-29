FROM python:3.13-slim AS docs
RUN apt-get update \
    && apt-get install -y --no-install-recommends make \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /docs
COPY docs/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
ARG KIKX_DOCS_URL
COPY docs/ .
RUN make html-all

FROM node:24-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_KIKX_API_URL
ENV NEXT_PUBLIC_KIKX_API_URL=$NEXT_PUBLIC_KIKX_API_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .
COPY --from=docs /docs/build/html ./public/docs
RUN if [ -z "$NEXT_PUBLIC_KIKX_API_URL" ]; then \
        echo "Set the NEXT_PUBLIC_KIKX_API_URL build argument to the backend URL" >&2; exit 1; \
    fi \
    && npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/" || exit 1
CMD ["node", "server.js"]
