FROM oven/bun:latest

WORKDIR /app

# Copy package.json and bun.lock files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy all the backend code
COPY . .

EXPOSE 8080

CMD ["bun", "run", "index.ts"]
