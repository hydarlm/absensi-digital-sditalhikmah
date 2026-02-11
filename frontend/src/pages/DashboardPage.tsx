import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { attendanceService, type StudentAttendanceStatus } from '@/services/attendance';
import { classScheduleService } from '@/services/classSchedule';
import { studentsService } from '@/services/students';
import { scanEventBus } from '@/lib/scanEventBus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw, Users, Clock, CheckCircle2 } from 'lucide-react';
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
  Present: 'H',
  Late: 'T',
  Sick: 'S',
  Permission: 'I',
  Absent: 'A',
};

const reverseStatusMap: Record<AttendanceStatus, string> = {
  H: 'Present',
  T: 'Late',
  S: 'Sick',
  I: 'Permission',
  A: 'Absent',
};

// Active state: colored fill. Inactive: subtle tinted outline.
const statusActiveColors: Record<string, string> = {
  H: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-emerald-200 dark:shadow-emerald-900',
  T: 'bg-amber-500  hover:bg-amber-600  text-white border-amber-500  shadow-amber-200  dark:shadow-amber-900',
  S: 'bg-sky-500    hover:bg-sky-600    text-white border-sky-500    shadow-sky-200    dark:shadow-sky-900',
  I: 'bg-violet-500 hover:bg-violet-600 text-white border-violet-500 shadow-violet-200 dark:shadow-violet-900',
  A: 'bg-rose-500   hover:bg-rose-600   text-white border-rose-500   shadow-rose-200   dark:shadow-rose-900',
};

const statusInactiveColors: Record<string, string> = {
  H: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40',
  T: 'border-amber-200  text-amber-700  hover:bg-amber-50  dark:border-amber-800  dark:text-amber-400  dark:hover:bg-amber-950/40',
  S: 'border-sky-200    text-sky-700    hover:bg-sky-50    dark:border-sky-800    dark:text-sky-400    dark:hover:bg-sky-950/40',
  I: 'border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40',
  A: 'border-rose-200   text-rose-700   hover:bg-rose-50   dark:border-rose-800   dark:text-rose-400   dark:hover:bg-rose-950/40',
};

const statusBadgeColors: Record<string, string> = {
  H: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  T: 'bg-amber-100  text-amber-700  dark:bg-amber-950/60  dark:text-amber-400',
  S: 'bg-sky-100    text-sky-700    dark:bg-sky-950/60    dark:text-sky-400',
  I: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400',
  A: 'bg-rose-100   text-rose-700   dark:bg-rose-950/60   dark:text-rose-400',
};

const statusLabels: Record<string, string> = {
  H: 'Hadir',
  T: 'Terlambat',
  S: 'Sakit',
  I: 'Izin',
  A: 'Alpha',
};

const summaryCards = [
  { key: 'hadir', label: 'Hadir', color: 'emerald', statusKey: 'H' },
  { key: 'terlambat', label: 'Terlambat', color: 'amber', statusKey: 'T' },
  { key: 'sakit', label: 'Sakit', color: 'sky', statusKey: 'S' },
  { key: 'izin', label: 'Izin', color: 'violet', statusKey: 'I' },
  { key: 'alpha', label: 'Alpha', color: 'rose', statusKey: 'A' },
] as const;

const summaryCardTheme: Record<string, { card: string; label: string; value: string }> = {
  emerald: {
    card: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
    label: 'text-emerald-700 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-500',
  },
  amber: {
    card: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    label: 'text-amber-700 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-500',
  },
  sky: {
    card: 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800',
    label: 'text-sky-700 dark:text-sky-400',
    value: 'text-sky-600 dark:text-sky-500',
  },
  violet: {
    card: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
    label: 'text-violet-700 dark:text-violet-400',
    value: 'text-violet-600 dark:text-violet-500',
  },
  rose: {
    card: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
    label: 'text-rose-700 dark:text-rose-400',
    value: 'text-rose-600 dark:text-rose-500',
  },
};

