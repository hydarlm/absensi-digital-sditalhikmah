import { apiFetch } from './api';

export type Gender = 'L' | 'P';

export interface Student {
  id: string;
  studentId: string;
  name: string;
  class: string;
  gender: Gender;
  photo: string | null;
  barcode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDTO {
  name: string;
  class: string;
  gender: Gender;
  photo?: string | null;
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  id: string;
}

export const studentsService = {
  // Get all students
  getAll: async (): Promise<Student[]> => {
    return apiFetch<Student[]>('/students');
  },

  // Get student by ID
  getById: async (id: string): Promise<Student | null> => {
    return apiFetch<Student>(`/students/${id}`);
  },

  // Create new student
  create: async (data: CreateStudentDTO): Promise<Student> => {
    return apiFetch<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update student
  update: async (data: UpdateStudentDTO): Promise<Student> => {
    return apiFetch<Student>(`/students/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete student
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/students/${id}`, { method: 'DELETE' });
  },

  // Get student by barcode (for scanning)
  getByBarcode: async (barcode: string): Promise<Student | null> => {
    return apiFetch<Student>(`/students/barcode/${barcode}`);
  },

  // Get all classes
  getClasses: async (): Promise<string[]> => {
    return apiFetch<string[]>('/students/classes');
  },
};
