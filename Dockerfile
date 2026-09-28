FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src
COPY migrations ./migrations

EXPOSE 8080
CMD ["node", "src/index.js"]
