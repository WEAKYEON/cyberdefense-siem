import express, { Request, Response } from 'express';
import cors from 'cors';
import dgram from 'dgram'; // เพิ่ม dgram สำหรับทำ UDP Server
import pool, { initDB } from './db';
import { normalizeLog } from './normalizer';

const app = express();
app.use(cors());
app.use(express.json());

// API สำหรับ Login (จำลองผู้ใช้งาน 3 คน)
app.post('/login', (req: Request, res: Response): any => {
    const { username, password } = req.body;

    // 1. แอดมิน (เห็นข้อมูลทุก Tenant)
    if (username === 'admin' && password === 'admin') {
        return res.json({ token: 'mock-token-admin', role: 'admin', tenant: 'all', name: 'Super Admin' });
    }
    // 2. ลูกค้า A (เห็นเฉพาะข้อมูลของ demoA)
    else if (username === 'user_a' && password === 'password') {
        return res.json({ token: 'mock-token-a', role: 'viewer', tenant: 'demoA', name: 'Customer A' });
    }
    // 3. ลูกค้าทั่วไป (เห็นเฉพาะข้อมูลของ demo)
    else if (username === 'user_demo' && password === 'password') {
        return res.json({ token: 'mock-token-demo', role: 'viewer', tenant: 'demo', name: 'Customer Demo' });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
});

// API สำหรับรับ Log เข้าสู่ระบบ (Ingestion - HTTP POST) 
app.post('/ingest', async (req: Request, res: Response): Promise<any> => {
    try {
        const rawLog = req.body;
        const normalized = normalizeLog(rawLog);

        // 1. บันทึก Log ลง Database ปกติ
        const insertLogQuery = `
      INSERT INTO unified_logs 
      (timestamp, tenant, source, event_type, severity, src_ip, user_name, action, raw_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;
    `;
        const values = [
            normalized.timestamp, normalized.tenant, normalized.source, normalized.event_type,
            normalized.severity, normalized.src_ip, normalized.user_name, normalized.action, normalized.raw_data
        ];
        const result = await pool.query(insertLogQuery, values);

        // ==========================================
        // ALERT LOGIC: ตรวจจับพฤติกรรมน่าสงสัย (Brute Force Detection)
        // ==========================================
        if (normalized.event_type === 'app_login_failed' || normalized.event_type === 'LogonFailed') {
            const ip = normalized.src_ip;

            if (ip) {
                const alertCheckQuery = `
          SELECT COUNT(*) 
          FROM unified_logs 
          WHERE src_ip = $1 
            AND (event_type = 'app_login_failed' OR event_type = 'LogonFailed')
            AND timestamp >= NOW() - INTERVAL '5 minutes'
        `;
                const alertRes = await pool.query(alertCheckQuery, [ip]);
                const failCount = parseInt(alertRes.rows[0].count, 10);

                if (failCount >= 3) {
                    const alertMessage = `ตรวจพบการเข้าสู่ระบบล้มเหลวผิดปกติ (${failCount} ครั้ง) จาก IP: ${ip}`;
                    console.log(`🚨 [ALERT TRIGGERED]: ${alertMessage}`);

                    // 🚨 แก้ไขตรงนี้: เพิ่ม tenant ลงไปในคำสั่ง INSERT
                    await pool.query(
                        `INSERT INTO alerts (tenant, rule_name, message, src_ip, severity) VALUES ($1, $2, $3, $4, $5)`,
                        [normalized.tenant, 'Brute Force Login', alertMessage, ip, 10]
                    );
                }
            }
        }
        // ==========================================

        res.status(201).json({ message: 'Log ingested successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error ingesting log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API สำหรับดึง Log ทั้งหมด (รองรับการ Filter ตาม Tenant)
app.get('/logs', async (req: Request, res: Response) => {
    try {
        const tenant = req.query.tenant as string;
        let query = 'SELECT * FROM unified_logs ';
        let params: any[] = [];

        if (tenant && tenant !== 'all') {
            query += 'WHERE tenant = $1 ';
            params.push(tenant);
        }

        query += 'ORDER BY timestamp DESC LIMIT 100';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API สำหรับดึง Alert (รองรับการ Filter ตาม Tenant)
app.get('/alerts', async (req: Request, res: Response) => {
    try {
        const tenant = req.query.tenant as string;
        let query = 'SELECT * FROM alerts ';
        let params: any[] = [];

        // 🚨 แก้ไขตรงนี้: ทำให้ดึงข้อมูล Alert ตาม Tenant ได้เหมือนกับตาราง Logs
        if (tenant && tenant !== 'all') {
            query += 'WHERE tenant = $1 ';
            params.push(tenant);
        }

        query += 'ORDER BY timestamp DESC LIMIT 50';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// 1. โปรโตคอล UDP สำหรับรับ Syslog (Port 514)
// ==========================================
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', async (msg, rinfo) => {
    try {
        const logString = msg.toString();
        console.log(`[Syslog UDP] Received from ${rinfo.address}: ${logString}`);

        // แปลง Text Syslog ให้เข้า Schema กลาง
        const normalized = {
            timestamp: new Date().toISOString(),
            tenant: 'demo', // กำหนดเป็น default
            source: 'syslog_network',
            event_type: 'syslog_event',
            severity: 5,
            src_ip: rinfo.address,
            user_name: 'unknown',
            action: 'unknown',
            raw_data: { raw: logString } // เก็บข้อความดิบไว้
        };

        await pool.query(
            `INSERT INTO unified_logs (timestamp, tenant, source, event_type, severity, src_ip, user_name, action, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [normalized.timestamp, normalized.tenant, normalized.source, normalized.event_type, normalized.severity, normalized.src_ip, normalized.user_name, normalized.action, normalized.raw_data]
        );
    } catch (error) {
        console.error('Syslog processing error:', error);
    }
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`Syslog UDP Server listening on port ${address.port}`);
});

// ผูกพอร์ต 514 เพื่อรอรับ Syslog
udpServer.bind(514);


// ==========================================
// 2. ระบบ Data Retention (ลบ Log เก่ากว่า 7 วัน)
// ==========================================
setInterval(async () => {
    try {
        console.log('🧹 [Retention Policy] Running cleanup for logs older than 7 days...');
        const result = await pool.query(`
      DELETE FROM unified_logs 
      WHERE timestamp < NOW() - INTERVAL '7 days'
    `);
        console.log(`[Retention Policy] Deleted ${result.rowCount} old logs.`);
    } catch (error) {
        console.error('Retention policy error:', error);
    }
}, 24 * 60 * 60 * 1000); // ทำงานทุกๆ 24 ชั่วโมง


// ==========================================
// เริ่มต้นเซิร์ฟเวอร์
// ==========================================
const PORT = process.env.PORT || 5000;

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Backend API running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});