FROM node:21-alpine3.17

ADD . /code/
WORKDIR /code

RUN yarn install && \
    yarn build && \
    yarn cache clean --all

EXPOSE 8090
CMD ["yarn", "start"]
