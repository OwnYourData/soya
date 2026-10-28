# soya-web-cli image (multi-arch: linux/amd64, linux/arm64)
#
# build context is the REPOSITORY ROOT (shared .dockerignore), build with:
#   web-cli/build.sh                 local image for the current platform
#   web-cli/build.sh --dockerhub     multi-arch image, pushed with a dated tag and latest
#
# soya-js comes from the npm registry as pinned in package-lock.json.
# Base images are pinned by the digest of their multi-arch index (CC-ADR 0015).

FROM node:24@sha256:6449e19d8184d84062525b6a7524def03146c2cb04a7f08b076680d0e8e4240a AS builder

WORKDIR /app
ENV NODE_ENV=development

COPY ["web-cli/package.json", "web-cli/package-lock.json", "web-cli/tsconfig.json", "./"]
RUN npm ci

COPY ./web-cli/src ./src
RUN npm run build && npm prune --omit=dev

####################################

FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53

WORKDIR /app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY ./web-cli/http-openapi.json ./http-openapi.json

ENV NODE_ENV=production
ENTRYPOINT ["node", "dist/index.js"]
