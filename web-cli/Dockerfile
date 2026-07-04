FROM node:24 AS builder

WORKDIR /app
ENV NODE_ENV=development

# build context is the REPOSITORY ROOT (the image needs ../lib2),
# build with:
#   docker build -f web-cli/Dockerfile -t oydeu/soya-web-cli .
# or from within web-cli/:  npm run docker
#
# once soya-js >= 0.10 is published to npm, the dependency in package.json
# can be switched to the published version and this Dockerfile simplified
# to a plain single-directory build again (see docs/maintainers/releases.md)
COPY ./lib2 /lib2
COPY ["web-cli/package.json", "web-cli/tsconfig.json", "./"]
COPY ./web-cli/src ./src

RUN cd /lib2 && npm install && npm run build && npm prune --omit=dev && \
    cd /app && npm install && npm run build && npm prune --omit=dev

####################################

FROM node:24-alpine

WORKDIR /app
# /lib2 must keep its location, node_modules/soya-js is a symlink to it
COPY --from=builder /lib2 /lib2
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY ./web-cli/http-openapi.json ./http-openapi.json

ENV NODE_ENV=production
ENTRYPOINT ["node", "dist/index.js"]
