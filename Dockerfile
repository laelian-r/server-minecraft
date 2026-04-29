FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY . .

CMD ["npm", "run", "start"]