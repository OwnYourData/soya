FROM maven:3-openjdk-8 as java_builder

WORKDIR /app

RUN git clone https://github.com/bazaarvoice/jolt.git && \
    cd jolt && \
    mvn clean package

CMD ["bash"]