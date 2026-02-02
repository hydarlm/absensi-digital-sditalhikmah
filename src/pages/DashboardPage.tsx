import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/features/StatCard';
import { AttendanceTable } from '@/components/features/AttendanceTable';
import { attendanceService, DashboardStats, AttendanceRecord } from '@/services/attendance';
import { Users, UserCheck, Clock, ThermometerSun, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/formatters';

// Animation Variants - Optimized to prevent scroll jumping
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, recordsData] = await Promise.all([attendanceService.getDashboardStats(), attendanceService.getTodayAttendance()]);
      setStats(statsData);
      setTodayRecords(recordsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const today = formatDate(new Date().toISOString().split('T')[0]);

  // Stats data array for mapping
  const statsData = [
    {
      title: 'Total Siswa',
      value: stats?.totalStudents || 0,
      icon: Users,
      variant: 'default' as const,
      description: 'Terdaftar',
    },
    {
      title: 'Hadir',
      value: stats?.presentToday || 0,
      icon: UserCheck,
      variant: 'present' as const,
      description: 'Hari ini',
    },
    {
      title: 'Terlambat',
      value: stats?.lateToday || 0,
      icon: Clock,
      variant: 'late' as const,
      description: 'Hari ini',
    },
    {
      title: 'Sakit/Izin',
      value: (stats?.sickToday || 0) + (stats?.permissionToday || 0),
      icon: ThermometerSun,
      variant: 'sick' as const,
      description: 'Hari ini',
    },
    {
      title: 'Belum Absen',
      value: stats?.absentToday || 0,
      icon: UserX,
      variant: 'permission' as const,
      description: 'Hari ini',
    },
  ];

  return (
    <Container>
      <motion.div className="space-y-6 lg:space-y-8" initial="hidden" animate="show" variants={containerVariants}>
        {/* Stats Grid - Enhanced with animations */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5" variants={containerVariants}>
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{
                y: -3,
                transition: { duration: 0.2 },
              }}
              className={index === 4 ? 'col-span-2 lg:col-span-1' : ''}>
              <StatCard {...stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* Today's Attendance - Main Content */}
        <motion.div variants={cardVariants}>
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Absensi Hari Ini</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-green-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.8, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <span>Live Update</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full" />
                  </motion.div>
                ) : (
                  <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <AttendanceTable records={todayRecords} isLoading={isLoading} />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Section - Enhanced grid layout */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-5" variants={containerVariants}>
          {/* Weekly Stats - Placeholder with better design */}
          <motion.div className="lg:col-span-2" variants={cardVariants} whileHover={{ scale: 1.005 }} transition={{ duration: 0.2 }}>
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base font-semibold text-gray-900">Statistik Mingguan</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    className="mb-4 rounded-full bg-gray-100 p-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.3,
                    }}>
                    <motion.svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </motion.svg>
                  </motion.div>
                  <motion.h3 className="mb-1 text-sm font-medium text-gray-900" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }}>
                    Grafik Akan Tersedia
                  </motion.h3>
                  <motion.p className="text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.3 }}>
                    Data statistik akan ditampilkan setelah terkumpul
                  </motion.p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications - Improved design */}
          <motion.div variants={cardVariants}>
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base font-semibold text-gray-900">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <motion.div className="space-y-3" variants={containerVariants}>
                  {/* Status Card */}
                  <motion.div variants={itemVariants} whileHover={{ x: 3 }} transition={{ duration: 0.2 }} className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900">Sistem Aktif</p>
                      <p className="text-xs text-green-700 mt-0.5">Semua fitur berjalan normal</p>
                    </div>
                  </motion.div>

                  {/* Tips Card */}
                  <motion.div variants={itemVariants} whileHover={{ x: 3 }} transition={{ duration: 0.2 }} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <motion.div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}>
                      <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900">Pengingat</p>
                      <p className="text-xs text-amber-700 mt-0.5">Siswa/Siswi harus scan QR Code untuk absen</p>
                    </div>
                  </motion.div>

                  {/* Additional Info */}
                  <motion.div variants={itemVariants} whileHover={{ x: 3 }} transition={{ duration: 0.2 }} className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <motion.div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
                      animate={{
                        rotate: [0, 3, -3, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}>
                      <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900">Informasi</p>
                      <p className="text-xs text-blue-700 mt-0.5">Data diperbarui setiap 30 detik</p>
                    </div>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </Container>
  );
}
