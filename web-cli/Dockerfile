FROM node:18 as builder

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
COPY ./dist ./dist

RUN npm install --omit=dev

####################################

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app /app

COPY ./http-openapi.json ./http-openapi.json

ENV NODE_ENV=production
ENTRYPOINT ["node", "dist/index.js"]