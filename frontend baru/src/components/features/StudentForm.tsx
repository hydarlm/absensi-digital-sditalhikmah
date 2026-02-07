import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema, StudentFormData } from '@/utils/validators';
import type { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData, photoFile?: File) => Promise<void>;
  student?: Student | null;
  isLoading?: boolean;
  classes: string[]; // Dynamic class list from database
}

export function StudentForm({ isOpen, onClose, onSubmit, student, isLoading, classes }: StudentFormProps) {
  const [photoFile, setPhotoFile] = React.useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nis: student?.nis || '',
      name: student?.name || '',
      class_name: student?.class_name || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        nis: student?.nis || '',
        name: student?.name || '',
        class_name: student?.class_name || '',
      });
      setPhotoFile(undefined);
    }
  }, [isOpen, student, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleFormSubmit = async (data: StudentFormData) => {
    await onSubmit(data, photoFile);
    reset();
    setPhotoFile(undefined);
  };

  const handleClose = () => {
    reset();
    setPhotoFile(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student ? '✏️ Edit Data Siswa' : '➕ Tambah Siswa Baru'}
          </DialogTitle>
          <DialogDescription>
            {student
              ? 'Ubah informasi siswa di bawah ini'
              : 'Isi data siswa baru di bawah ini'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 py-4">
          {/* NIS Input */}
          <div className="space-y-2">
            <Label htmlFor="nis">NIS *</Label>
            <Input
              id="nis"
              placeholder="Masukkan NIS siswa"
              {...register('nis')}
              className={errors.nis ? 'border-destructive' : ''}
              disabled={!!student} // NIS tidak bisa diubah saat edit
            />
            {errors.nis && (
              <p className="text-sm text-destructive">{errors.nis.message}</p>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              placeholder="Masukkan nama lengkap siswa"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Class Select */}
          <div className="space-y-2">
            <Label htmlFor="class_name">Kelas *</Label>
            <Select
              defaultValue={student?.class_name}
              onValueChange={(value) => setValue('class_name', value)}
            >
              <SelectTrigger className={errors.class_name ? 'border-destructive' : ''}>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class_name && (
              <p className="text-sm text-destructive">{errors.class_name.message}</p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">Foto Siswa (Opsional)</Label>
            <Input
              ref={fileInputRef}
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {photoFile && (
              <p className="text-sm text-muted-foreground">File: {photoFile.name}</p>
            )}
            {student?.photo_path && !photoFile && (
              <p className="text-sm text-muted-foreground">Foto saat ini: Ada</p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {student ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
