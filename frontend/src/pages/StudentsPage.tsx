import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { StudentTable } from '@/components/features/StudentTable';
import { StudentForm } from '@/components/features/StudentForm';
import { DeleteConfirmDialog } from '@/components/features/DeleteConfirmDialog';
import { ImportStudentsDialog } from '@/components/features/ImportStudentsDialog';
import { studentsService } from '@/services/students';
import { classScheduleService } from '@/services/classSchedule';
import type { Student } from '@/types';
import { StudentFormData } from '@/utils/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, RefreshCw, Users, X, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

const statsCardVariants: Variants = {
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

const filterVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  const filterStudents = useCallback(() => {
    let filtered = [...students];

    if (classFilter) {
      filtered = filtered.filter((s) => s.class_name === classFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(query) || s.nis.toLowerCase().includes(query) || s.class_name.toLowerCase().includes(query));
    }

    setFilteredStudents(filtered);
  }, [students, classFilter, searchQuery]);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  const loadClasses = async () => {
    try {
      const schedules = await classScheduleService.getAll();
      const classNames = schedules.map((s) => s.class_name).sort();
      setClasses(classNames);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar kelas',
        variant: 'destructive',
      });
    }
  };

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const studentsData = await studentsService.getAll();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data siswa',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleGenerateQR = async (student: Student) => {
    setIsFormLoading(true);
    try {
      const result = await studentsService.generateQR(student.id);
      toast({
        title: 'Berhasil',
        description: `QR Code untuk ${student.name} berhasil dibuat`,
      });
      loadStudents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat QR Code',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleFormSubmit = async (data: StudentFormData, photoFile?: File) => {
    setIsFormLoading(true);
    try {
      if (selectedStudent) {
        await studentsService.update(selectedStudent.id, {
          nis: data.nis,
          name: data.name,
          class_name: data.class_name,
        });

        if (photoFile) {
          await studentsService.uploadPhoto(selectedStudent.id, photoFile);
        }

        toast({
          title: 'Berhasil',
          description: `Data ${data.name} berhasil diperbarui`,
        });
      } else {
        const newStudent = await studentsService.create({
          nis: data.nis,
          name: data.name,
          class_name: data.class_name,
        });

        if (photoFile) {
          await studentsService.uploadPhoto(newStudent.id, photoFile);
        }

        toast({
          title: 'Berhasil',
          description: `${data.name} berhasil ditambahkan`,
        });
      }
      setIsFormOpen(false);
      loadStudents();
    } catch (error: any) {
      const errorMessage = error?.message || 'Gagal menyimpan data siswa';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    setIsFormLoading(true);
    try {
      await studentsService.delete(selectedStudent.id);
      toast({
        title: 'Berhasil',
        description: `Data ${selectedStudent.name} berhasil dihapus`,
      });
      setIsDeleteOpen(false);
      loadStudents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus data siswa',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const statsData = [
    {
      title: 'Total Siswa',
      value: students.length,
      icon: Users,
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-l-primary',
    },
    {
      title: 'Ditampilkan',
      value: filteredStudents.length,
      icon: Search,
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500',
      borderColor: 'border-l-emerald-500',
    },
  ];

  return (
    <Container>
      <motion.div className="space-y-4 sm:space-y-6 w-full min-w-0" variants={containerVariants} initial="hidden" animate="visible">
        {/* ── Header ── */}
        <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" variants={itemVariants}>
          <div className="space-y-0.5 min-w-0">
            <motion.h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-tight" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              Data Siswa
            </motion.h1>
            <motion.p className="text-xs sm:text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
              Kelola dan pantau data siswa SDIT AL HIKMAH
            </motion.p>
          </div>

          {/* Action buttons — full-width on mobile, auto on sm+ */}
          <motion.div className="flex gap-2 w-full sm:w-auto shrink-0" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
            <Button onClick={() => setShowImportDialog(true)} variant="outline" size="default" className="gap-2 flex-1 sm:flex-none shadow-sm hover:shadow-md transition-shadow text-sm">
              <Upload className="h-4 w-4 shrink-0" />
              <span>Import CSV</span>
            </Button>
            <Button onClick={handleAddNew} size="default" className="gap-2 flex-1 sm:flex-none shadow-sm hover:shadow-md transition-shadow text-sm">
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>Tambah Siswa</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* ── Stats Cards ── */}
        <motion.div className="grid grid-cols-2 gap-3 sm:gap-4" variants={containerVariants}>
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.title} variants={statsCardVariants} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                <Card className={`border-l-4 ${stat.borderColor} transition-all hover:shadow-md`}>
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
                        <AnimatePresence mode="wait">
                          <motion.p
                            className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums"
                            key={stat.value}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}>
                            {stat.value}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                      <motion.div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${stat.bgColor} shrink-0`} whileHover={{ rotate: 360, transition: { duration: 0.5 } }}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.textColor}`} />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Filters ── */}
        <motion.div variants={filterVariants}>
          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {/*
                Mobile:  stacked column
                sm+:     single row — search takes remaining space,
                          class-filter fixed width, refresh icon on the right
              */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <motion.div className="relative flex-1 min-w-0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input placeholder="Cari nama, NIS, atau kelas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 focus-visible:ring-2 w-full" />
                </motion.div>

                {/* Class Filter + clear button — keep them together so they never wrap independently */}
                <motion.div className="flex items-center gap-2 w-full sm:w-[200px] shrink-0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.3 }}>
                  <Select value={classFilter || undefined} onValueChange={setClassFilter}>
                    <SelectTrigger className="h-10 flex-1 min-w-0">
                      <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classFilter && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setClassFilter('')} title="Reset filter kelas">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>

                {/* Refresh */}
                <motion.div className="flex justify-end sm:justify-normal shrink-0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="icon" onClick={loadStudents} className="h-10 w-10 shrink-0 hover:bg-accent transition-colors" disabled={isLoading} title="Refresh data">
                      <motion.div animate={{ rotate: isLoading ? 360 : 0 }} transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}>
                        <RefreshCw className="h-4 w-4" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Student Table ── */}
        {/* ── Student Table ── */}
        {/*
          Pola w-0 + minWidth:'100%' adalah kunci fix ini.
          w-0 mencegah motion.div "memaksa" halaman melebar,
          minWidth:'100%' membuatnya tetap mengisi container.
          Tanpa ini, overflow-x-auto di dalam bocor keluar dan
          mendorong header/filter ke kanan saat tabel ada datanya.
        */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }} style={{ width: 0, minWidth: '100%' }}>
          <Card className="shadow-sm overflow-hidden w-full">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-8 w-8 border-4 border-muted border-t-primary rounded-full" />
                </motion.div>
              ) : (
                /* overflow-x-auto terisolasi di sini — scroll hanya terjadi
                   di dalam box ini, tidak bocor ke seluruh halaman */
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-x-auto w-full">
                  <StudentTable students={filteredStudents} onEdit={handleEdit} onDelete={handleDelete} onGenerateQR={handleGenerateQR} isLoading={isLoading} />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ── Dialogs ── */}
        <AnimatePresence>
          {isFormOpen && (
            <StudentForm
              isOpen={isFormOpen}
              onClose={() => {
                setIsFormOpen(false);
                setSelectedStudent(null);
              }}
              onSubmit={handleFormSubmit}
              student={selectedStudent}
              isLoading={isFormLoading}
              classes={classes}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>{isDeleteOpen && <DeleteConfirmDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDeleteConfirm} student={selectedStudent} isLoading={isFormLoading} />}</AnimatePresence>

        <ImportStudentsDialog open={showImportDialog} onOpenChange={setShowImportDialog} onSuccess={loadStudents} />
      </motion.div>
    </Container>
  );
}
