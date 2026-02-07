import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { StudentTable } from '@/components/features/StudentTable';
import { StudentForm } from '@/components/features/StudentForm';
import { DeleteConfirmDialog } from '@/components/features/DeleteConfirmDialog';
import { studentsService, Student } from '@/services/students';
import { StudentFormData } from '@/utils/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, RefreshCw, Users, User } from 'lucide-react';
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
  const [classFilter, setClassFilter] = useState('all');

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, classFilter]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const [studentsData, classesData] = await Promise.all([studentsService.getAll(), studentsService.getClasses()]);
      setStudents(studentsData);
      setClasses(classesData);
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

  const filterStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query));
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter((s) => s.class === classFilter);
    }

    setFilteredStudents(filtered);
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

  const handleFormSubmit = async (data: StudentFormData) => {
    setIsFormLoading(true);
    try {
      if (selectedStudent) {
        // Update
        await studentsService.update({
          id: selectedStudent.id,
          name: data.name,
          class: data.class,
          gender: data.gender,
          photo: data.photo,
        });
        toast({
          title: 'Berhasil',
          description: `Data ${data.name} berhasil diperbarui`,
        });
      } else {
        // Create
        await studentsService.create({
          name: data.name,
          class: data.class,
          gender: data.gender,
          photo: data.photo,
        });
        toast({
          title: 'Berhasil',
          description: `${data.name} berhasil ditambahkan`,
        });
      }
      setIsFormOpen(false);
      loadStudents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data siswa',
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

  // Stats
  const maleCount = students.filter((s) => s.gender === 'L').length;
  const femaleCount = students.filter((s) => s.gender === 'P').length;

  // Stats data for mapping
  const statsData = [
    {
      title: 'Total Siswa',
      value: students.length,
      icon: Users,
      color: 'primary',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-l-primary',
    },
    {
      title: 'Laki-laki',
      value: maleCount,
      icon: User,
      color: 'blue-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
      borderColor: 'border-l-blue-500',
    },
    {
      title: 'Perempuan',
      value: femaleCount,
      icon: User,
      color: 'pink-500',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-500',
      borderColor: 'border-l-pink-500',
    },
    {
      title: 'Ditampilkan',
      value: filteredStudents.length,
      icon: Search,
      color: 'emerald-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500',
      borderColor: 'border-l-emerald-500',
    },
  ];

  return (
    <Container>
      <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" variants={itemVariants}>
          <div className="space-y-1">
            <motion.h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              Data Siswa
            </motion.h1>
            <motion.p className="text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
              Kelola dan pantau data siswa SDIT AL HIKMAH
            </motion.p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
            <Button onClick={handleAddNew} size="lg" className="gap-2 w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow">
              <UserPlus className="h-4 w-4" />
              Tambah Siswa
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants}>
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                variants={statsCardVariants}
                whileHover={{
                  y: -3,
                  transition: { duration: 0.2 },
                }}>
                <Card className={`border-l-4 ${stat.borderColor} transition-all hover:shadow-md`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-x-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <AnimatePresence mode="wait">
                          <motion.p className="text-3xl font-bold text-foreground" key={stat.value} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.2 }}>
                            {stat.value}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                      <motion.div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}
                        whileHover={{
                          rotate: 360,
                          transition: { duration: 0.5 },
                        }}>
                        <Icon className={`h-6 w-6 ${stat.textColor}`} />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div variants={filterVariants}>
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Search */}
                <motion.div className="flex-1 relative" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input placeholder="Cari nama atau NIS siswa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 focus-visible:ring-2" />
                </motion.div>

                <motion.div className="flex gap-2 sm:gap-3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
                  {/* Class Filter */}
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10">
                      <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          Kelas {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Refresh Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="icon" onClick={loadStudents} className="h-10 w-10 flex-shrink-0 hover:bg-accent transition-colors" disabled={isLoading}>
                      <motion.div
                        animate={{
                          rotate: isLoading ? 360 : 0,
                        }}
                        transition={{
                          duration: 1,
                          repeat: isLoading ? Infinity : 0,
                          ease: 'linear',
                        }}>
                        <RefreshCw className="h-4 w-4" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Student Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
          <Card className="shadow-sm overflow-hidden">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-8 w-8 border-4 border-gray-200 border-t-primary rounded-full" />
                </motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <StudentTable students={filteredStudents} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Add/Edit Form Dialog */}
        <AnimatePresence>{isFormOpen && <StudentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} student={selectedStudent} isLoading={isFormLoading} />}</AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>{isDeleteOpen && <DeleteConfirmDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDeleteConfirm} student={selectedStudent} isLoading={isFormLoading} />}</AnimatePresence>
      </motion.div>
    </Container>
  );
}
