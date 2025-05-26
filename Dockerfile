FROM ubuntu:24.04

RUN apt update && \
    apt install -y npm && \
    npm install -g yarn

ADD . /code/
ADD ./package[s] /packages

WORKDIR /code

RUN yarn install && \
    yarn build && \
    yarn cache clean --all

EXPOSE 8090

CMD ["yarn", "start"]
