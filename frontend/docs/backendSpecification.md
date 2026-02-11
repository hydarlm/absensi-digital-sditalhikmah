# Backend API Specification
# SDIT AL HIKMAH - Sistem Absensi Digital

Dokumentasi lengkap API backend untuk integrasi dengan frontend React.

---

## 📋 Daftar Isi

1. [Konfigurasi Umum](#konfigurasi-umum)
2. [Authentication API](#authentication-api)
3. [Students API](#students-api)
4. [Attendance API](#attendance-api)
5. [Reports API](#reports-api)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)
8. [Catatan Penting](#catatan-penting)

---

## 🔧 Konfigurasi Umum

### Base URL
```
lek di biayai tuku domain 
Production: https://api.sdit-alhikmah.sch.id/api
Development: http://localhost:8000/api
```

Frontend menggunakan environment variable:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Headers
Semua request harus menyertakan:
```
Content-Type: application/json
Authorization: Bearer {token}  # Untuk endpoint yang memerlukan auth
```

### CORS
Backend harus mengizinkan origin:
- `http://localhost:5173` (development)
- Domain production

---

## 🔐 Authentication API

### POST /auth/login
Login user dan dapatkan token.

**Request Body:**
```json
{
  "email": "Email Guru",
  "password": "Password Guru"
}
```

**Response Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "name": "Nama Guru",
    "email": "Email Guru",
    "role": "guru"
  }
}
```

**Response Error (401):**
```json
{
  "error": "Email atau password salah"
}
```

---

### GET /auth/me
Mendapatkan data user yang sedang login (validasi token).

**Headers:** `Authorization: Bearer {token}`

**Response Success (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "name": "Nama Guru",
    "email": "Email Guru",
    "role": "guru"
  }
}
```

**Response Error (401):**
```json
{
  "error": "Token tidak valid atau expired"
}
```

---

### POST /auth/logout
Logout dan invalidate token.

**Headers:** `Authorization: Bearer {token}`

**Response Success (200):**
```json
{
  "message": "Logout berhasil"
}
```

---

## 👨‍🎓 Students API

### GET /students
Mendapatkan semua data siswa.

**Headers:** `Authorization: Bearer {token}`

**Response Success (200):**
```json
[
  {
    "id": "uuid-string",
    "studentId": "2024001",
    "name": "Nama Siswa",
    "class": "1A",
    "gender": "L",
    "photo": "https://storage.example.com/photos/namasiswa.jpg",
    "barcode": "SDIT2024001",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
]
```

---

### GET /students/{id}
Mendapatkan detail siswa berdasarkan ID.

**Response Success (200):**
```json
{
  "id": "uuid-string",
  "studentId": "2024001",
  "name": "Nama Siswa",
  "class": "1A",
  "gender": "L",
  "photo": "https://storage.example.com/photos/namasiswa.jpg",
  "barcode": "SDIT2024001",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

**Response Error (404):**
```json
{
  "error": "Siswa tidak ditemukan"
}
```

---

### POST /students
Membuat data siswa baru.

**Request Body:**
```json
{
  "name": "Nama Siswa",
  "class": "1A",
  "gender": "L",
  "photo": "base64-encoded-image-or-url"
}
```

**Catatan Backend:**
- Generate `studentId` otomatis (format: tahun + 3 digit, contoh: 2024001)
- Generate `barcode` otomatis (format: SDIT + studentId, contoh: SDIT2024001)
- `photo` bisa berupa URL atau base64, backend harus handle upload ke storage

**Response Success (201):**
```json
{
  "id": "uuid-string",
  "studentId": "2024001",
  "name": "Nama Siswa",
  "class": "1A",
  "gender": "L",
  "photo": "https://storage.example.com/photos/ahmad.jpg",
  "barcode": "SDIT2024001",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

---

### PUT /students/{id}
Update data siswa.

**Request Body (partial update):**
```json
{
  "name": "Nama Siswa Updated",
  "class": "2A",
  "gender": "L",
  "photo": "new-photo-url-or-base64"
}
```

**Response Success (200):**
```json
{
  "id": "uuid-string",
  "studentId": "2024001",
  "name": "Nama Siswa Updated",
  "class": "2A",
  "gender": "L",
  "photo": "https://storage.example.com/photos/Nama Siswa Updated-new.jpg",
  "barcode": "SDIT2024001",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-16T10:30:00Z"
}
```

---

### DELETE /students/{id}
Hapus data siswa.

**Response Success (200):**
```json
{
  "message": "Siswa berhasil dihapus"
}
```

---

### GET /students/barcode/{barcode}
Mencari siswa berdasarkan barcode (untuk validasi scan).

**Response Success (200):**
```json
{
  "id": "uuid-string",
  "studentId": "2024001",
  "name": "Nama Siswa",
  "class": "1A",
  "gender": "L",
  "photo": "https://storage.example.com/photos/namasiswa.jpg",
  "barcode": "SDIT2024001"
}
```

---

### GET /students/classes
Mendapatkan daftar kelas unik.

**Response Success (200):**
```json
["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B"]
```

---

## 📱 Attendance API

### POST /attendance/scan
Mencatat kehadiran dari scan QR/Barcode.

**Request Body:**
```json
{
  "barcode": "SDIT2024001"
}
```

**Logic Backend:**
1. Cari siswa berdasarkan barcode
2. Cek apakah sudah absen hari ini
3. Tentukan status berdasarkan waktu:
   - Sebelum 07:30 → `hadir`
   - 07:30 - 08:00 → `terlambat`
   - Setelah 08:00 → `terlambat` (dengan catatan)
4. Jika sudah absen, return error

**Response Success (200):**
```json
{
  "success": true,
  "message": "Absensi berhasil dicatat",
  "record": {
    "id": "uuid-string",
    "studentId": "2024001",
    "studentName": "Nama Siswa",
    "class": "1A",
    "date": "2024-01-15",
    "time": "07:25:30",
    "status": "hadir",
    "note": null
  },
  "student": {
    "id": "uuid-string",
    "name": "Nama Siswa",
    "class": "1A",
    "photo": "https://storage.example.com/photos/namasiswa.jpg"
  }
}
```

**Response Error - Siswa tidak ditemukan (404):**
```json
{
  "success": false,
  "message": "Siswa dengan barcode tersebut tidak ditemukan"
}
```

**Response Error - Sudah absen (400):**
```json
{
  "success": false,
  "message": "Siswa sudah melakukan absensi hari ini"
}
```

---

### GET /attendance/today
Mendapatkan daftar absensi hari ini.

**Response Success (200):**
```json
[
  {
    "id": "uuid-string",
    "studentId": "2024001",
    "studentName": "Nama Siswa",
    "class": "1A",
    "date": "2024-01-15",
    "time": "07:25:30",
    "status": "hadir",
    "note": null
  },
  {
    "id": "uuid-string",
    "studentId": "2024002",
    "studentName": "Nama Siswa",
    "class": "1A",
    "date": "2024-01-15",
    "time": "07:45:00",
    "status": "terlambat",
    "note": "Terlambat 15 menit"
  }
]
```

---

### GET /attendance?start={date}&end={date}
Mendapatkan absensi berdasarkan rentang tanggal.

**Query Parameters:**
- `start`: Tanggal mulai (format: YYYY-MM-DD)
- `end`: Tanggal akhir (format: YYYY-MM-DD)

**Response:** Array of AttendanceRecord (sama dengan /attendance/today)

---

### GET /attendance/stats
Mendapatkan statistik dashboard.

**Response Success (200):**
```json
{
  "totalStudents": 150,
  "presentToday": 120,
  "lateToday": 15,
  "sickToday": 5,
  "permissionToday": 3,
  "absentToday": 7
}
```

**Catatan Kalkulasi:**
- `totalStudents`: Total siswa terdaftar
- `presentToday`: Siswa dengan status "hadir" hari ini
- `lateToday`: Siswa dengan status "terlambat" hari ini
- `sickToday`: Siswa dengan status "sakit" hari ini
- `permissionToday`: Siswa dengan status "izin" hari ini
- `absentToday`: `totalStudents - (presentToday + lateToday + sickToday + permissionToday)`

---

### PUT /attendance/{id}
Update status absensi (manual correction).

**Request Body:**
```json
{
  "status": "izin",
  "note": "Izin mengikuti lomba"
}
```

**Valid Status Values:**
- `hadir`
- `terlambat`
- `izin`
- `sakit`
- `alpha`

**Response Success (200):**
```json
{
  "id": "uuid-string",
  "studentId": "2024001",
  "studentName": "Ahmad Fauzan",
  "class": "1A",
  "date": "2024-01-15",
  "time": "07:25:30",
  "status": "izin",
  "note": "Izin mengikuti lomba"
}
```

---

## 📊 Reports API

### GET /reports/semester
Mendapatkan laporan absensi per semester.

**Query Parameters:**
- `semester`: 1 atau 2 (required)
- `year`: Tahun (required, contoh: 2024)
- `class`: Filter kelas (optional, contoh: "1A")

**Semester Logic:**
- Semester 1: Juli - Desember
- Semester 2: Januari - Juni

**Example Request:**
```
GET /reports/semester?semester=1&year=2024&class=1A
```

**Response Success (200):**
```json
[
  {
    "studentId": "2024001",
    "studentName": "Nama Siswa",
    "class": "1A",
    "totalPresent": 85,
    "totalLate": 5,
    "totalSick": 3,
    "totalPermission": 2,
    "totalAbsent": 0,
    "attendancePercentage": 94.74
  }
]
```

**Kalkulasi `attendancePercentage`:**
```
totalDays = totalPresent + totalLate + totalSick + totalPermission + totalAbsent
attendancePercentage = ((totalPresent + totalLate) / totalDays) * 100
```

---

## 📦 Data Models

### User
```typescript
interface User {
  id: string;          // UUID
  name: string;
  email: string;
  role: 'guru';        // Saat ini hanya role guru
}
```

### Student
```typescript
interface Student {
  id: string;          // UUID
  studentId: string;   // NIS (auto-generated: 2024001)
  name: string;
  class: string;       // Format: 1A, 2B, 3A, etc.
  gender: 'L' | 'P';   // L = Laki-laki, P = Perempuan
  photo: string | null;
  barcode: string;     // Auto-generated: SDIT2024001
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### AttendanceRecord
```typescript
interface AttendanceRecord {
  id: string;          // UUID
  studentId: string;   // Reference to Student.studentId
  studentName: string;
  class: string;
  date: string;        // Format: YYYY-MM-DD
  time: string;        // Format: HH:mm:ss
  status: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpha';
  note?: string;
}
```

### DashboardStats
```typescript
interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  sickToday: number;
  permissionToday: number;
  absentToday: number;
}
```

### SemesterReport
```typescript
interface SemesterReport {
  studentId: string;
  studentName: string;
  class: string;
  totalPresent: number;
  totalLate: number;
  totalSick: number;
  totalPermission: number;
  totalAbsent: number;
  attendancePercentage: number;  // 0-100
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes
| Code | Meaning | Kapan Digunakan |
|------|---------|-----------------|
| 200 | OK | Request berhasil |
| 201 | Created | Data berhasil dibuat |
| 400 | Bad Request | Validasi gagal / input salah |
| 401 | Unauthorized | Token tidak ada / expired |
| 403 | Forbidden | Tidak punya akses |
| 404 | Not Found | Data tidak ditemukan |
| 500 | Server Error | Error internal server |

### Error Response Format
```json
{
  "error": "Pesan error yang user-friendly",
  "details": {
    "field": "nama_field",
    "message": "Detail validasi error"
  }
}
```

### Token Expired Behavior
Ketika token expired (401), frontend akan:
1. Hapus token dari localStorage
2. Redirect ke halaman login

---

## 📝 Catatan Penting untuk Backend Developer

### 1. Barcode Generation
```
Format: SDIT + TAHUN + 3 DIGIT
Contoh: SDIT2024001, SDIT2024002, ...
```
Pastikan barcode unique dan sequential.

### 2. Photo Upload
- Accept: JPEG, PNG, WebP
- Max size: 5MB
- Simpan ke cloud storage (S3, Cloudinary, etc.)
- Return URL publik

### 3. Timezone
- Server harus menggunakan timezone **Asia/Jakarta (WIB)**
- Semua timestamp dalam format ISO 8601 dengan timezone

### 4. Waktu Absensi
```
< 07:30  → status: hadir
07:30 - 08:00 → status: terlambat
> 08:00 → status: terlambat + note
```

### 5. Academic Year
```
Semester 1: Juli - Desember (Tahun yang sama)
Semester 2: Januari - Juni (Tahun berikutnya)

Contoh Tahun Ajaran 2024/2025:
- Semester 1: Juli 2024 - Desember 2024
- Semester 2: Januari 2025 - Juni 2025
```

### 6. Database Schema Suggestion
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'guru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(10) NOT NULL,
  gender CHAR(1) CHECK (gender IN ('L', 'P')),
  photo_url TEXT,
  barcode VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(20) CHECK (status IN ('hadir', 'terlambat', 'izin', 'sakit', 'alpha')),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date)
);

-- Indexes for performance
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_students_barcode ON students(barcode);
```

### 7. Security Checklist
- [ ] Password hashing (bcrypt/argon2)
- [ ] JWT token dengan expiry (recommended: 24 jam)
- [ ] Rate limiting pada endpoint login
- [ ] Input validation & sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configuration
- [ ] HTTPS only di production