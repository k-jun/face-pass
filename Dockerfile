FROM node:10-alpine

COPY . /app
WORKDIR /app

RUN npm install
RUN npm install --prefix client
RUN npm install --prefix server

# pythonが必要って言われる...

CMD npm run start