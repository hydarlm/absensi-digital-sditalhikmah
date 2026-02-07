/**
 * Export Excel Utilities
 *
 * Wrapper functions untuk export laporan absensi
 * Menggunakan CSV format yang compatible dengan Excel
 */

import { SemesterReport } from '@/services/attendance';
import { exportToCSV, sanitizeFilename, ExportColumn } from './exportUtils';
import { getAcademicYear, getSemesterLabel } from './formatters';

interface ExportSemesterOptions {
  semester: 1 | 2;
  year: number;
  classFilter?: string;
}

/**
 * Export laporan semester ke file CSV/Excel
 */
export function exportSemesterReport(data: SemesterReport[], options: ExportSemesterOptions): void {
  const columns: ExportColumn<SemesterReport>[] = [
    { key: 'studentId', header: 'NIS' },
    { key: 'studentName', header: 'Nama Siswa' },
    { key: 'class', header: 'Kelas' },
    { key: 'totalPresent', header: 'Hadir' },
    { key: 'totalLate', header: 'Terlambat' },
    { key: 'totalSick', header: 'Sakit' },
    { key: 'totalPermission', header: 'Izin' },
    { key: 'totalAbsent', header: 'Alpha' },
    { key: (row) => `${row.attendancePercentage}%`, header: 'Persentase Kehadiran' },
  ];

  // Generate filename
  const classLabel = options.classFilter || 'Semua-Kelas';
  const semesterLabel = sanitizeFilename(getSemesterLabel(options.semester));
  const academicYear = getAcademicYear(options.year).replace('/', '-');
  const filename = `Laporan-Absensi-${classLabel}-${semesterLabel}-${academicYear}`;

  exportToCSV({
    data,
    columns,
    filename,
    includeIndex: true,
    indexHeader: 'No',
  });
}

/**
 * Export absensi harian ke file CSV/Excel
 */
export function exportAttendanceDaily(
  data: Array<{
    studentName: string;
    class: string;
    time: string;
    status: string;
  }>,
  date: string,
): void {
  const columns: ExportColumn<(typeof data)[0]>[] = [
    { key: 'studentName', header: 'Nama Siswa' },
    { key: 'class', header: 'Kelas' },
    { key: 'time', header: 'Waktu' },
    { key: 'status', header: 'Status' },
  ];

  exportToCSV({
    data,
    columns,
    filename: `Absensi-Harian-${date}`,
    includeIndex: true,
    indexHeader: 'No',
  });
}

/**
 * Export data siswa ke file CSV/Excel
 */
export function exportStudentData(
  data: Array<{
    studentId: string;
    name: string;
    class: string;
    gender: string;
  }>,
): void {
  const columns: ExportColumn<(typeof data)[0]>[] = [
    { key: 'studentId', header: 'NIS' },
    { key: 'name', header: 'Nama Siswa' },
    { key: 'class', header: 'Kelas' },
    { key: (row) => (row.gender === 'L' ? 'Laki-laki' : 'Perempuan'), header: 'Jenis Kelamin' },
  ];

  exportToCSV({
    data,
    columns,
    filename: `Data-Siswa-${new Date().toISOString().split('T')[0]}`,
    includeIndex: true,
    indexHeader: 'No',
  });
}
