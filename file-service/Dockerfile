FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Ensure uploads directory exists inside container just in case
RUN mkdir -p /app/uploads
EXPOSE 3003
CMD ["node", "src/index.js"]
