import { apiFetch } from './api';
import type { AttendanceRecord, ScanResult, AttendanceStats, SemesterReport } from '../types';

export interface StudentAttendanceStatus {
  student_id: number;
  nis: string;
  name: string;
  class_name: string;
  photo_path: string | null;
  status: string | null;
  scanned_at: string | null;
}

export interface AttendanceUpdateItem {
  student_id: number;
  status: string;
  scan_time?: string;
}

export interface BatchUpdateResponse {
  message: string;
  updated: number;
  created: number;
  total: number;
}

export const attendanceService = {
  // Record attendance from QR/barcode scan
  scan: async (token: string): Promise<ScanResult> => {
    return apiFetch<ScanResult>('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Get attendance history with optional filters
  getHistory: async (filters?: {
    date?: string;
    student_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.student_id) params.append('student_id', filters.student_id.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/attendance/history?${queryString}` : '/attendance/history';

    return apiFetch<AttendanceRecord[]>(endpoint);
  },

  // Get today's attendance
  getTodayAttendance: async (): Promise<AttendanceRecord[]> => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return attendanceService.getHistory({ date: today });
  },

  // Get attendance statistics
  getStats: async (): Promise<AttendanceStats> => {
    return apiFetch<AttendanceStats>('/attendance/stats');
  },

  // Undo attendance record
  undo: async (attendanceId: number): Promise<{
    message: string;
    attendance_id: number;
  }> => {
    return apiFetch(`/attendance/${attendanceId}/undo`, {
      method: 'POST',
    });
  },

  // Get semester report
  getSemesterReport: async (
    semester: 1 | 2,
    year: number,
    class_name?: string
  ): Promise<SemesterReport[]> => {
    const params = new URLSearchParams();
    params.append('semester', semester.toString());
    params.append('year', year.toString());
    if (class_name) params.append('class_name', class_name);

    const response = await apiFetch<Array<{
      student_id: string;
      student_name: string;
      class_name: string;
      total_present: number;
      total_late: number;
      total_sick: number;
      total_permission: number;
      total_absent: number;
      attendance_percentage: number;
    }>>(`/reports/semester?${params}`);

    // Map backend response to frontend SemesterReport interface
    return response.map(item => ({
      studentId: item.student_id,
      studentName: item.student_name,
      class: item.class_name,
      totalPresent: item.total_present,
      totalLate: item.total_late,
      totalSick: item.total_sick,
      totalPermission: item.total_permission,
      totalAbsent: item.total_absent,
      attendancePercentage: item.attendance_percentage,
    }));
  },

  // Get class attendance for a specific date
  getClassAttendance: async (
    date: string,
    className: string
  ): Promise<StudentAttendanceStatus[]> => {
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('class_name', className);

    return apiFetch<StudentAttendanceStatus[]>(`/attendance/class-attendance?${params}`);
  },

  // Batch update attendance
  batchUpdate: async (
    date: string,
    className: string,
    records: AttendanceUpdateItem[]
  ): Promise<BatchUpdateResponse> => {
    const payload = {
      date,
      class_name: className,
      records,
    };

    console.log('Batch update payload:', JSON.stringify(payload, null, 2));

    return apiFetch<BatchUpdateResponse>('/attendance/batch-update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