const determineStatus = (scanTime: Date, threshold: string): AttendanceStatus => {
  const [hours, minutes] = threshold.split(':').map(Number);
  const thresholdTime = new Date(scanTime);
  thresholdTime.setHours(hours, minutes, 0, 0);
  return scanTime <= thresholdTime ? 'H' : 'T';
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [originalStudents, setOriginalStudents] = useState<StudentRow[]>([]);
  const [lateThreshold, setLateThreshold] = useState<string>('07:30');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await studentsService.getClasses();
        setClasses(classesData);
        if (classesData.length > 0 && !selectedClass) {
          setSelectedClass(classesData[0]);
        }
      } catch (error) {
        console.error('Error loading classes:', error);
        toast({ title: 'Error', description: 'Gagal memuat daftar kelas', variant: 'destructive' });
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const loadClassSchedule = async () => {
      try {
        const schedule = await classScheduleService.getByName(selectedClass);
        setLateThreshold(schedule.late_threshold_time);
      } catch {
        setLateThreshold('07:30');
      }
    };
    loadClassSchedule();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedDate) return;
    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const data = await attendanceService.getClassAttendance(selectedDate, selectedClass);
        const rows: StudentRow[] = data.map((student) => {
          let displayStatus: AttendanceStatus | null = null;
          if (student.status) {
            if (student.status === 'Present' && student.scanned_at && lateThreshold) {
              displayStatus = determineStatus(new Date(student.scanned_at), lateThreshold);
            } else {
              displayStatus = statusMap[student.status];
            }
          }
          return {
            ...student,
            displayStatus,
            scanTime: student.scanned_at ? new Date(student.scanned_at) : undefined,
            isManual: false,
          };
        });
        setStudents(rows);
        setOriginalStudents(JSON.parse(JSON.stringify(rows)));
        setHasChanges(false);
      } catch (error) {
        console.error('Error loading students:', error);
        toast({ title: 'Error', description: 'Gagal memuat data siswa', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, [selectedClass, selectedDate, toast, lateThreshold]);

  useEffect(() => {
    const unsubscribe = scanEventBus.subscribe((event) => {
      setStudents((prev) =>
        prev.map((student) => {
          if (student.student_id !== event.studentId) return student;
          if (student.isManual) return student;
          return {
            ...student,
            displayStatus: determineStatus(event.scanTime, lateThreshold),
            scanTime: event.scanTime,
            isManual: false,
          };
        }),
      );
      setHasChanges(true);
    });
    return unsubscribe;
  }, [lateThreshold]);

  const handleManualStatus = (studentId: number, status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, displayStatus: status, isManual: true, scanTime: undefined } : s)));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const records = students
        .filter((student) => {
          const original = originalStudents.find((s) => s.student_id === student.student_id);
          return student.displayStatus !== null && student.displayStatus !== original?.displayStatus;
        })
        .map((student) => ({
          student_id: student.student_id,
          status: reverseStatusMap[student.displayStatus!],
          scan_time: student.scanTime?.toISOString(),
        }));

      if (records.length === 0) {
        toast({ title: 'Info', description: 'Tidak ada perubahan untuk disimpan' });
        return;
      }

      await attendanceService.batchUpdate(selectedDate, selectedClass, records);
      toast({ title: 'Berhasil', description: `${records.length} data absensi berhasil disimpan` });

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
      toast({ title: 'Error', description: 'Gagal menyimpan data absensi', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const counts = {
    hadir: students.filter((s) => s.displayStatus === 'H').length,
    terlambat: students.filter((s) => s.displayStatus === 'T').length,
    sakit: students.filter((s) => s.displayStatus === 'S').length,
    izin: students.filter((s) => s.displayStatus === 'I').length,
    alpha: students.filter((s) => s.displayStatus === 'A').length,
  };

  const totalPresent = counts.hadir + counts.terlambat;
  const totalStudents = students.length;
  const attendanceRate = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : '0.0';

  const changedCount = students.filter((s) => {
    const original = originalStudents.find((o) => o.student_id === s.student_id);
    return s.displayStatus !== original?.displayStatus;
  }).length;

  return (
    <Container className="py-4 sm:py-6 px-4 sm:px-6">
      {/*
        Root wrapper: w-full min-w-0 mencegah child overflow
        mendorong layout ke kanan (sama dengan fix di StudentsPage)
      */}
      <div className="w-full min-w-0 space-y-4 sm:space-y-6">
        {/* ── Header + Filters ── */}
        <motion.div className="space-y-4" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Title */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">Absensi Kelas</h1>
          </div>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <option value="">Pilih Kelas</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tanggal</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Late threshold info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg w-fit">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="text-xs text-sky-700 dark:text-sky-300">
              Batas terlambat: <span className="font-semibold tabular-nums">{lateThreshold}</span>
            </span>
          </div>
        </motion.div>

        {/* ── Summary Cards ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }}>
          {/*
            Layout:
            - Mobile (< sm):  attendance-rate card full-width on top,
                               5 status cards in a 3+2 grid below
            - sm – lg:         all 6 in a single row (1+5)
            - lg+:             same single row, larger padding
          */}
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-6 sm:gap-3 lg:gap-4">
            {/* Attendance Rate */}
            <Card className="sm:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1 sm:text-center">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-xs font-medium text-muted-foreground">Kehadiran</p>
                  </div>
                  <div className="flex items-baseline gap-1 sm:flex-col sm:items-center sm:gap-0">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={attendanceRate}
                        className="text-2xl sm:text-3xl font-bold text-primary tabular-nums leading-none"
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}>
                        {attendanceRate}%
                      </motion.p>
                    </AnimatePresence>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {totalPresent}/{totalStudents}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5 status cards — 3+2 grid on mobile, continue the 6-col row on sm+ */}
            <div className="grid grid-cols-3 sm:contents gap-3 sm:gap-0">
              {summaryCards.map((item) => {
                const theme = summaryCardTheme[item.color];
                const value = counts[item.key];
                return (
                  <Card key={item.key} className={cn('sm:col-span-1', theme.card)}>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <p className={cn('text-xs font-medium mb-1 truncate', theme.label)}>{item.label}</p>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={value}
                          className={cn('text-2xl sm:text-3xl font-bold tabular-nums leading-none', theme.value)}
                          initial={{ scale: 1.1, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          transition={{ duration: 0.15 }}>
                          {value}
                        </motion.p>
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Student List ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          /* Same w-0/minWidth trick: isolates any inner overflow */
          style={{ width: 0, minWidth: '100%' }}>
          <Card className="shadow-sm w-full overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw className="w-7 h-7 text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Memuat data siswa...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground space-y-2">
                  <Users className="w-12 h-12 mx-auto opacity-25" />
                  <p className="text-sm font-medium">Tidak ada siswa di kelas ini</p>
                  <p className="text-xs">Pilih kelas untuk melihat daftar siswa</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {students.map((student, index) => (
                    <motion.div
                      key={student.student_id}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center gap-3',
                        'p-3 sm:p-3.5 rounded-xl border',
                        'hover:bg-muted/40 hover:shadow-sm transition-all duration-200',
                        student.displayStatus ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-200 dark:border-gray-700 bg-muted/20',
                      )}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.015, duration: 0.25 }}>
                      {/* ── Student info ── */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Nomor urut */}
                        <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0 hidden sm:block">{index + 1}</span>

                        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 border-2 border-muted">
                          <AvatarImage src={`/api/students/${student.student_id}/photo`} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-bold">
                            {student.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-foreground leading-tight">{student.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground tabular-nums">{student.nis}</p>
                            {/* Badge + scan time — shown inline on mobile next to NIS */}
                            {student.displayStatus && <Badge className={cn('text-[10px] font-semibold px-1.5 py-0 leading-5 border-0', statusBadgeColors[student.displayStatus])}>{statusLabels[student.displayStatus]}</Badge>}
                            {student.scanTime && <span className="text-[10px] text-muted-foreground tabular-nums">{format(student.scanTime, 'HH:mm')}</span>}
                          </div>
                        </div>
                      </div>

                      {/* ── Status buttons ── */}
                      {/*
                        On mobile: buttons go full-width below the info row.
                        On sm+: buttons sit on the right, fixed width per button.
                        Each button is square (w=h), using flex-1 on mobile so all
                        5 fill the row evenly — no overflow, no wrapping.
                      */}
                      <div className="flex gap-1.5 w-full sm:w-auto sm:shrink-0">
                        {(['H', 'T', 'S', 'I', 'A'] as const).map((status) => {
                          const isActive = student.displayStatus === status;
                          return (
                            <button
                              key={status}
                              onClick={() => handleManualStatus(student.student_id, status)}
                              className={cn(
                                // mobile: flex-1 fills the row; sm+: fixed 36px square
                                'flex-1 sm:flex-none sm:w-9 h-9 rounded-lg text-xs font-bold',
                                'border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                isActive ? cn(statusActiveColors[status], 'shadow-md scale-[1.04]') : statusInactiveColors[status],
                              )}>
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Save Button ── */}
        {/*
          Sticky on mobile with a frosted-glass backdrop so it floats
          above the list cleanly. On sm+ it's just a normal bottom-aligned button.
        */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div className="sticky bottom-4 sm:static flex justify-end z-20" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}>
              {/* backdrop blur pill — visible only on mobile */}
              <div className="sm:contents w-full">
                <div className="sm:hidden w-full p-2 bg-background/80 backdrop-blur-sm rounded-2xl border border-border shadow-xl">
                  <Button size="lg" onClick={handleSave} disabled={isSaving} className="w-full gap-2 text-sm">
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 shrink-0" />
                        Simpan Perubahan
                        <span className="ml-1 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-md tabular-nums">{changedCount}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Desktop: plain button */}
                <Button size="lg" onClick={handleSave} disabled={isSaving} className="hidden sm:flex gap-2 text-sm shadow-sm">
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 shrink-0" />
                      Simpan Perubahan
                      <span className="ml-1 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-md tabular-nums">{changedCount}</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Container>
  );
}
