FROM oven/bun:1.2
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY src ./src
COPY swatch-assets ./swatch-assets
EXPOSE 3000
CMD ["bun", "src/index.ts"]
