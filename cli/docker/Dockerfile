FROM node:16 as node_builder

WORKDIR /app
ENV NODE_ENV=development
COPY *.json ./
COPY ./res ./res
COPY ./src ./src
RUN npm install && \
    npm run build

#########################################

FROM maven:3-openjdk-8 as java_builder

RUN mkdir -p /app && \
    cd /app && \
    git clone https://github.com/bazaarvoice/jolt.git && \
    cd jolt && \
    mvn clean package
WORKDIR /app

#########################################

FROM ruby:2.5.9-alpine
MAINTAINER "Christoph Fabianek" christoph@ownyourdata.eu

RUN addgroup -S user && \
    adduser -S user -G user && \
    apk add --no-cache libsodium-dev git make gcc musl-dev jq npm openjdk8 bash curl && \
    gem install securerandom httparty ed25519 multibases multihashes multicodecs optparse rbnacl dag uri && \
    gem install json-canonicalization -v 0.2.1 && \
    apk del make gcc musl-dev && \
    wget https://raw.githubusercontent.com/OwnYourData/oydid/main/cli/oydid.rb -O /usr/local/bin/oydid && \
    chmod 755 /usr/local/bin/oydid && \
    mkdir -p /usr/src/app/jolt

COPY --chown=user:user --from=node_builder /app/dist /usr/src/app/dist
COPY --chown=user:user --from=node_builder /app/res /usr/src/app/res
COPY --chown=user:user --from=node_builder /app/*.json /usr/src/app/
COPY --chown=user:user --from=java_builder /app/jolt/cli/target/jolt-cli-0.1.6-SNAPSHOT.jar /usr/src/app/jolt
WORKDIR /usr/src/app
COPY --chown=user:user ./docker ./docker
ENV NODE_ENV=development
RUN npm install && \
    npm run bin && \
    chown -R user:user /usr/src/app && \
    sed -e "s/\${soya}/`soya --version`/" -e "s/\${jq}/`jq --version`/" docker/welcome.txt > /etc/motd && \
    ln -s /usr/src/app/docker/jolt /usr/local/bin

USER user
WORKDIR /home/user
COPY docker/home .

CMD ["bash"]