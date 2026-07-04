FROM node:24 AS node_builder

WORKDIR /app
ENV NODE_ENV=development
# lib2 (soya-js) must be available in the build context,
# build this image from the repository root:
#   docker build -f cli2/docker/Dockerfile -t oydeu/soya-cli .
# (lib2 consumes semcon-js from the npm registry)
COPY ./lib2 /lib2
COPY ./cli2/package.json ./cli2/tsconfig.json ./
COPY ./cli2/res ./res
COPY ./cli2/src ./src
RUN cd /lib2 && npm install && npm run build && \
    cd /app && npm install && npm run build

#########################################

FROM ruby:3.4-alpine
LABEL org.opencontainers.image.authors="Christoph Fabianek <christoph@ownyourdata.eu>"

RUN addgroup -S user && \
    adduser -S user -G user && \
    apk add --no-cache vim libsodium-dev git make gcc musl-dev jq openjdk21-jre-headless bash curl py3-pip nodejs-current npm && \
    gem install httparty ed25519 multibases multihashes multicodecs json-canonicalization optparse rbnacl dag uri oydid && \
    gem install securerandom -v 0.1.1 && \
    apk del make gcc musl-dev && \
    apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python && \
    pip3 install --no-cache --upgrade pip setuptools pytest requests pytest-subprocess --break-system-packages && \
    wget https://raw.githubusercontent.com/OwnYourData/oydid/main/cli/oydid.rb -O /usr/local/bin/oydid && \
    chmod 755 /usr/local/bin/oydid

COPY --chown=user:user --from=node_builder /lib2 /usr/src/lib2
COPY --chown=user:user --from=node_builder /app/dist /usr/src/app/dist
COPY --chown=user:user --from=node_builder /app/res /usr/src/app/res
COPY --chown=user:user --from=node_builder /app/*.json /usr/src/app/
WORKDIR /usr/src/app
COPY ./cli2/docker/start.sh /usr/local/bin/start.sh
COPY --chown=user:user ./cli2/docker ./docker
RUN npm install --omit=dev && \
    npm run bin && \
    chown -R user:user /usr/src/app && \
    sed -e "s/\${soya}/`soya --version`/" -e "s/\${jq}/`jq --version`/" docker/welcome.txt > /etc/motd

USER user
WORKDIR /home/user
CMD ["/usr/local/bin/start.sh"]
