FROM node:14

RUN apt-get update -y; \
    add-apt-repository ppa:jonathonf/ffmpeg-4; \
    apt-get install ffmpeg -y

RUN mkdir -p /server

WORKDIR /server

ADD ./ /server

RUN yarn install; \
    yarn build

EXPOSE 3000

CMD [ "yarn", "on" ]