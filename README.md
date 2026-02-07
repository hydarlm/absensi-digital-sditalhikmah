### Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Buat virtual environment
python -m venv .venv

# Aktifkan virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Copy dan edit environment variables
cp .env.example ../.env
# Atau manual copy, lalu edit SECRET_KEY dan JWT_SECRET di .env

# Generate SECRET_KEY dan JWT_SECRET (opsional):
# python -c "import secrets; print(secrets.token_urlsafe(32))"

# Initialize database dan create admin user
python init_db.py
```

### Setup Frontend

Buka terminal baru (jangan tutup terminal backend):

```bash
# Masuk ke folder frontend
cd c:\Users\divau\Documents\absen\py3\frontend

# Install dependencies
npm install
```

### Jalankan Aplikasi

#### Terminal 1 - Backend:
```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Aktifkan venv jika belum
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend akan jalan di: **http://localhost:8000**

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

