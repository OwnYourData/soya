#!/bin/bash

CONTAINER="soya-base"
REPOSITORY="oydeu"

# read commandline options
BUILD_CLEAN=false
DOCKER_UPDATE=false
BUILD_ARM=false
BUILD_X86=false


while [ $# -gt 0 ]; do
    case "$1" in
        --clean*)
            BUILD_CLEAN=true
            ;;
        --dockerhub*)
            DOCKER_UPDATE=true
            ;;
        --arm*)
            BUILD_ARM=true
            ;;
        --x86*)
            BUILD_X86=true
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
    rails r script/clean.rb
fi
if $BUILD_X86; then
    if $DOCKER_UPDATE; then
        if $BUILD_CLEAN; then
            docker buildx build --no-cache --platform linux/amd64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:latest --push .
        else
            docker buildx build --platform linux/amd64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:latest --push .
        fi
    else
        if $BUILD_CLEAN; then
            docker buildx build --no-cache --platform linux/amd64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:amd64 --push .
        else
            docker buildx build --platform linux/amd64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:amd64 --push .
        fi
    fi
elif $BUILD_ARM; then
    if $DOCKER_UPDATE; then
        if $BUILD_CLEAN; then
            docker buildx build --no-cache ---platform linux/arm64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:latest --push .
        else
            docker buildx build --platform linux/arm64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:latest --push .
        fi
    else
        if $BUILD_CLEAN; then
            docker buildx build --no-cache ---platform linux/arm64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:arm64 --push .
        else
            docker buildx build --platform linux/arm64  -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER:arm64 --push .
        fi
    fi
else
    if $BUILD_CLEAN; then
        docker build --no-cache -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER .
    else
        docker build -f ./docker/Dockerfile -t $REPOSITORY/$CONTAINER .
    fi
    if $DOCKER_UPDATE; then
        docker push $REPOSITORY/$CONTAINER
    fi
fi
