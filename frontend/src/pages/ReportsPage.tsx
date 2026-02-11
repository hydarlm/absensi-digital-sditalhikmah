import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { SemesterFilter } from '@/components/features/SemesterFilter';
import { attendanceService } from '@/services/attendance';
import type { SemesterReport } from '@/types';
import { studentsService } from '@/services/students';
import { exportSemesterReport } from '@/utils/exportExcel';
import { formatPercentage, getPercentageColor, getSemesterLabel, getAcademicYear } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, RefreshCw, Loader2, TrendingUp, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Animation Variants - Optimized to prevent scroll jumping
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// Mobile Report Card Component with animations
function ReportCard({ report, index }: { report: SemesterReport; index: number }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -3,
        transition: { duration: 0.2 },
      }}>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <motion.p className="font-semibold text-foreground text-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {report.studentName}
              </motion.p>
              <motion.p className="text-xs text-muted-foreground font-mono mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {report.studentId}
              </motion.p>
            </div>
            <motion.span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}>
              {report.class}
            </motion.span>
          </div>

          <motion.div className="grid grid-cols-5 gap-2 text-center text-xs mb-4" variants={containerVariants} initial="hidden" animate="visible">
            {[
              { value: report.totalPresent, label: 'Hadir', gradient: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/50', text: 'text-emerald-700', subtext: 'text-emerald-600/80' },
              { value: report.totalLate, label: 'Telat', gradient: 'from-amber-50 to-amber-100/50', border: 'border-amber-200/50', text: 'text-amber-700', subtext: 'text-amber-600/80' },
              { value: report.totalSick, label: 'Sakit', gradient: 'from-blue-50 to-blue-100/50', border: 'border-blue-200/50', text: 'text-blue-700', subtext: 'text-blue-600/80' },
              { value: report.totalPermission, label: 'Izin', gradient: 'from-purple-50 to-purple-100/50', border: 'border-purple-200/50', text: 'text-purple-700', subtext: 'text-purple-600/80' },
              { value: report.totalAbsent, label: 'Alpha', gradient: 'from-red-50 to-red-100/50', border: 'border-red-200/50', text: 'text-red-700', subtext: 'text-red-600/80' },
            ].map((item, idx) => (
              <motion.div key={item.label} variants={itemVariants} className={`bg-gradient-to-br ${item.gradient} rounded-lg p-2.5 border ${item.border}`} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <p className={`font-bold ${item.text} text-base`}>{item.value}</p>
                <p className={`${item.subtext} text-[10px] mt-0.5`}>{item.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="pt-3 border-t border-border/50 flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <span className="text-sm text-muted-foreground font-medium">Tingkat Kehadiran</span>
            <motion.span className={cn('font-bold text-lg', getPercentageColor(report.attendancePercentage))} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35 }}>
              {formatPercentage(report.attendancePercentage)}
            </motion.span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SemesterReport[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useIsMobile();

  // Filters
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const defaultSemester = currentMonth >= 6 ? 1 : 2;

  const [semester, setSemester] = useState<1 | 2>(defaultSemester as 1 | 2);
  const [year, setYear] = useState(currentYear);
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadReports();
  }, [semester, year, classFilter]);

  const loadClasses = async () => {
    try {
      const classesData = await studentsService.getClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getSemesterReport(semester, year, classFilter === 'all' ? undefined : classFilter);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat laporan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (reports.length === 0) {
      toast({
        title: 'Tidak ada data',
        description: 'Tidak ada data untuk diekspor',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      exportSemesterReport(reports, {
        semester,
        year,
        classFilter: classFilter === 'all' ? undefined : classFilter,
      });
      toast({
        title: 'Berhasil! 📤',
        description: 'Laporan berhasil diunduh',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengunduh laporan',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate totals
  const totalStudents = reports.length;
  const totalPresent = reports.reduce((sum, r) => sum + r.totalPresent, 0);
  const totalLate = reports.reduce((sum, r) => sum + r.totalLate, 0);
  const totalSick = reports.reduce((sum, r) => sum + r.totalSick, 0);
  const totalPermission = reports.reduce((sum, r) => sum + r.totalPermission, 0);
  const totalAbsent = reports.reduce((sum, r) => sum + r.totalAbsent, 0);

  // Calculate average attendance percentage based on total records
  const totalRecords = totalPresent + totalLate + totalSick + totalPermission + totalAbsent;
  const totalAttended = totalPresent + totalLate;
  const avgAttendance = totalRecords > 0
    ? Math.round((totalAttended / totalRecords) * 100)
    : 0;

  // Create summary with all calculated values
  const summary = {
    totalStudents,
    avgAttendance,
    totalPresent,
    totalLate,
    totalSick,
    totalPermission,
    totalAbsent,
  };

  // Summary cards data
  const summaryCards = [
    {
      icon: Users,
      value: summary.totalStudents,
      label: 'Total Siswa',
      color: 'text-primary',
      showOnMobile: true,
    },
    {
      icon: TrendingUp,
      value: `${summary.avgAttendance}%`,
      label: 'Rata-rata',
      color: getPercentageColor(summary.avgAttendance),
      showOnMobile: true,
    },
    {
      value: summary.totalPresent,
      label: 'Hadir',
      gradient: 'from-emerald-50 to-emerald-100/30',
      border: 'border-emerald-200/50',
      text: 'text-emerald-700',
      subtext: 'text-emerald-600',
      showOnMobile: true,
    },
    {
      value: summary.totalLate,
      label: 'Terlambat',
      gradient: 'from-amber-50 to-amber-100/30',
      border: 'border-amber-200/50',
      text: 'text-amber-700',
      subtext: 'text-amber-600',
      showOnMobile: false,
      showOnTablet: true,
    },
    {
      value: summary.totalSick,
      label: 'Sakit',
      gradient: 'from-blue-50 to-blue-100/30',
      border: 'border-blue-200/50',
      text: 'text-blue-700',
      subtext: 'text-blue-600',
      showOnMobile: false,
      showOnTablet: false,
    },
    {
      value: summary.totalPermission,
      label: 'Izin',
      gradient: 'from-purple-50 to-purple-100/30',
      border: 'border-purple-200/50',
      text: 'text-purple-700',
      subtext: 'text-purple-600',
      showOnMobile: false,
      showOnTablet: false,
    },
    {
      value: summary.totalAbsent,
      label: 'Alpha',
      gradient: 'from-red-50 to-red-100/30',
      border: 'border-red-200/50',
      text: 'text-red-700',
      subtext: 'text-red-600',
      showOnMobile: false,
      showOnTablet: false,
    },
  ];

  return (
    <Container>
      <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" variants={itemVariants}>
          <div>
            <motion.h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              Laporan Semester
            </motion.h2>
            <motion.p className="text-sm text-muted-foreground mt-1.5 font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
              {getSemesterLabel(semester)} · Tahun Ajaran {getAcademicYear(year)}
            </motion.p>
          </div>
          <motion.div className="flex gap-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.3 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm" onClick={loadReports} className="gap-2 flex-1 sm:flex-none hover:bg-accent transition-colors">
                <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}>
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-2 flex-1 sm:flex-none shadow-sm hover:shadow transition-all">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Export Excel
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <SemesterFilter semester={semester} year={year} classFilter={classFilter} classes={classes} onSemesterChange={setSemester} onYearChange={setYear} onClassChange={setClassFilter} />
        </motion.div>

        {/* Summary Cards */}
        <motion.div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4" variants={containerVariants}>
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            const hideClass = !card.showOnMobile ? (card.showOnTablet ? 'hidden sm:block' : 'hidden lg:block') : '';

            return (
              <motion.div
                key={card.label}
                variants={cardVariants}
                whileHover={{
                  y: -3,
                  transition: { duration: 0.2 },
                }}
                className={hideClass}>
                <Card className={cn('shadow-sm hover:shadow-md transition-shadow', card.gradient && `bg-gradient-to-br ${card.gradient}`, card.border || 'border-primary/20')}>
                  <CardContent className="p-3 sm:p-4 text-center">
                    {Icon && (
                      <div className="flex justify-center mb-1.5">
                        <Icon className={cn('h-5 w-5', card.color)} />
                      </div>
                    )}
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={card.value}
                        className={cn('text-xl sm:text-2xl font-bold', card.text || card.color || 'text-primary')}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}>
                        {card.value}
                      </motion.p>
                    </AnimatePresence>
                    <p className={cn('text-[10px] sm:text-xs font-medium mt-0.5', card.subtext || 'text-muted-foreground')}>{card.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Report Table/Cards */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg font-semibold">
                <motion.div className="h-8 w-1 bg-primary rounded-full" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />
                Detail Laporan Kehadiran
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 py-4 sm:py-6">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                    <motion.div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    <motion.p className="mt-4 text-muted-foreground font-medium" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      Memuat data laporan...
                    </motion.p>
                  </motion.div>
                ) : reports.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-12">
                    <motion.div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    </motion.div>
                    <motion.p className="text-muted-foreground text-base sm:text-lg font-medium" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      Belum ada data laporan
                    </motion.p>
                    <motion.p className="text-xs sm:text-sm text-muted-foreground mt-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      Data akan muncul setelah ada absensi tercatat
                    </motion.p>
                  </motion.div>
                ) : isMobile ? (
                  // Mobile Card View
                  <motion.div key="mobile-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {reports.map((report, index) => (
                      <ReportCard key={report.studentId} report={report} index={index} />
                    ))}
                  </motion.div>
                ) : (
                  // Desktop Table View
                  <motion.div key="desktop-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                          <TableHead className="w-14 font-semibold">No</TableHead>
                          <TableHead className="font-semibold">NIS</TableHead>
                          <TableHead className="font-semibold">Nama Siswa</TableHead>
                          <TableHead className="font-semibold">Kelas</TableHead>
                          <TableHead className="text-center font-semibold">Hadir</TableHead>
                          <TableHead className="text-center font-semibold">Terlambat</TableHead>
                          <TableHead className="text-center font-semibold">Sakit</TableHead>
                          <TableHead className="text-center font-semibold">Izin</TableHead>
                          <TableHead className="text-center font-semibold">Alpha</TableHead>
                          <TableHead className="text-center font-semibold">Kehadiran</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report, index) => (
                          <motion.tr
                            key={report.studentId}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-muted/20 transition-colors border-b border-border/30 last:border-0">
                            <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-mono text-sm font-medium">{report.studentId}</TableCell>
                            <TableCell className="font-semibold">{report.studentName}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">{report.class}</span>
                            </TableCell>
                            <TableCell className="text-center text-emerald-600 font-bold">{report.totalPresent}</TableCell>
                            <TableCell className="text-center text-amber-600 font-bold">{report.totalLate}</TableCell>
                            <TableCell className="text-center text-blue-600 font-bold">{report.totalSick}</TableCell>
                            <TableCell className="text-center text-purple-600 font-bold">{report.totalPermission}</TableCell>
                            <TableCell className="text-center text-red-600 font-bold">{report.totalAbsent}</TableCell>
                            <TableCell className="text-center">
                              <span className={cn('font-bold text-base', getPercentageColor(report.attendancePercentage))}>{formatPercentage(report.attendancePercentage)}</span>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Container>
  );
}
