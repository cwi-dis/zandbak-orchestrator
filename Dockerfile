FROM node:21-alpine3.17

ADD . /code/
WORKDIR /code

RUN yarn install && \
    yarn build && \
    yarn cache clean --all

EXPOSE 3000 3001
CMD ["yarn", "start"]
