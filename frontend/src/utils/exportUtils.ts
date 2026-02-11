/**
 * Export Utilities - Clean CSV/Excel Export
 *
 * Fitur:
 * - Export data JSON ke CSV (compatible dengan Excel)
 * - Tidak ada dependensi eksternal
 * - Tidak ada parsing/reading file
 * - Aman untuk security audit
 *
 * Cara Pakai:
 * ```tsx
 * import { exportToCSV } from '@/utils/exportUtils';
 *
 * // Export data
 * exportToCSV({
 *   data: yourDataArray,
 *   columns: [
 *     { key: 'name', header: 'Nama' },
 *     { key: 'class', header: 'Kelas' },
 *   ],
 *   filename: 'laporan-absensi',
 * });
 * ```
 */

export interface ExportColumn<T> {
  key: keyof T | ((row: T) => string | number);
  header: string;
}

export interface ExportOptions<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  includeIndex?: boolean;
  indexHeader?: string;
}

/**
 * Escape value untuk CSV format
 * Menangani koma, quotes, dan newlines
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Jika mengandung koma, quotes, atau newlines, wrap dengan quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape double quotes dengan double double-quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Get value dari row berdasarkan column definition
 */
function getColumnValue<T>(row: T, column: ExportColumn<T>): string | number {
  if (typeof column.key === 'function') {
    return column.key(row);
  }

  const value = row[column.key];
  if (value === null || value === undefined) {
    return '';
  }

  return value as string | number;
}

/**
 * Convert data array ke CSV string
 */
function convertToCSV<T>(options: ExportOptions<T>): string {
  const { data, columns, includeIndex = true, indexHeader = 'No' } = options;

  // Build header row
  const headers: string[] = [];
  if (includeIndex) {
    headers.push(indexHeader);
  }
  headers.push(...columns.map((col) => escapeCSVValue(col.header)));

  const rows: string[] = [headers.join(',')];

  // Build data rows
  data.forEach((row, index) => {
    const values: string[] = [];

    if (includeIndex) {
      values.push(String(index + 1));
    }

    columns.forEach((column) => {
      const value = getColumnValue(row, column);
      values.push(escapeCSVValue(value));
    });

    rows.push(values.join(','));
  });

  // Add BOM for Excel compatibility with UTF-8
  return '\uFEFF' + rows.join('\n');
}

/**
 * Download file ke browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data ke CSV file
 * CSV dapat dibuka langsung di Excel, Google Sheets, dll.
 */
export function exportToCSV<T>(options: ExportOptions<T>): void {
  const csvContent = convertToCSV(options);
  const filename = options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`;

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
}

/**
 * Format tanggal untuk nama file
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sanitize filename (remove special characters)
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-');
}
