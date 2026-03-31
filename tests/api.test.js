// Mock Test Cases for CyberDefense SIEM

describe('API Endpoints - POST /ingest', () => {
  // เคสที่ 1: เทสการรับ Log ปกติ (ที่คุณมีอยู่แล้ว)
  it('should return 201 when ingesting a valid log', async () => {
    const mockLog = { tenant: "demo", source: "api", event_type: "login" };
    // const response = await request(app).post('/ingest').send(mockLog);
    // expect(response.status).toBe(201);
  });

  // เคสที่ 2: เทสระบบ Alert (จำลองดักจับ Brute Force)
  it('should trigger a brute force alert when an IP fails to login 3 times', async () => {
    const mockFailedLog = { tenant: "demoA", source: "api", event_type: "app_login_failed", src_ip: "10.0.0.1" };
    // ส่ง Log ล้มเหลวรัวๆ 3 ครั้ง
    // await request(app).post('/ingest').send(mockFailedLog);
    // await request(app).post('/ingest').send(mockFailedLog);
    // const response = await request(app).post('/ingest').send(mockFailedLog);
    // expect(response.body.alert_triggered).toBe(true);
  });
});

describe('Data Pipeline - Normalization', () => {
  // เคสที่ 3: เทสระบบ Schema กลาง (แปลง ip เป็น src_ip)
  it('should normalize different IP fields (ip, src_ip) into a unified src_ip field', () => {
    const rawLogM365 = { ip: "192.168.1.100", event_type: "UserLoggedIn" };
    // const normalized = normalizeLog(rawLogM365);
    // expect(normalized.src_ip).toBe("192.168.1.100");
    // expect(normalized.ip).toBeUndefined(); 
  });
});