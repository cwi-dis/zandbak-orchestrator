FROM alpine:3.21.3

RUN apk add --no-cache npm && \
    npm install -g yarn

ADD . /code/
ADD ./package[s] /packages

WORKDIR /code

RUN yarn install && \
    yarn build && \
    yarn cache clean --all

EXPOSE 8090

CMD ["yarn", "start"]
