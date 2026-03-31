FROM node:22-alpine
WORKDIR /app

# ติดตั้ง Dependencies ก่อนเพื่อใช้ประโยชน์จาก Docker Cache
COPY package*.json ./
RUN npm install

# ก๊อปปี้ Source Code ทั้งหมด
COPY . .

# ประกาศพอร์ตว่า Backend รับข้อมูลทางไหนบ้าง
EXPOSE 5000
EXPOSE 514/udp

# 3. รันเซิร์ฟเวอร์
CMD ["npm", "run", "dev"]