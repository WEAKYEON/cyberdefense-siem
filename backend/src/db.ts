import { Pool } from 'pg';

// ใช้ Environment Variable ถ้ามี หรือใช้ค่า Default สำหรับรันในเครื่อง Local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:adminpassword@localhost:5432/log_management'
});

export const initDB = async () => {
  // 1. ตารางเก็บ Log ปกติ
  await pool.query(`
    CREATE TABLE IF NOT EXISTS unified_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
      tenant VARCHAR(50) NOT NULL,
      source VARCHAR(50) NOT NULL,
      event_type VARCHAR(100),
      severity INTEGER DEFAULT 0,
      src_ip VARCHAR(50),
      user_name VARCHAR(100),
      action VARCHAR(50),
      raw_data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // สร้าง Index เพื่อให้ค้นหา Log ได้เร็วขึ้น (โดยเฉพาะการค้นหาตาม tenant และ timestamp)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_unified_logs_tenant ON unified_logs(tenant);
    CREATE INDEX IF NOT EXISTS idx_unified_logs_timestamp ON unified_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_unified_logs_raw_data ON unified_logs USING GIN (raw_data);
  `);

  // 2. ตารางเก็บข้อมูลการแจ้งเตือน (Alerts)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      tenant VARCHAR(50) NOT NULL, -- 👈 เพิ่ม Tenant เพื่อให้ทำ RBAC ได้สมบูรณ์
      rule_name VARCHAR(100),
      message TEXT,
      src_ip VARCHAR(50),
      severity INTEGER DEFAULT 10
    );
  `);

  // สร้าง Index ให้ Alert ด้วย
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON alerts(tenant);
  `);

  console.log('✅ Database initialized with unified_logs and alerts tables (with Indexes!)');
};

export default pool;