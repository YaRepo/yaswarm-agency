FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    git \
    jq \
    python3 \
    ripgrep \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
RUN chmod +x /app/cli/yaswarm /app/scripts/*.sh

ENV MCP_INSPECTOR_CLIENT_PORT=6274
ENV MCP_INSPECTOR_SERVER_PORT=6277

EXPOSE 6274 6277

ENTRYPOINT ["/app/cli/yaswarm"]
CMD ["help"]
