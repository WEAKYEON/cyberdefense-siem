# ==========================================
# CyberDefense SIEM - Commands
# ==========================================

.PHONY: help up down logs restart clean test

# พิมพ์ make หรือ make help เพื่อดูคำสั่งทั้งหมด
help:
	@echo "CyberDefense SIEM Commands:"
	@echo "  make up      - เริ่มต้นระบบทั้งหมด (Appliance Mode)"
	@echo "  make down    - ปิดระบบทั้งหมด"
	@echo "  make restart - รีสตาร์ทระบบใหม่"
	@echo "  make logs    - ดู Log ของระบบแบบ Real-time"
	@echo "  make clean   - ปิดระบบและลบข้อมูลใน Database ทิ้ง (Reset)"
	@echo "  make test    - รัน Unit/Integration Tests"

# เริ่มต้นระบบ (Build ใหม่ทุกครั้งเพื่อความชัวร์)
up:
	@echo "Starting CyberDefense SIEM..."
	docker-compose up -d --build
	@echo "System is up and running!"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost:5000"

# ปิดระบบ
down:
	@echo "Stopping services..."
	docker-compose down
	@echo "Services stopped."

# รีสตาร์ท
restart: down up

# ดูการทำงานของระบบ
logs:
	docker-compose logs -f

# ล้างข้อมูล (เผื่อกรรมการอยากเทสระบบเปล่าๆ)
clean:
	@echo "Cleaning up containers and database volumes..."
	docker-compose down -v
	@echo "Cleanup complete."

# จำลองการรัน Test
test:
	@echo "🧪 Running tests..."
	cd backend && npm test