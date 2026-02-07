import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AttendanceRecord } from '@/services/attendance';
import { formatStatus, getStatusEmoji } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showDate?: boolean;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  hadir: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  terlambat: 'bg-amber-100 text-amber-700 border-amber-200',
  izin: 'bg-purple-100 text-purple-700 border-purple-200',
  sakit: 'bg-blue-100 text-blue-700 border-blue-200',
  alpha: 'bg-red-100 text-red-700 border-red-200',
};

// Mobile Card Component
function AttendanceCard({ record, index, showDate }: { record: AttendanceRecord; index: number; showDate: boolean }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{record.studentName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                {record.class}
              </span>
              {showDate && <span>{record.date}</span>}
              <span>{record.time}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn('font-medium flex-shrink-0 text-xs', statusColors[record.status])}
          >
            {getStatusEmoji(record.status)} {formatStatus(record.status)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceTable({ records, showDate = false, isLoading }: AttendanceTableProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-6 sm:p-8 text-center">
          <p className="text-muted-foreground text-base sm:text-lg">📋 Belum ada data absensi</p>
        </div>
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    return (
      <div className="space-y-2">
        {records.map((record, index) => (
          <AttendanceCard key={record.id} record={record} index={index} showDate={showDate} />
        ))}
      </div>
    );
  }

  // Desktop View
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">No</TableHead>
              <TableHead>Nama Siswa</TableHead>
              <TableHead>Kelas</TableHead>
              {showDate && <TableHead>Tanggal</TableHead>}
              <TableHead>Waktu</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
              <TableRow key={record.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{record.studentName}</TableCell>
                <TableCell>{record.class}</TableCell>
                {showDate && <TableCell>{record.date}</TableCell>}
                <TableCell>{record.time}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('font-medium', statusColors[record.status])}
                  >
                    {getStatusEmoji(record.status)} {formatStatus(record.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
