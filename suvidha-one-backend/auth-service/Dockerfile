FROM rust:1.75 AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY shared ./shared
COPY auth-service ./auth-service

RUN cargo build --release -p auth-service

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/auth-service .
COPY keys ./keys

ENV RUST_LOG=info

EXPOSE 3001

CMD ["./auth-service"]
