# 🏫 SDIT AL HIKMAH - Sistem Absensi Digital

<div align="center">
  <img src="/public/logosekolah.png/logosekolah.png" alt="SDIT AL HIKMAH Logo" width="120" />
  <h3>Sistem Absensi Digital Berbasis QR Code</h3>
  <p>Solusi modern untuk pencatatan kehadiran siswa Sekolah Dasar Islam Terpadu</p>
</div>

---

## 📋 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Penggunaan](#-penggunaan)
- [Struktur Folder](#-struktur-folder)
- [Integrasi Backend](#-integrasi-backend)
- [Screenshots](#-screenshots)
- [FAQ](#-faq)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Aplikasi

**SDIT AL HIKMAH Digital Attendance System** adalah aplikasi web modern untuk mencatat kehadiran siswa menggunakan teknologi QR Code/Barcode. Aplikasi ini dirancang khusus untuk memudahkan guru dalam:

- ✅ Mencatat absensi siswa dengan cepat (scan QR)
- ✅ Mengelola data siswa secara digital
- ✅ Memantau statistik kehadiran real-time
- ✅ Membuat laporan semester otomatis
- ✅ Export data ke Excel/CSV

---

## ✨ Fitur Utama

### 📱 Scan QR Code
- Scan menggunakan kamera perangkat (HP/laptop)
- Deteksi otomatis QR Code dan Barcode
- Feedback visual dan suara saat scan berhasil
- Tampilan informasi siswa setelah scan

### 👨‍🎓 Manajemen Siswa
- Tambah, edit, dan hapus data siswa
- Upload foto siswa
- Generate barcode/QR otomatis
- Filter berdasarkan kelas
- Tampilan jenis kelamin (L/P)

### 📊 Dashboard
- Statistik kehadiran hari ini
- Total siswa hadir, terlambat, sakit, izin
- Grafik tren mingguan (coming soon)
- Notifikasi sistem

### 📋 Laporan Semester
- Filter per semester (1 atau 2)
- Filter per tahun ajaran
- Filter per kelas
- Export ke CSV/Excel
- Persentase kehadiran otomatis

### 🔔 Notifikasi
- Pemberitahuan scan berhasil
- Alert siswa yang belum absen
- Notifikasi sistem

---

## 🛠️ Teknologi

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **UI Components** | Shadcn UI (Radix UI) |
| **QR Scanner** | html5-qrcode |
| **State Management** | React Query + Context |
| **Routing** | React Router v6 |
| **Form Validation** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Export** | Custom CSV Generator |

---

## 🚀 Instalasi

### Prasyarat
- Node.js 18+ atau Bun
- npm, yarn, atau bun

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install
# atau
bun install

# 3. Copy environment file
cp .env.example .env

# 4. Jalankan development server
npm run dev
# atau
bun dev
```

Aplikasi akan berjalan di `http://localhost:5173`

---

## ⚙️ Konfigurasi

### Environment Variables

Buat file `.env` di root project:

```env
# API Backend URL
VITE_API_BASE_URL=http://localhost:8000/api
```

### Konfigurasi Waktu Absensi

Waktu absensi dikonfigurasi di backend:
- **Hadir**: Scan sebelum 07:30
- **Terlambat**: Scan setelah 07:30

---

## 📖 Penggunaan

### 1. Login
```
Email: guru@example.com
Password: password123
Role: Guru 
```

### 2. Dashboard
Setelah login, Anda akan melihat:
- Statistik kehadiran hari ini
- Daftar siswa yang sudah absen pada hari itu
- Notifikasi sistem

### 3. Scan Absensi
1. Klik menu **"Scan Absensi"**
2. Izinkan akses kamera
3. Arahkan kamera ke QR Code siswa
4. Tunggu konfirmasi berhasil

### 4. Kelola Data Siswa
1. Klik menu **"Data Siswa"**
2. Klik **"Tambah Siswa"** untuk input baru
3. Klik ikon edit/hapus untuk modifikasi
4. Gunakan filter kelas untuk mempermudah pencarian

### 5. Laporan Semester
1. Klik menu **"Laporan"**
2. Pilih semester dan tahun
3. (Opsional) Filter berdasarkan kelas
4. Klik **"Export Excel"** untuk download

---

## 📁 Struktur Folder

```
src/
├── components/
│   ├── layout/           # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── features/         # Feature components
│   │   ├── QRScanner.tsx
│   │   ├── StudentForm.tsx
│   │   ├── StudentTable.tsx
│   │   ├── AttendanceTable.tsx
│   │   ├── SemesterFilter.tsx
│   │   └── NotificationDropdown.tsx
│   └── ui/               # Shadcn UI components
│
├── pages/
│   ├── LoginPage.tsx     # Halaman login
│   ├── DashboardPage.tsx # Dashboard utama
│   ├── ScanPage.tsx      # Scan QR Code
│   ├── StudentsPage.tsx  # CRUD data siswa
│   └── ReportsPage.tsx   # Laporan semester
│
├── services/
│   ├── api.ts            # API wrapper & config
│   ├── attendance.ts     # Service absensi
│   └── students.ts       # Service siswa
│
├── context/
│   └── AuthContext.tsx   # Authentication context
│
├── utils/
│   ├── formatters.ts     # Format tanggal, status
│   ├── validators.ts     # Validasi form (Zod)
│   ├── exportUtils.ts    # Generic CSV export
│   └── exportExcel.ts    # Specific export functions
│
├── hooks/
│   └── use-mobile.tsx    # Responsive hook
```

---

## 🔌 Integrasi Backend

### Dokumentasi API
Lihat file lengkap di: **[docs/backendSpecification.md](docs/BACKEND_API_SPEC.md)**

### Ringkasan Endpoint

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Validasi token |
| POST | `/auth/logout` | Logout |
| GET | `/students` | Daftar semua siswa |
| POST | `/students` | Tambah siswa baru |
| PUT | `/students/{id}` | Update siswa |
| DELETE | `/students/{id}` | Hapus siswa |
| POST | `/attendance/scan` | Catat absensi |
| GET | `/attendance/today` | Absensi hari ini |
| GET | `/attendance/stats` | Statistik dashboard |
| GET | `/reports/semester` | Laporan semester |

### Format Barcode
```
Format: SDIT + TAHUN + 3 DIGIT
Contoh: SDIT2024001, SDIT2024002
```

---

## 📱 Screenshots

### Login Page
*Halaman login dengan desain Islamic modern*

### Dashboard
*Dashboard dengan statistik kehadiran real-time*

### Scan Page
*Halaman scan QR dengan tampilan child-friendly*

### Data Siswa
*Tabel data siswa dengan fitur CRUD*

### Laporan
*Laporan semester dengan export Excel*

---

## ❓ FAQ

### Q: Apakah bisa diakses dari HP?
**A:** Ya! Aplikasi ini fully responsive dan bisa diakses dari browser HP untuk scan QR Code.

### Q: Format file export apa?
**A:** File export dalam format CSV yang bisa dibuka di Excel, Google Sheets, atau aplikasi spreadsheet lainnya.

### Q: Bagaimana cara generate QR Code siswa?
**A:** QR Code/Barcode di-generate otomatis oleh backend saat data siswa dibuat.

### Q: Jam berapa batas waktu hadir dan terlambat?
**A:** 
- Hadir: Sebelum 07:30 WIB
- Terlambat: Setelah 07:30 WIB

### Q: Apakah bisa digunakan offline?
**A:** Tidak. Aplikasi membutuhkan koneksi internet untuk sync dengan server.

---

## 👥 Tim Pengembang

- **Frontend**: React + TypeScript
- **Backend**: (Dikerjakan terpisah - lihat docs/BACKEND_API_SPEC.md)
- **Design**: Islamic-themed, child-friendly UI

---

## 📄 Lisensi

© 2026 SDIT AL HIKMAH. All rights reserved.

Aplikasi ini dikembangkan khusus untuk SDIT AL HIKMAH dan tidak untuk didistribusikan secara publik.

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk SDIT AL HIKMAH</p>
  <p><strong>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</strong></p>
</div>
