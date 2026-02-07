// Date formatting utilities
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  return timeStr;
}

// Status formatting
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    hadir: 'Hadir',
    terlambat: 'Terlambat',
    izin: 'Izin',
    sakit: 'Sakit',
    alpha: 'Tidak Hadir',
  };
  return statusMap[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    hadir: 'bg-status-present text-white',
    terlambat: 'bg-status-late text-white',
    izin: 'bg-status-permission text-white',
    sakit: 'bg-status-sick text-white',
    alpha: 'bg-status-absent text-white',
  };
  return colorMap[status] || 'bg-muted text-muted-foreground';
}

export function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    hadir: '✅',
    terlambat: '⏰',
    izin: '📝',
    sakit: '🤒',
    alpha: '❌',
  };
  return emojiMap[status] || '❓';
}

// Semester formatting
export function getSemesterLabel(semester: 1 | 2): string {
  return semester === 1 ? 'Semester 1 (Juli - Desember)' : 'Semester 2 (Januari - Juni)';
}

export function getAcademicYear(year: number): string {
  return `${year}/${year + 1}`;
}

// Percentage formatting
export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function getPercentageColor(value: number): string {
  if (value >= 90) return 'text-status-present';
  if (value >= 75) return 'text-status-late';
  if (value >= 50) return 'text-status-permission';
  return 'text-status-absent';
}

// Name formatting
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Class formatting
export function sortClasses(classes: string[]): string[] {
  return classes.sort((a, b) => {
    const gradeA = parseInt(a);
    const gradeB = parseInt(b);
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.localeCompare(b);
  });
}
