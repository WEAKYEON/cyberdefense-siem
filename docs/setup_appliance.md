# Setup Guide: Appliance Mode

คู่มือนี้อธิบายขั้นตอนการติดตั้งระบบ CyberDefense SIEM ในรูปแบบ **Hardware Appliance (Single Node/VM)** โดยใช้ Docker Compose ซึ่งออกแบบมาให้สามารถติดตั้งเสร็จสิ้นได้ภายในคำสั่งเดียว (One-click Deployment)

## ความต้องการของระบบ (Prerequisites)
- **OS:** Ubuntu 22.04+ หรือ Windows/macOS ที่ติดตั้ง Docker Desktop
- **Software:** Docker Engine และ Docker Compose v2+
- **Hardware ขั้นต่ำ:** 4 vCPU, 8 GB RAM, 40 GB Disk
- **Ports ที่ต้องว่าง:** - `80` (TCP) - สำหรับเข้าหน้า Dashboard (Frontend)
  - `5000` (TCP) - สำหรับรับ HTTP JSON API (Backend)
  - `5432` (TCP) - สำหรับ PostgreSQL (Database)
  - `514` (UDP) - สำหรับรับ Syslog

## ขั้นตอนการติดตั้ง (Installation Steps)

**1. นำเข้า Source Code**
แตกไฟล์ ZIP หรือ Clone Repository ลงในเครื่อง Appliance ของคุณ:
```bash
cd CyberDefense
```
**2. ตั้งค่า Environment Variables**
ทำการคัดลอกไฟล์ตัวอย่างและสร้างเป็นไฟล์ .env สำหรับตั้งค่าระบบ:
```Bash
cp .env.example .env
```
(สามารถเปิดไฟล์ .env เพื่อแก้ไขรหัสผ่าน Database หรือ Port ได้ตามต้องการ)

**3. รันระบบ (Start the Appliance)**
พิมพ์คำสั่งด้านล่างนี้ ระบบจะทำการ Build Image และรัน Container ทั้งหมดในโหมด Background:

```Bash
docker-compose up --build -d
```

**4. ตรวจสอบสถานะการทำงาน (Verify)**
ตรวจสอบว่า Container ทั้ง 3 ตัว (db, backend, frontend) ทำงานปกติ:
```bash
docker-compose ps
```

## การเข้าใช้งานระบบ
- **SIEM Dashboard:** เปิด Web Browser แล้วไปที่ `http://localhost` หรือ `http://<IP_ของเครื่อง_Appliance>`
- **HTTP API Endpoint:** `http://<IP_ของเครื่อง_Appliance>:5000/ingest`
- **Syslog Endpoint:** `<IP_ของเครื่อง_Appliance>:514` (UDP)

## การปิดระบบ (Teardown)
หากต้องการปิดและลบ Container ให้ใช้คำสั่ง:
```bash
docker-compose down
```
*(หากต้องการลบข้อมูล Database ด้วย ให้เพิ่ม flag `-v`)*