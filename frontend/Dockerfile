# ไฟล์: frontend/Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# รัน Vite ในโหมด dev หรือ preview
CMD ["npm", "run", "dev", "--", "--host"]