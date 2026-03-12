FROM rust:1.75 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY shared ./shared
COPY payment-service ./payment-service
RUN cargo build --release -p payment-service

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/payment-service .
ENV RUST_LOG=info
EXPOSE 3002
CMD ["./payment-service"]
