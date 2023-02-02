FROM node:19 as node_builder

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

FROM ruby:3.1.3-alpine
MAINTAINER "Christoph Fabianek" christoph@ownyourdata.eu

RUN addgroup -S user && \
    adduser -S user -G user && \
    apk add --no-cache libsodium-dev git make gcc musl-dev jq npm openjdk8 bash curl && \
    gem install httparty ed25519 multibases multihashes multicodecs json-canonicalization optparse rbnacl dag uri oydid && \
    gem install securerandom -v 0.1.1 && \
    apk del make gcc musl-dev && \
    apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python && \
    python3 -m ensurepip && \
    pip3 install --no-cache --upgrade pip setuptools pytest requests pytest-subprocess && \
    wget https://raw.githubusercontent.com/OwnYourData/oydid/main/cli/oydid.rb -O /usr/local/bin/oydid && \
    chmod 755 /usr/local/bin/oydid && \
    mkdir -p /usr/src/app/jolt

COPY --chown=user:user --from=node_builder /app/dist /usr/src/app/dist
COPY --chown=user:user --from=node_builder /app/res /usr/src/app/res
COPY --chown=user:user --from=node_builder /app/*.json /usr/src/app/
COPY --chown=user:user --from=java_builder /app/jolt/cli/target/jolt-cli-0.1.8-SNAPSHOT.jar /usr/src/app/jolt
WORKDIR /usr/src/app
COPY ./docker/start.sh /usr/local/bin/start.sh
COPY --chown=user:user ./docker ./docker
RUN npm install --only=prod && \
    npm run bin && \
    chown -R user:user /usr/src/app && \
    sed -e "s/\${soya}/`soya --version`/" -e "s/\${jq}/`jq --version`/" docker/welcome.txt > /etc/motd && \
    ln -s /usr/src/app/docker/jolt /usr/local/bin

USER user
WORKDIR /home/user
CMD ["/usr/local/bin/start.sh"]

