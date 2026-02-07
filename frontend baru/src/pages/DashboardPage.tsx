import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { attendanceService, type StudentAttendanceStatus } from '@/services/attendance';
import { classScheduleService } from '@/services/classSchedule';
import { studentsService } from '@/services/students';
import { scanEventBus } from '@/lib/scanEventBus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Save, RefreshCw, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type AttendanceStatus = 'H' | 'T' | 'S' | 'I' | 'A' | null;

interface StudentRow extends StudentAttendanceStatus {
  displayStatus: AttendanceStatus;
  scanTime?: Date;
  isManual: boolean;
}

const statusMap: Record<string, AttendanceStatus> = {
  'Present': 'H',
  'Late': 'T',
  'Sick': 'S',
  'Permission': 'I',
  'Absent': 'A',
};

const reverseStatusMap: Record<AttendanceStatus, string> = {
  'H': 'Present',
  'T': 'Late',
  'S': 'Sick',
  'I': 'Permission',
  'A': 'Absent',
};

const statusColors: Record<AttendanceStatus, string> = {
  'H': 'bg-green-500 text-white',
  'T': 'bg-yellow-500 text-white',
  'S': 'bg-blue-500 text-white',
  'I': 'bg-purple-500 text-white',
  'A': 'bg-red-500 text-white',
};

const statusLabels: Record<AttendanceStatus, string> = {
  'H': 'Hadir',
  'T': 'Terlambat',
  'S': 'Sakit',
  'I': 'Izin',
  'A': 'Alpha',
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [originalStudents, setOriginalStudents] = useState<StudentRow[]>([]);
  const [lateThreshold, setLateThreshold] = useState<string>('07:30'); // Dynamic threshold
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load available classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await studentsService.getClasses();
        setClasses(classesData);

        // Auto-select first class if available
        if (classesData.length > 0 && !selectedClass) {
          setSelectedClass(classesData[0]);
        }
      } catch (error) {
        console.error('Error loading classes:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat daftar kelas',
          variant: 'destructive',
        });
      }
    };

    loadClasses();
  }, []);

  // Load class schedule when class changes
  useEffect(() => {
    if (!selectedClass) return;

    const loadClassSchedule = async () => {
      try {
        const schedule = await classScheduleService.getByName(selectedClass);
        setLateThreshold(schedule.late_threshold_time);
      } catch (error) {
        console.error('Error loading class schedule:', error);
        setLateThreshold('07:30'); // Fallback
      }
    };

    loadClassSchedule();
  }, [selectedClass]);

  // Load students when class or date changes
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const data = await attendanceService.getClassAttendance(
          selectedDate,
          selectedClass
        );

        // Convert to StudentRow format
        const rows: StudentRow[] = data.map((student) => ({
          ...student,
          displayStatus: student.status ? statusMap[student.status] : null,
          scanTime: student.scanned_at ? new Date(student.scanned_at) : undefined,
          isManual: false,
        }));

        setStudents(rows);
        setOriginalStudents(JSON.parse(JSON.stringify(rows))); // Deep copy
        setHasChanges(false);
      } catch (error) {
        console.error('Error loading students:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data siswa',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass, selectedDate, toast]);

  // Subscribe to scan events
  useEffect(() => {
    const unsubscribe = scanEventBus.subscribe((event) => {
      setStudents((prev) =>
        prev.map((student) => {
          if (student.student_id === event.studentId) {
            // Skip if manually set
            if (student.isManual) {
              return student;
            }

            // Determine status based on time and late threshold
            const scanTime = event.scanTime;
            const status = determineStatus(scanTime, lateThreshold);

            return {
              ...student,
              displayStatus: status,
              scanTime,
              isManual: false,
            };
          }
          return student;
        })
      );
      setHasChanges(true);
    });

    return unsubscribe;
  }, [lateThreshold]);

  const determineStatus = (scanTime: Date, threshold: string): AttendanceStatus => {
    const [hours, minutes] = threshold.split(':').map(Number);
    const thresholdTime = new Date(scanTime);
    thresholdTime.setHours(hours, minutes, 0, 0);

    return scanTime <= thresholdTime ? 'H' : 'T';
  };

  const handleManualStatus = (studentId: number, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.student_id === studentId
          ? { ...student, displayStatus: status, isManual: true, scanTime: undefined }
          : student
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send students whose status has changed from original
      const records = students
        .filter((student) => {
          const original = originalStudents.find(s => s.student_id === student.student_id);
          // Send if status is set AND it's different from original
          return student.displayStatus !== null &&
            student.displayStatus !== original?.displayStatus;
        })
        .map((student) => ({
          student_id: student.student_id,
          status: reverseStatusMap[student.displayStatus!],
          scan_time: student.scanTime?.toISOString(),
        }));

      if (records.length === 0) {
        toast({
          title: 'Info',
          description: 'Tidak ada perubahan untuk disimpan',
        });
        return;
      }

      await attendanceService.batchUpdate(selectedDate, selectedClass, records);

      toast({
        title: 'Berhasil',
        description: `${records.length} data absensi berhasil disimpan`,
      });

      // Reload data after save
      const data = await attendanceService.getClassAttendance(selectedDate, selectedClass);
      const rows: StudentRow[] = data.map((student) => ({
        ...student,
        displayStatus: student.status ? statusMap[student.status] : null,
        scanTime: student.scanned_at ? new Date(student.scanned_at) : undefined,
        isManual: false,
      }));

      setStudents(rows);
      setOriginalStudents(JSON.parse(JSON.stringify(rows)));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data absensi',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate summary counts
  const counts = {
    hadir: students.filter((s) => s.displayStatus === 'H').length,
    terlambat: students.filter((s) => s.displayStatus === 'T').length,
    sakit: students.filter((s) => s.displayStatus === 'S').length,
    izin: students.filter((s) => s.displayStatus === 'I').length,
    alpha: students.filter((s) => s.displayStatus === 'A').length,
  };

  return (
    <Container className="py-6 space-y-6">
      {/* Header with filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Absensi Kelas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola absensi siswa per kelas dan tanggal
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Batas Waktu Terlambat: <span className="font-medium text-foreground">{lateThreshold}</span>
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Class Selector */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option value="">Pilih Kelas</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background"
          />
        </div>
      </motion.div>

      {/* Student List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada siswa di kelas ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <motion.div
                  key={student.student_id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Avatar>
                    <AvatarImage src={`/api/students/${student.student_id}/photo`} />
                    <AvatarFallback>
                      {student.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.nis}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {student.displayStatus && (
                      <Badge className={statusColors[student.displayStatus]}>
                        {statusLabels[student.displayStatus]}
                      </Badge>
                    )}
                    {student.scanTime && (
                      <span className="text-sm text-muted-foreground">
                        {format(student.scanTime, 'HH:mm')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {(['H', 'T', 'S', 'I', 'A'] as AttendanceStatus[]).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={student.displayStatus === status ? 'default' : 'outline'}
                        onClick={() => handleManualStatus(student.student_id, status)}
                        className={cn(
                          'w-10 h-10',
                          student.displayStatus === status && statusColors[status]
                        )}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-5 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Hadir</p>
            <p className="text-2xl font-bold text-green-600">{counts.hadir}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Terlambat</p>
            <p className="text-2xl font-bold text-yellow-600">{counts.terlambat}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Sakit</p>
            <p className="text-2xl font-bold text-blue-600">{counts.sakit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Izin</p>
            <p className="text-2xl font-bold text-purple-600">{counts.izin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Alpha</p>
            <p className="text-2xl font-bold text-red-600">{counts.alpha}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </Container>
  );
}
