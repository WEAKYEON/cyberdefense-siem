# CyberDefense SIEM (Log Management Demo)

โปรเจกต์ระบบศูนย์กลางจัดเก็บและวิเคราะห์ข้อมูลจราจรทางคอมพิวเตอร์ (Log Management System / SIEM) พัฒนาขึ้นสำหรับการทดสอบภาคปฏิบัติ Full-Stack Developer (Intern) 

ระบบนี้รองรับการรับข้อมูลจากหลายแหล่ง (Multiple Ingestion Sources), ทำการแปลงข้อมูลให้อยู่ในรูปแบบมาตรฐาน (Normalization), จัดเก็บ, แจ้งเตือน (Alerting) และแสดงผลผ่าน Dashboard พร้อมระบบจัดการสิทธิ์ผู้ใช้งาน (RBAC)

## ฟีเจอร์หลัก (Key Features)
- **Multi-protocol Ingestion:** รองรับการรับ Log ผ่าน `HTTP POST (JSON)` และ `Syslog (UDP Port 514)`
- **Data Normalization:** แปลงข้อมูลจากต่างแหล่ง (Firewall, API, AD, CrowdStrike) ให้อยู่ใน Schema กลาง
- **Real-time Dashboard:** แสดงผลสถิติ กราฟ และประวัติ Log ล่าสุด
- **Brute Force Alerting:** ระบบตรวจจับและแจ้งเตือนเมื่อมีการล็อกอินล้มเหลวเกินกำหนด (3 ครั้งใน 5 นาที)
- **RBAC & Multi-tenant:** แยกสิทธิ์การมองเห็นข้อมูลระหว่าง Admin และ Customer (Viewer)
- **Data Retention:** ระบบทำความสะอาดลบ Log ที่เก่ากว่า 7 วันโดยอัตโนมัติ

## วิธีการติดตั้งและรันระบบ (Appliance Mode)
ระบบถูกแพ็กเกจด้วย Docker Compose เพื่อให้ง่ายต่อการติดตั้งและทดสอบบนเครื่องเดียว (VM / Local Machine)

**คำสั่งรันระบบ:**
```bash
docker-compose up --build -d
```
*(ระบบจะใช้เวลา Build Frontend และ Backend ประมาณ 1-2 นาที)*

**การเข้าใช้งาน:**
เมื่อ Container ทั้ง 3 ตัว (db, backend, frontend) รันสำเร็จ สามารถเข้าใช้งานได้ที่:
**URL:** http://localhost

## บัญชีสำหรับทดสอบ (Demo Accounts)
เพื่อทดสอบระบบ Role-Based Access Control (RBAC) กรุณาใช้บัญชีดังต่อไปนี้:

1. **Super Admin** (ดูได้ทุก Tenant)
   - Username: `admin`
   - Password: `admin`
2. **Customer A** (ดูได้เฉพาะข้อมูลของ Tenant 'demoA')
   - Username: `user_a`
   - Password: `password`

## การทดสอบยิง Log (Ingestion Test)
ท่านสามารถทดสอบยิง Log เข้าระบบได้ 2 ช่องทาง:
1. **HTTP API (Port 5000):** `POST http://localhost:5000/ingest` (มีไฟล์ Postman Collection แนบมาในโฟลเดอร์)
2. **Syslog UDP (Port 514):** สามารถเลือกทดสอบได้ 2 วิธี:
   - **วิธีที่ 1 (Linux/Mac):** ใช้คำสั่ง Netcat
     ```bash
     echo "<134>Aug 20 12:44:56 fw01 vendor=demo action=deny src=10.0.1.10" | nc -u -w1 127.0.0.1 514
     ```
   - **วิธีที่ 2 (Windows/Cross-platform):** รันสคริปต์จำลองที่เตรียมไว้ให้ (ผ่าน Node.js)
     ```bash
     node samples/send_syslog.js
     ```
## การทดสอบระบบ (Testing & DX)
โปรเจกต์นี้ได้เตรียมโครงสร้างสำหรับการทำ Unit/Integration Test ไว้ในโฟลเดอร์ `/tests` 
ครอบคลุมการทดสอบ API Ingestion, Alert Generation และ Data Normalization

**วิธีรันการทดสอบ (Mock Test):**
```bash
make test
```