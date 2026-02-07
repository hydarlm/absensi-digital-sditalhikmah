import { apiFetch } from './api';
import { Student } from './students';

export type AttendanceStatus = 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpha';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  date: string;
  time: string;
  status: AttendanceStatus;
  note?: string;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  sickToday: number;
  permissionToday: number;
  absentToday: number;
}

export interface SemesterReport {
  studentId: string;
  studentName: string;
  class: string;
  totalPresent: number;
  totalLate: number;
  totalSick: number;
  totalPermission: number;
  totalAbsent: number;
  attendancePercentage: number;
}

export interface ScanResponse {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
  student?: Student;
}

export const attendanceService = {
  // Record attendance from QR/barcode scan
  recordAttendance: async (barcode: string): Promise<ScanResponse> => {
    return apiFetch<ScanResponse>('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ barcode }),
    });
  },

  // Get today's attendance
  getTodayAttendance: async (): Promise<AttendanceRecord[]> => {
    return apiFetch<AttendanceRecord[]>('/attendance/today');
  },

  // Get attendance by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
    return apiFetch<AttendanceRecord[]>(`/attendance?start=${startDate}&end=${endDate}`);
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiFetch<DashboardStats>('/attendance/stats');
  },

  // Get semester report
  getSemesterReport: async (semester: 1 | 2, year: number, classFilter?: string): Promise<SemesterReport[]> => {
    let url = `/reports/semester?semester=${semester}&year=${year}`;
    if (classFilter) url += `&class=${classFilter}`;
    return apiFetch<SemesterReport[]>(url);
  },

  // Update attendance status manually
  updateStatus: async (recordId: string, status: AttendanceStatus, note?: string): Promise<AttendanceRecord> => {
    return apiFetch<AttendanceRecord>(`/attendance/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },
};
