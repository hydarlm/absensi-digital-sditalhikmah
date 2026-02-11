// Type definitions matching backend schema

// Auth Types
export interface User {
    id: number;
    username: string;
    role: string;
    assignedClasses?: string[]; // For teachers to track assigned classes
    // NEW: "admin" or "teacher"
    is_active: boolean;
    created_at: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    role: string;  // NEW: "admin" or "teacher"
}

export interface AuthUser {
    user: User;
}

// Student Types
export interface Student {
    id: number;
    nis: string;
    name: string;
    class_name: string;
    barcode_token: string | null;
    barcode_generated_at: string | null;
    photo_path: string | null;
    created_at: string;
}

export interface StudentCreate {
    nis: string;
    name: string;
    class_name: string;
}

export interface StudentUpdate {
    nis?: string;
    name?: string;
    class_name?: string;
}

// Attendance Types
export interface AttendanceRecord {
    id: number;
    student_id: number;
    student_name: string;
    student_class: string;
    scanned_at: string;
    is_undone: boolean;
    undone_at: string | null;
}

export interface AttendanceScan {
    token: string;
}

export interface ScanResult {
    success: boolean;
    message: string;
    student_name?: string;
    student_class?: string;
    student_photo_url?: string;
    attendance_id?: number;
    already_scanned: boolean;
    student?: Student;  // Use the Student type defined above
}

export interface AttendanceStats {
    total_today: number;
    total_this_week: number;
    total_this_month: number;
    total_students: number;
}

// Attendance Status type for reports
export type AttendanceStatus = 'Present' | 'Late' | 'Sick' | 'Permission' | 'Absent';

// Reports Types
export interface SemesterReport {
    studentId: string;  // NIS from backend student_id
    studentName: string;  // from backend student_name
    class: string;  // from backend class_name
    totalPresent: number;
    totalLate: number;
    totalSick: number;
    totalPermission: number;
    totalAbsent: number;
    attendancePercentage: number;
}

// Helper function to get photo URL
export function getPhotoUrl(studentId: number, apiBaseUrl: string): string {
    return `${apiBaseUrl}/students/${studentId}/photo`;
}

// Helper function to get QR download URL
export function getQRDownloadUrl(studentId: number, apiBaseUrl: string): string {
    return `${apiBaseUrl}/students/${studentId}/download-qr`;
}
