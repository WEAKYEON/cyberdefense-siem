const dgram = require('dgram');
const client = dgram.createSocket('udp4');

// ตัวอย่าง Log จาก Firewall [cite: 44, 45]
const logMessage = Buffer.from('<134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10 dst=8.8.8.8 spt=5353 dpt=53 proto=udp msg=DNS blocked policy=Block-DNS');

client.send(logMessage, 514, 'localhost', (err) => {
    if (err) console.error(err);
    else console.log('จำลองการส่ง Syslog ไปที่พอร์ต 514 สำเร็จ!');
    client.close();
});