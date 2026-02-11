# 🏫 SDIT AL HIKMAH - Sistem Absensi Digital

<div align="center">
  <img src="/frontend/public/logosekolah.png" alt="SDIT AL HIKMAH Logo" width="120" />
  <h3>Sistem Absensi Digital Berbasis QR Code</h3>
  <p>Solusi modern untuk pencatatan kehadiran siswa Sekolah Dasar Islam Terpadu</p>
</div>

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
| **Styling** | Tailwind CSS, Framer Motion |
| **UI Components** | Shadcn UI (Radix UI) |
| **QR Scanner** | html5-qrcode |
| **State Management** | React Query + Context |
| **Routing** | React Router v6 |
| **Form Validation** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Export** | Custom CSV Generator |

---

## 📖 Penggunaan

### 1. Dashboard
Setelah login, Anda akan melihat:
- Statistik kehadiran hari ini
- Daftar siswa yang sudah absen pada hari itu
- Notifikasi sistem

### 2. Scan Absensi
1. Klik menu **"Scan Absensi"**
2. Izinkan akses kamera
3. Arahkan kamera ke QR Code siswa
4. Tunggu konfirmasi berhasil

### 3. Kelola Data Siswa
1. Klik menu **"Data Siswa"**
2. Klik **"Tambah Siswa"** untuk input baru
3. Klik ikon edit/hapus untuk modifikasi
4. Gunakan filter kelas untuk mempermudah pencarian

### 4. Laporan Semester
1. Klik menu **"Laporan"**
2. Pilih semester dan tahun
3. (Opsional) Filter berdasarkan kelas
4. Klik **"Export Excel"** untuk download

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

## 👥 Tim Magang SDIT AL HIKMAH

- **Haydar Ahadya Al Mansuri**
- **Muhammad Divaul Aula**
- **Wulan Tsania**

---

## 📄 Lisensi

© 2026 SDIT AL HIKMAH. All rights reserved.

---

<div align="center">
  <p>DI KEMBANGKAN OLEH MAHASISWA TEKNIK INFORMATIKA UNIVERSITAS ISLAM BALITAR 2026</p>
  <p><strong>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</strong></p>
</div>
