FROM node:22-alpine3.18

ADD . /code/
ADD ./package[s] /packages

WORKDIR /code

RUN yarn install && \
    yarn build && \
    yarn cache clean --all

EXPOSE 8090
CMD ["yarn", "start"]
