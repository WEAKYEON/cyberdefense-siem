# Setup Guide: SaaS / Cloud Deployment

คู่มือนี้อธิบายแนวทางการนำระบบ CyberDefense SIEM ขึ้นไปให้บริการบน Public Cloud (เช่น AWS EC2, DigitalOcean Droplet) ในรูปแบบ SaaS (Software as a Service) พร้อมการตั้งค่าความปลอดภัย TLS (HTTPS)

## สถาปัตยกรรม Cloud & Security
สำหรับการทำ SaaS จะใช้โครงสร้าง Docker Compose เช่นเดียวกับ Appliance แต่จะเพิ่ม **Nginx (Reverse Proxy)** เพื่อรับโหลดจากภายนอก และทำ **TLS Termination** เพื่อเข้ารหัสข้อมูล (HTTPS)

## ขั้นตอนการนำขึ้น Cloud (Deployment Steps)

**1. เตรียม Cloud Virtual Machine**
- สร้าง Cloud VM สเปคขั้นต่ำ 4 vCPU, 8 GB RAM
- ตั้งค่า Firewall (Security Group) ให้เปิดรับเฉพาะ Port `80` (HTTP), `443` (HTTPS) และ `514` (UDP สำหรับ Syslog)

**2. ติดตั้งระบบผ่าน Docker**
SSH เข้าไปยัง Cloud VM แล้วทำการรันระบบ:
```bash
git clone <repository_url> cyberdefense-siem
cd cyberdefense-siem
docker-compose up --build -d
```

## การตั้งค่า TLS / HTTPS (Self-signed Certificate)
ตามข้อกำหนด หากยังไม่มี Domain Name สามารถใช้ Self-signed Certificate สำหรับการทดสอบ SaaS ได้ โดยมีขั้นตอนดังนี้:

**1. สร้าง Certificate (OpenSSL)**
สร้างไฟล์ `.crt` และ `.key` ภายในโฟลเดอร์ของ Nginx:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/nginx.key \
  -out ./nginx/ssl/nginx.crt
```

**2. คอนฟิก Nginx (Reverse Proxy)**
สร้างไฟล์ `nginx.conf` เพื่อบังคับ Redirect HTTP ไปยัง HTTPS และทำ Reverse Proxy ไปหา Frontend Container:
```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri; # บังคับใช้ HTTPS
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;

    location / {
        proxy_pass http://frontend:80;
    }

    location /api/ {
        proxy_pass http://backend:5000/;
    }
}
```

**3. การเข้าใช้งานโหมด SaaS**
- กรรมการสามารถเข้าใช้งานผ่าน `https://<Public_IP_ของ_Cloud_VM>`
- *หมายเหตุ: เบราว์เซอร์จะแจ้งเตือน "Your connection is not private" เนื่องจากเป็น Self-signed ให้กด Advanced -> Proceed to <IP> (unsafe) เพื่อเข้าสู่ระบบ*