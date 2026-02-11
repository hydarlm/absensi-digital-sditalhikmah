import { apiFetch, API_BASE_URL } from './api';
import type { Student, StudentCreate, StudentUpdate } from '../types';

export const studentsService = {
  // Get all students
  getAll: async (): Promise<Student[]> => {
    return apiFetch<Student[]>('/students');
  },

  // Get student by ID
  getById: async (id: number): Promise<Student> => {
    return apiFetch<Student>(`/students/${id}`);
  },

  // Create new student
  create: async (data: StudentCreate): Promise<Student> => {
    return apiFetch<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update student
  update: async (id: number, data: StudentUpdate): Promise<Student> => {
    return apiFetch<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete student
  delete: async (id: number): Promise<void> => {
    await apiFetch(`/students/${id}`, { method: 'DELETE' });
  },

  // Generate QR code for student
  generateQR: async (id: number): Promise<{
    message: string;
    student_id: number;
    token: string;
    download_url: string;
  }> => {
    return apiFetch(`/students/${id}/generate-qr`, {
      method: 'POST',
    });
  },

  // Upload student photo
  uploadPhoto: async (id: number, photoFile: File): Promise<{
    message: string;
    student_id: number;
    photo_url: string;
  }> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await fetch(`${API_BASE_URL}/students/${id}/upload-photo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  },

  // Get photo URL for student
  getPhotoUrl: (id: number): string => {
    return `${API_BASE_URL}/students/${id}/photo`;
  },

  // Get QR download URL
  getQRDownloadUrl: (id: number): string => {
    return `${API_BASE_URL}/students/${id}/download-qr`;
  },

  // Get list of classes
  getClasses: async (): Promise<string[]> => {
    const response = await apiFetch<{ classes: string[] }>('/reports/classes');
    return response.classes;
  },

  // Import students from CSV file
  importStudents: async (file: File): Promise<{
    total_rows: number;
    success: number;
    failed: number;
    duplicates: number;
    errors: Array<{
      row: number;
      nis: string;
      name: string;
      class_name: string;
      success: boolean;
      error?: string;
    }>;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/students/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Import failed' }));
      throw new Error(error.detail || 'Import failed');
    }

    return response.json();
  },

  // Download import template
  downloadTemplate: (): void => {
    const token = localStorage.getItem('auth_token');
    const url = `${API_BASE_URL}/students/import/template`;

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_import_siswa.csv';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
