FROM node:20-alpine AS build

WORKDIR /app
ENV NODE_OPTIONS=--openssl-legacy-provider

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
COPY --from=build /app/server.mjs ./server.mjs

RUN npm ci --omit=dev

EXPOSE 80

CMD ["node", "server.mjs"]