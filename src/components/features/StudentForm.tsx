import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema, StudentFormData } from '@/utils/validators';
import { Student } from '@/services/students';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, X, Loader2 } from 'lucide-react';
import { getInitials } from '@/utils/formatters';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
  student?: Student | null;
  isLoading?: boolean;
}

const CLASSES = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

export function StudentForm({ isOpen, onClose, onSubmit, student, isLoading }: StudentFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(student?.photo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: student?.name || '',
      class: student?.class || '',
      gender: student?.gender || undefined,
      photo: student?.photo || null,
    },
  });

  const selectedGender = watch('gender');

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: student?.name || '',
        class: student?.class || '',
        gender: student?.gender || undefined,
        photo: student?.photo || null,
      });
      setPhotoPreview(student?.photo || null);
    }
  }, [isOpen, student, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setValue('photo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setValue('photo', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (data: StudentFormData) => {
    await onSubmit(data);
    reset();
    setPhotoPreview(null);
  };

  const handleClose = () => {
    reset();
    setPhotoPreview(null);
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
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-primary/20">
              <AvatarImage src={photoPreview || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl font-bold">
                {student?.name ? getInitials(student.name) : '👤'}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 text-xs sm:text-sm"
              >
                <Upload className="h-4 w-4" />
                Upload Foto
              </Button>
              {photoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="hover:bg-destructive hover:text-destructive-foreground gap-2 text-xs sm:text-sm"
                >
                  <X className="h-4 w-4" />
                  Hapus
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
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

          {/* Gender Selection */}
          <div className="space-y-2">
            <Label>Jenis Kelamin *</Label>
            <RadioGroup
              value={selectedGender}
              onValueChange={(value) => setValue('gender', value as 'L' | 'P')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="L" id="male" />
                <Label htmlFor="male" className="font-normal cursor-pointer flex items-center gap-1">
                  👦 Laki-laki
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="P" id="female" />
                <Label htmlFor="female" className="font-normal cursor-pointer flex items-center gap-1">
                  👧 Perempuan
                </Label>
              </div>
            </RadioGroup>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>

          {/* Class Select */}
          <div className="space-y-2">
            <Label htmlFor="class">Kelas *</Label>
            <Select
              defaultValue={student?.class}
              onValueChange={(value) => setValue('class', value)}
            >
              <SelectTrigger className={errors.class ? 'border-destructive' : ''}>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    Kelas {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class && (
              <p className="text-sm text-destructive">{errors.class.message}</p>
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
