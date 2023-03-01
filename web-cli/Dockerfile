FROM node:18 as builder

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
COPY ./dist ./dist

RUN npm install --omit=dev

####################################

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app /app

ENV NODE_ENV=production
ENTRYPOINT ["node", "dist/index.js"]