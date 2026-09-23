FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run lint
RUN npm test
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/simpandulu.conf.template
COPY docker-entrypoint.d/10-simpandulu-runtime-config.sh /docker-entrypoint.d/10-simpandulu-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/10-simpandulu-runtime-config.sh

EXPOSE 80
