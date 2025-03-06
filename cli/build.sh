#!/bin/bash

CONTAINER="soya-cli"
REPOSITORY="oydeu"

# read commandline options
BUILD_CLEAN=false
DOCKER_UPDATE=false
BUILD_LOCAL=false
DOCKERFILE="./docker/Dockerfile"

while [ $# -gt 0 ]; do
    case "$1" in
        --clean*)
            BUILD_CLEAN=true
            ;;
        --local*)
            rm -f docker/local-gem/*
            cp ~/dev/oydid/ruby-gem/pkg/oydid-`cat ~/dev/oydid/ruby-gem/VERSION`.gem docker/local-gem
            BUILD_LOCAL=true
            DOCKERFILE="${DOCKERFILE}-local"
            ;;
        --dockerhub*)
            DOCKER_UPDATE=true
            ;;
        *)
            printf "unknown option(s)\n"
            if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
                return 1
            else
                exit 1
            fi
    esac
    shift
done

# docker build -f ./docker/Dockerfile.node -t oydeu/soya-cli:node .
# docker build -f ./docker/Dockerfile.java -t oydeu/soya-cli:java .

if $BUILD_CLEAN; then
    docker build --platform linux/amd64 --no-cache -f $DOCKERFILE -t $REPOSITORY/$CONTAINER .
else
    docker build --platform linux/amd64 -f $DOCKERFILE -t $REPOSITORY/$CONTAINER .
fi

if $DOCKER_UPDATE; then
    docker push $REPOSITORY/$CONTAINER
fi
