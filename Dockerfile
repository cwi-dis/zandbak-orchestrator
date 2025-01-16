FROM node:22-bookworm-slim

ADD . /code/
ADD ./package[s] /packages

WORKDIR /code

# Install Python for TCP reflector
RUN apt update && apt install -y python3

RUN yarn install && \
    yarn build && \
    yarn cache clean --all

EXPOSE 8090
EXPOSE 8091
EXPOSE 8092
EXPOSE 8093
EXPOSE 8094
EXPOSE 8095
EXPOSE 8096
EXPOSE 8097
EXPOSE 8098
EXPOSE 8099

CMD ["yarn", "start"]
