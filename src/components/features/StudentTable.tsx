import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, QrCode } from 'lucide-react';
import { Student } from '@/services/students';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  isLoading?: boolean;
}

// Mobile Card View
function StudentCard({ student, index, onEdit, onDelete }: { 
  student: Student; 
  index: number;
  onEdit: (student: Student) => void; 
  onDelete: (student: Student) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
            <AvatarImage src={student.photo || undefined} alt={student.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                student.gender === 'L' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-pink-100 text-pink-700'
              )}>
                {student.gender === 'L' ? '👦 L' : '👧 P'}
              </span>
            </div>
            
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono text-xs">{student.studentId}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {student.class}
              </span>
            </div>
            
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <QrCode className="h-3 w-3" />
              <span className="font-mono">{student.barcode}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(student)}
            className="gap-1.5 text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(student)}
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentTable({ students, onEdit, onDelete, isLoading }: StudentTableProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-lg">👨‍🎓 Belum ada data siswa</p>
          <p className="text-sm text-muted-foreground mt-2">
            Klik tombol "Tambah Siswa" untuk menambahkan siswa baru
          </p>
        </div>
      </div>
    );
  }

  // Mobile view - card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {students.map((student, index) => (
          <StudentCard
            key={student.id}
            student={student}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  // Desktop view - table layout
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">No</TableHead>
              <TableHead>Foto</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Nama Siswa</TableHead>
              <TableHead>L/P</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => (
              <TableRow key={student.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={student.photo || undefined} alt={student.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    student.gender === 'L' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-pink-100 text-pink-700'
                  )}>
                    {student.gender === 'L' ? '👦 L' : '👧 P'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {student.class}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {student.barcode}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(student)}
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(student)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
