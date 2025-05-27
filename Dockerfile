FROM alpine:3.21.3

WORKDIR /code
EXPOSE 8090

RUN apk add --no-cache npm && \
    npm install -g yarn

ADD ./package[s] /packages

ADD ./package.json /code/
ADD ./yarn.lock /code/

RUN yarn install

ADD . /code

RUN yarn build && \
    yarn cache clean --all

CMD ["yarn", "start"]
