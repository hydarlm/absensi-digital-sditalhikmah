import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { classScheduleService, type ClassSchedule } from '@/services/classSchedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClassSchedulePage() {
    const { toast } = useToast();
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);

    // Form state
    const [className, setClassName] = useState('');
    const [lateThreshold, setLateThreshold] = useState('07:30');

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setIsLoading(true);
        try {
            const data = await classScheduleService.getAll();
            setSchedules(data);
        } catch (error) {
            console.error('Error loading schedules:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat jadwal kelas',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingSchedule) {
                // Update
                await classScheduleService.update(editingSchedule.id, lateThreshold);
                toast({
                    title: 'Berhasil',
                    description: 'Jadwal kelas berhasil diperbarui',
                });
            } else {
                // Create
                await classScheduleService.create(className, lateThreshold);
                toast({
                    title: 'Berhasil',
                    description: 'Kelas baru berhasil ditambahkan',
                });
            }

            setIsDialogOpen(false);
            resetForm();
            loadSchedules();
        } catch (error: any) {
            console.error('Error saving schedule:', error);
            toast({
                title: 'Error',
                description: error?.message || 'Gagal menyimpan jadwal kelas',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (schedule: ClassSchedule) => {
        setEditingSchedule(schedule);
        setClassName(schedule.class_name);
        setLateThreshold(schedule.late_threshold_time);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

        try {
            await classScheduleService.delete(id);
            toast({
                title: 'Berhasil',
                description: 'Kelas berhasil dihapus',
            });
            loadSchedules();
        } catch (error) {
            console.error('Error deleting schedule:', error);
            toast({
                title: 'Error',
                description: 'Gagal menghapus kelas',
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setClassName('');
        setLateThreshold('07:30');
        setEditingSchedule(null);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        resetForm();
    };

    return (
      <Container className="py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6">
        {/* Header */}
        <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Kelas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Kelola daftar kelas dan jadwal keterlambatan</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full sm:w-auto">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={resetForm} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Kelas
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{editingSchedule ? 'Edit Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
                  <DialogDescription className="text-sm">{editingSchedule ? 'Perbarui informasi kelas' : 'Tambahkan kelas baru dengan jadwal keterlambatan'}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                    <Label htmlFor="className" className="text-sm sm:text-base">
                      Nama Kelas
                    </Label>
                    <Input id="className" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="contoh: 4A, 5B, 6C" required disabled={!!editingSchedule} className="mt-1.5 text-base" />
                    {editingSchedule && <p className="text-xs sm:text-sm text-muted-foreground mt-1">Nama kelas tidak dapat diubah</p>}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                    <Label htmlFor="lateThreshold" className="text-sm sm:text-base">
                      Batas Waktu Terlambat
                    </Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Input id="lateThreshold" type="time" value={lateThreshold} onChange={(e) => setLateThreshold(e.target.value)} required className="text-base" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Siswa yang scan setelah jam ini akan dianggap terlambat</p>
                  </motion.div>

                  <motion.div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                      <Button type="button" variant="outline" onClick={handleDialogClose} className="w-full sm:w-auto text-destructive hover:text-white hover:bg-destructive">
                        Batal
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                      <Button type="submit" className="w-full sm:w-auto">
                        {editingSchedule ? 'Perbarui' : 'Tambah'}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                <span>Daftar Kelas</span>
                <motion.div whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.3 }}>
                  <Button variant="ghost" size="sm" className="hover:bg-transparent" onClick={loadSchedules} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </motion.div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </motion.div>
                ) : schedules.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} className="text-center py-12 text-muted-foreground px-4">
                    <p className="text-sm sm:text-base">Belum ada kelas. Tambahkan kelas baru untuk memulai.</p>
                  </motion.div>
                ) : (
                  <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">No</TableHead>
                            <TableHead>Nama Kelas</TableHead>
                            <TableHead>Batas Terlambat</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {schedules.map((schedule, index) => (
                              <motion.tr
                                key={schedule.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{schedule.class_name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    {schedule.late_threshold_time}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {schedule.is_active ? (
                                    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-green-600">
                                      Aktif
                                    </motion.span>
                                  ) : (
                                    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-gray-400">
                                      Nonaktif
                                    </motion.span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <Button variant="ghost" size="sm" className="w-full hover:bg-primary hover:text-primary-foreground" onClick={() => handleEdit(schedule)}>
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <Button variant="ghost" size="sm" className="text-destructive hover:text-white hover:bg-destructive" onClick={() => handleDelete(schedule.id)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </motion.div>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile/Tablet Card List */}
                    <div className="md:hidden space-y-3 px-4">
                      <AnimatePresence>
                        {schedules.map((schedule, index) => (
                          <motion.div
                            key={schedule.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="border rounded-lg p-4 space-y-3 bg-card transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                                  {schedule.is_active ? (
                                    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                      Aktif
                                    </motion.span>
                                  ) : (
                                    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                      Nonaktif
                                    </motion.span>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base sm:text-lg truncate">{schedule.class_name}</h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>
                                Batas Terlambat: <span className="font-medium text-foreground">{schedule.late_threshold_time}</span>
                              </span>
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)} className="w-full hover:bg-primary hover:text-primary-foreground">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                                <Button variant="outline" size="sm" onClick={() => handleDelete(schedule.id)} className="w-full text-destructive hover:text-white hover:bg-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    );
}