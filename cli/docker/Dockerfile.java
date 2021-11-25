FROM maven:3-openjdk-8 as java_builder

RUN mkdir -p /app && \
    cd /app && \
    git clone https://github.com/bazaarvoice/jolt.git && \
    cd jolt && \
    mvn clean package
WORKDIR /app

CMD ["bash"]