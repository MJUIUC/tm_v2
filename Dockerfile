FROM node:20.17.0-alpine3.19

WORKDIR /server

COPY package*.json /server/
COPY tsconfig.json /server/

COPY /prisma/schema.prisma /server/prisma/
COPY /src /server/src/

RUN npm install

RUN npx prisma generate

RUN npx tsc

EXPOSE 8080

ENV DATABASE_URL="postgresql://postgres:trade_machine_v2_admin@192.168.1.105:5432/trade_machine_v2?schema=public"

CMD ["node", "dist/main/Index.js"]
