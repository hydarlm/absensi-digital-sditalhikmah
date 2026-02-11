/**
 * Enhanced Excel Export Utilities using XLSX format
 * Generates proper Excel files with multiple sheets and correct data types
 */

import * as XLSX from 'xlsx';
import type { SemesterReport } from '@/types';
import { getAcademicYear, getSemesterLabel } from './formatters';

interface ExportSemesterOptions {
  semester: 1 | 2;
  year: number;
  classFilter?: string;
}

/**
 * Clean text data - remove newlines and trim
 */
function cleanText(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Export laporan semester ke file XLSX dengan multiple sheets
 */
export function exportSemesterReport(data: SemesterReport[], options: ExportSemesterOptions): void {
  const semesterLabel = getSemesterLabel(options.semester);
  const academicYear = getAcademicYear(options.year);

  // Group data by class
  const groupedData = data.reduce((acc, student) => {
    const className = cleanText(student.class);
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {} as Record<string, SemesterReport[]>);

  // Sort classes alphabetically
  const sortedClasses = Object.keys(groupedData).sort();

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Statistics across all classes
  let grandTotalPresent = 0;
  let grandTotalLate = 0;
  let grandTotalSick = 0;
  let grandTotalPermission = 0;
  let grandTotalAbsent = 0;
  let grandTotalStudents = 0;
  let grandTotalPercentageSum = 0;

  // Create sheet for each class
  sortedClasses.forEach((className) => {
    const classStudents = groupedData[className];

    // Prepare data rows with proper types
    const sheetData: any[][] = [
      // Header info
      ['LAPORAN ABSENSI SISWA'],
      [`Kelas: ${className}`],
      [`Semester: ${semesterLabel}`],
      [`Tahun Ajaran: ${academicYear}`],
      [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      [],
      // Column headers
      ['No', 'NIS', 'Nama Siswa', 'Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpha', 'Total Hari', 'Persentase (%)'],
    ];

    let classTotalPresent = 0;
    let classTotalLate = 0;
    let classTotalSick = 0;
    let classTotalPermission = 0;
    let classTotalAbsent = 0;

    // Add student rows with proper data types
    classStudents.forEach((student, index) => {
      const totalDays = student.totalPresent + student.totalLate + student.totalSick + student.totalPermission + student.totalAbsent;

      sheetData.push([
        index + 1, // Number
        cleanText(student.studentId), // String
        cleanText(student.studentName), // String
        student.totalPresent, // Number
        student.totalLate, // Number
        student.totalSick, // Number
        student.totalPermission, // Number
        student.totalAbsent, // Number
        totalDays, // Number
        student.attendancePercentage, // Number (will be formatted as percentage)
      ]);

      classTotalPresent += student.totalPresent;
      classTotalLate += student.totalLate;
      classTotalSick += student.totalSick;
      classTotalPermission += student.totalPermission;
      classTotalAbsent += student.totalAbsent;
    });

    // Class summary
    const classTotalDays = classTotalPresent + classTotalLate + classTotalSick + classTotalPermission + classTotalAbsent;
    const classAvgPercentage = classStudents.length > 0
      ? classStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / classStudents.length
      : 0;

    sheetData.push([]);
    sheetData.push(['RINGKASAN KELAS']);
    sheetData.push(['Total Siswa', classStudents.length]);
    sheetData.push(['Total Hadir', classTotalPresent]);
    sheetData.push(['Total Terlambat', classTotalLate]);
    sheetData.push(['Total Sakit', classTotalSick]);
    sheetData.push(['Total Izin', classTotalPermission]);
    sheetData.push(['Total Alpha', classTotalAbsent]);
    sheetData.push(['Total Hari Absensi', classTotalDays]);
    sheetData.push(['Rata-rata Kehadiran (%)', classAvgPercentage]);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 12 }, // NIS
      { wch: 25 }, // Nama
      { wch: 8 },  // Hadir
      { wch: 10 }, // Terlambat
      { wch: 8 },  // Sakit
      { wch: 8 },  // Izin
      { wch: 8 },  // Alpha
      { wch: 10 }, // Total Hari
      { wch: 12 }, // Persentase
    ];

    // Format percentage column (column J, starting from row 8)
    const dataStartRow = 7; // 0-indexed, row 8 in display
    for (let i = 0; i < classStudents.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: 9 }); // Column J (index 9)
      if (worksheet[cellRef]) {
        worksheet[cellRef].t = 'n'; // number type
        worksheet[cellRef].z = '0.00'; // format as number with 2 decimals
      }
    }

    // Add sheet with sanitized name
    const sheetName = className.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '-');
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Accumulate grand totals
    grandTotalPresent += classTotalPresent;
    grandTotalLate += classTotalLate;
    grandTotalSick += classTotalSick;
    grandTotalPermission += classTotalPermission;
    grandTotalAbsent += classTotalAbsent;
    grandTotalStudents += classStudents.length;
    grandTotalPercentageSum += classAvgPercentage;
  });

  // Create summary sheet
  const grandTotalDays = grandTotalPresent + grandTotalLate + grandTotalSick + grandTotalPermission + grandTotalAbsent;
  const grandAvgPercentage = sortedClasses.length > 0
    ? grandTotalPercentageSum / sortedClasses.length
    : 0;

  const summaryData: any[][] = [
    ['RINGKASAN KESELURUHAN'],
    [`Semester: ${semesterLabel}`],
    [`Tahun Ajaran: ${academicYear}`],
    [`Filter: ${options.classFilter || 'Semua Kelas'}`],
    [],
    ['Kategori', 'Jumlah'],
    ['Total Kelas', sortedClasses.length],
    ['Total Siswa', grandTotalStudents],
    [],
    ['STATISTIK KEHADIRAN'],
    ['Status', 'Total'],
    ['Hadir', grandTotalPresent],
    ['Terlambat', grandTotalLate],
    ['Sakit', grandTotalSick],
    ['Izin', grandTotalPermission],
    ['Alpha', grandTotalAbsent],
    ['Total Hari Absensi', grandTotalDays],
    [],
    ['Rata-rata Kehadiran (%)', grandAvgPercentage],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];

  // Add summary sheet as first sheet
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

  // Generate filename
  const classFileLabel = (options.classFilter || 'Semua-Kelas').replace(/[/\\?%*:|"<>]/g, '-');
  const semesterFileLabel = semesterLabel.replace(/[/\\?%*:|"<>]/g, '-');
  const academicYearFile = academicYear.replace('/', '-');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Absensi_${classFileLabel}_${semesterFileLabel}_${academicYearFile}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export absensi harian ke file Excel
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
  const sheetData: any[][] = [
    ['LAPORAN ABSENSI HARIAN'],
    [`Tanggal: ${new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    [`Dicetak: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    [],
    ['No', 'Nama Siswa', 'Kelas', 'Waktu', 'Status'],
  ];

  data.forEach((row, index) => {
    sheetData.push([
      index + 1,
      cleanText(row.studentName),
      cleanText(row.class),
      cleanText(row.time),
      cleanText(row.status),
    ]);
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 25 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 12 }, // Waktu
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi Harian');
  XLSX.writeFile(workbook, `Absensi_Harian_${date}.xlsx`);
}
