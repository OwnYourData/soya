#!/bin/bash

# build script for soya-web-cli
#
#   ./build.sh                    build a local image for the current platform
#                                 (oydeu/soya-web-cli:<tag>, loaded into docker)
#   ./build.sh --dockerhub        build linux/amd64 + linux/arm64 and push
#                                 oydeu/soya-web-cli:<tag> and :latest
#   --tag <tag>                   tag to use (default: date as YYMMDD)
#   --clean                       build without cache
#
# The build context is the repository root (see web-cli/Dockerfile).

CONTAINER="soya-web-cli"
REPOSITORY="oydeu"
TAG="$(date +%y%m%d)"
PLATFORMS="linux/amd64,linux/arm64"
DOCKERFILE="./web-cli/Dockerfile"

BUILD_CLEAN=false
DOCKER_UPDATE=false

while [ $# -gt 0 ]; do
    case "$1" in
        --clean)
            BUILD_CLEAN=true
            ;;
        --dockerhub)
            DOCKER_UPDATE=true
            ;;
        --tag)
            shift
            TAG="$1"
            ;;
        *)
            printf "unknown option: %s\n" "$1"
            exit 1
            ;;
    esac
    shift
done

# change into repository root (parent of this script's directory)
cd "$(dirname "$0")/.." || exit 1

CACHE_OPT=""
if $BUILD_CLEAN; then
    CACHE_OPT="--no-cache"
fi

IMAGE="$REPOSITORY/$CONTAINER"

if $DOCKER_UPDATE; then
    docker buildx build $CACHE_OPT --platform "$PLATFORMS" -f "$DOCKERFILE" \
        -t "$IMAGE:$TAG" -t "$IMAGE:latest" --push . || exit 1
    echo
    echo "pushed $IMAGE:$TAG and $IMAGE:latest"
    docker buildx imagetools inspect "$IMAGE:$TAG"
else
    docker build $CACHE_OPT -f "$DOCKERFILE" -t "$IMAGE:$TAG" . || exit 1
    echo
    echo "built $IMAGE:$TAG (local)"
fi
