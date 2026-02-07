import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Gender type
export type Gender = 'L' | 'P';

// Student validation schema
export const studentSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama wajib diisi')
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  class: z
    .string()
    .min(1, 'Kelas wajib diisi')
    .regex(/^[1-6][A-Za-z]?$/, 'Format kelas tidak valid (contoh: 1A, 2B, 3)'),
  gender: z.enum(['L', 'P'], { required_error: 'Jenis kelamin wajib diisi' }),
  photo: z
    .string()
    .optional()
    .nullable(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

// Validate barcode format
export function isValidBarcode(barcode: string): boolean {
  // SDIT barcode format: SDIT + year + 3 digits
  const barcodeRegex = /^SDIT\d{7}$/;
  return barcodeRegex.test(barcode);
}

// Validate date format (YYYY-MM-DD)
export function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate class format
export function isValidClass(classStr: string): boolean {
  const classRegex = /^[1-6][A-Za-z]?$/;
  return classRegex.test(classStr);
}

// Validate image file
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Format file harus JPEG, PNG, atau WebP' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file maksimal 5MB' };
  }

  return { valid: true };
}

// Sanitize input string
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
