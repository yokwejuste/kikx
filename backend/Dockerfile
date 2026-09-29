FROM rust:1-bookworm AS build
WORKDIR /app
COPY . .
RUN cargo build --release --locked --bin kikx-backend

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --no-create-home kikx
COPY --from=build /app/target/release/kikx-backend /usr/local/bin/kikx-backend
USER kikx
ENV KIKX_BIND=0.0.0.0 \
    KIKX_PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${KIKX_PORT}/api/health" || exit 1
CMD ["kikx-backend"]
