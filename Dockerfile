
FROM sitespeedio/node:ubuntu-20.04-nodejs-14.17.1

RUN apt-get update -y;\
    apt-get install ffmpeg -y

RUN mkdir -p /server

WORKDIR /server

ADD ./ /server

RUN npm install; \
    npm run build

EXPOSE 3000

CMD [ "npm", "run", "on" ]