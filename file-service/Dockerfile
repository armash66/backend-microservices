FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN rm -f .env
# Ensure uploads directory exists inside container just in case
RUN mkdir -p /app/uploads
EXPOSE 3003
CMD ["sh", "-c", "for i in 1 2 3 4 5; do npm run migrate up && break || sleep 3; done && node src/index.js"]
