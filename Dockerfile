FROM node:22-alpine3.18

ADD . /code/
ADD ./package[s] /packages

WORKDIR /code

# These packages are needed to run evanescent and the webrtc sfu
RUN apk add gcompat
# Add evanescent directory to search path
RUN echo "/lib:/usr/local/lib:/usr/lib:/packages/evanescent" > /etc/ld-musl-x86_64.path
# Install Python for TCP reflector
RUN apk add --update --no-cache python3

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
