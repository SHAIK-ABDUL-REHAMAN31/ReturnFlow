FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
USER appuser
EXPOSE 3000
CMD ["npm", "start"]
