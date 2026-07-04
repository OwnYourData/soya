#!/bin/bash

CONTAINER="soya-bud"
REPOSITORY="oydeu"
TAG="latest"

# read commandline options
BUILD_CLEAN=false
DOCKER_UPDATE=false
PLATFORM="linux/amd64"
BUILD_X86=true
DOCKERFILE="Dockerfile"

npm i
npm run build

while [ $# -gt 0 ]; do
    case "$1" in
        --clean*)
            BUILD_CLEAN=true
            ;;
        --dockerhub*)
            DOCKER_UPDATE=true
            ;;
        --x86*)
            BUILD_X86=true
            PLATFORM="linux/amd64"
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

if $BUILD_CLEAN; then
    docker build --platform $PLATFORM --no-cache -f $DOCKERFILE -t $REPOSITORY/$CONTAINER:$TAG .
else
    docker build --platform $PLATFORM -f $DOCKERFILE -t $REPOSITORY/$CONTAINER:$TAG .
fi

if $DOCKER_UPDATE; then
    docker push $REPOSITORY/$CONTAINER:$TAG
fi
