# CyberDefense SIEM (Log Management Demo)

**Live Cloud Demo:** [http://34.171.150.190](http://34.171.150.190)

โปรเจกต์ระบบศูนย์กลางจัดเก็บและวิเคราะห์ข้อมูลจราจรทางคอมพิวเตอร์ (Log Management System / SIEM) พัฒนาขึ้นสำหรับการทดสอบภาคปฏิบัติ Full-Stack Developer (Intern) 

ระบบนี้รองรับการรับข้อมูลจากหลายแหล่ง (Multiple Ingestion Sources), ทำการแปลงข้อมูลให้อยู่ในรูปแบบมาตรฐาน (Normalization), จัดเก็บ, แจ้งเตือน (Alerting) และแสดงผลผ่าน Dashboard พร้อมระบบจัดการสิทธิ์ผู้ใช้งาน (RBAC)

---

## Tech Stack
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Recharts, Lucide React
- **Backend:** Node.js (Express), TypeScript, Docker-compose
- **Database:** PostgreSQL (Relational Data Storage)
- **Ingestion:** Syslog UDP (Port 514), HTTP JSON API (Port 5000)

## ฟีเจอร์หลัก (Key Features)
- **Multi-protocol Ingestion:** รองรับการรับ Log ผ่าน `HTTP POST (JSON)` และ `Syslog (UDP Port 514)`
- **Data Normalization:** มี Parser สำหรับแปลง Log จากแหล่งต่างๆ ให้อยู่ใน Schema มาตรฐานเดียวกัน
- **Real-time Dashboard:** แสดงสถิติภาพรวม (Event Types) และประวัติ Log ล่าสุดแยกตามรายชื่อผู้ใช้
- **Role-Based Access Control (RBAC):** แยกสิทธิ์การมองเห็นข้อมูลอย่างชัดเจนระหว่าง Super Admin และ Customer (Multi-tenant)
- **Brute Force Alerting:** ระบบตรวจจับอัตโนมัติเมื่อมีการ Login ล้มเหลวเกิน 3 ครั้งภายใน 5 นาที
- **Automated Maintenance:** ระบบ Clean-up ข้อมูลอัตโนมัติเพื่อรักษาประสิทธิภาพของฐานข้อมูล

## บัญชีสำหรับทดสอบ (Demo Accounts)
| Role | Username | Password | Visibility |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin` | ดูข้อมูลได้ทุก Tenant |
| **Customer A** | `user_a` | `password` | ดูได้เฉพาะ Tenant 'demoA' |

---

## การติดตั้งและรันระบบ (Local Development)

### 1. เตรียมไฟล์ Environment
สร้างไฟล์ `.env` ที่ Root Directory โดยอ้างอิงจาก `.env.example`:
```env
DATABASE_URL=postgresql://admin:adminpassword@db:5432/log_management
PORT=5000
VITE_API_URL=http://localhost:5000
```
### 2. สั่งรันระบบด้วย Docker
```Bash
docker-compose up --build -d
```
**เข้าใช้งานหน้าเว็บได้ที่**: http://localhost

---


## การทดสอบยิง Log (Ingestion Test)
1. **ผ่าน HTTP API (Port 5000):**
**Endpoint:** `POST /api/logs`
**Headers:** `Content-Type: application/json`

**Example Payload (CrowdStrike / HTTP API):**
```json
{
  "tenant": "demoA",
  "source": "crowdstrike",
  "event_type": "malware_detected",
  "severity": 8,
  "src_ip": "192.168.1.100",
  "user_name": "unknown",
  "action": "quarantine"
}
```
**Example Payload (จำลอง Brute Force Alert จาก Microsoft AD):**
(หากยิง Payload นี้ซ้ำ 3 ครั้งภายใน 5 นาที ระบบจะสร้าง Alert ทันที)
```json
{
  "tenant": "demoA",
  "source": "ad",
  "event_type": "LogonFailed",
  "severity": 5,
  "src_ip": "203.0.113.77",
  "user_name": "demo\\eve",
  "action": "deny"
}
```

2. **ผ่าน Syslog UDP (Port 514)**
รองรับข้อมูลจาก Network Devices เช่น Firewall หรือ Router ผ่านโปรโตคอล Syslog มาตรฐาน (RFC 5424) โดยระบบมี Normalizer Parser คอยแปลงข้อมูลดิบให้เป็น Schema กลางโดยอัตโนมัติ
- **วิธีที่ 1 (Linux/Mac):** ใช้คำสั่ง Netcat (Linux/Mac) เพื่อจำลองการส่ง Syslog มาตรฐาน:
```Bash
echo "<134>Mar 31 12:44:56 fw01 action=deny src=10.0.1.50 tenant=demoA" | nc -u -w1 127.0.0.1 514
```

- **วิธีที่ 2 (Windows/Cross-platform):** รันสคริปต์จำลองที่เตรียมไว้ให้ 
```Bash
node samples/send_syslog.js
```

## การทดสอบระบบ (Testing & DX)
โปรเจกต์นี้ได้เตรียมโครงสร้างสำหรับการทำ Unit/Integration Test ไว้ในโฟลเดอร์ `/tests` 
ครอบคลุมการทดสอบ API Ingestion, Alert Generation และ Data Normalization

**วิธีรันการทดสอบ (Mock Test):**
```bash
make test
```

---

Developed by: Tanat Kunharee
