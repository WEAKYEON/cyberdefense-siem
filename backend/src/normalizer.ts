export const normalizeLog = (rawLog: any) => {
    // ดึงฟิลด์สำคัญออกมาตาม Schema กลางที่โจทย์แนะนำ
    const unified = {
        // ถ้าไม่มี @timestamp ส่งมา ให้ใช้เวลาปัจจุบันของเซิร์ฟเวอร์
        timestamp: rawLog['@timestamp'] || rawLog.timestamp || new Date().toISOString(),
        tenant: rawLog.tenant || 'default_tenant', // ควรมีค่า default ที่เป็น string เสมอ
        source: rawLog.source || 'unknown',
        event_type: rawLog.event_type || 'unknown',

        // ป้องกันกรณีคนส่ง severity มาเป็น String (เช่น "8" แทนที่จะเป็น 8)
        severity: rawLog.severity ? parseInt(rawLog.severity, 10) : 0,

        // จัดการความแตกต่างของชื่อฟิลด์ (Mapping)
        src_ip: rawLog.ip || rawLog.src_ip || null,
        user_name: rawLog.user || rawLog.user_name || null,
        action: rawLog.action || null,

        // เก็บก้อนข้อมูลดิบเอาไว้ด้วยในรูปแบบ JSONB เพื่อการทำ Audit ย้อนหลัง
        raw_data: rawLog
    };

    return unified;
};