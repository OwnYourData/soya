#!/bin/bash

# build script for soya-cli (Node 24 stack)
# NOTE: must be executed from the repository root or from within cli2/,
# the docker build context is always the repository root (because the
# image also needs ../lib2)

CONTAINER="soya-cli"
REPOSITORY="oydeu"

# change into repository root (parent of this script's directory)
cd "$(dirname "$0")/.." || exit 1

# read commandline options
BUILD_CLEAN=false
DOCKER_UPDATE=false
DOCKERFILE="./cli2/docker/Dockerfile"

while [ $# -gt 0 ]; do
    case "$1" in
        --clean*)
            BUILD_CLEAN=true
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

# docker build -f ./cli2/docker/Dockerfile.node -t oydeu/soya-cli:node .

if $BUILD_CLEAN; then
    docker build --platform linux/amd64 --no-cache -f $DOCKERFILE -t $REPOSITORY/$CONTAINER .
else
    docker build --platform linux/amd64 -f $DOCKERFILE -t $REPOSITORY/$CONTAINER .
fi

if $DOCKER_UPDATE; then
    docker push $REPOSITORY/$CONTAINER
fi
