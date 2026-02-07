import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        <Container className="py-6 space-y-6">
            {/* Header */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold">Manajemen Kelas</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola daftar kelas dan jadwal keterlambatan
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Kelas
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingSchedule ? 'Edit Kelas' : 'Tambah Kelas Baru'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSchedule
                                    ? 'Perbarui informasi kelas'
                                    : 'Tambahkan kelas baru dengan jadwal keterlambatan'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div>
                                <Label htmlFor="className">Nama Kelas</Label>
                                <Input
                                    id="className"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder="contoh: 4A, 5B, 6C"
                                    required
                                    disabled={!!editingSchedule}
                                />
                                {editingSchedule && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Nama kelas tidak dapat diubah
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="lateThreshold">Batas Waktu Terlambat</Label>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="lateThreshold"
                                        type="time"
                                        value={lateThreshold}
                                        onChange={(e) => setLateThreshold(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Siswa yang scan setelah jam ini akan dianggap terlambat
                                </p>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={handleDialogClose}>
                                    Batal
                                </Button>
                                <Button type="submit">
                                    {editingSchedule ? 'Perbarui' : 'Tambah'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Daftar Kelas</span>
                        <Button variant="ghost" size="sm" onClick={loadSchedules} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Belum ada kelas. Tambahkan kelas baru untuk memulai.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No</TableHead>
                                    <TableHead>Nama Kelas</TableHead>
                                    <TableHead>Batas Terlambat</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedules.map((schedule, index) => (
                                    <TableRow key={schedule.id}>
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
                                                <span className="text-green-600">Aktif</span>
                                            ) : (
                                                <span className="text-gray-400">Nonaktif</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(schedule)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(schedule.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}
