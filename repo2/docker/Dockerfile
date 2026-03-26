FROM oydeu/dc-base
LABEL org.opencontainers.image.authors="Christoph Fabianek <christoph@ownyourdata.eu>"

COPY Gemfile.extend .
RUN bundle install && bundle update

COPY . .
COPY docker/private_soya_config.json public/config/oyd-databud.config.json

CMD ["./script/init.sh"]

EXPOSE 3000
