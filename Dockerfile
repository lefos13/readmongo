# getting base image ubuntu
FROM alpine:latest 

RUN apk add --no-cache nodejs npm

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN npm --prefix swarmlab-app/src install 
RUN npm install pm2 -g 

# RUN npm --prefix /swarmlab-app/src install express

EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config.js"]