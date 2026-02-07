import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getSemesterLabel, getAcademicYear } from '@/utils/formatters';

interface SemesterFilterProps {
  semester: 1 | 2;
  year: number;
  classFilter: string;
  classes: string[];
  onSemesterChange: (semester: 1 | 2) => void;
  onYearChange: (year: number) => void;
  onClassChange: (classFilter: string) => void;
}

export function SemesterFilter({
  semester,
  year,
  classFilter,
  classes,
  onSemesterChange,
  onYearChange,
  onClassChange,
}: SemesterFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border">
      {/* Semester */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-xs sm:text-sm">Semester</Label>
        <Select
          value={semester.toString()}
          onValueChange={(value) => onSemesterChange(parseInt(value) as 1 | 2)}
        >
          <SelectTrigger className="h-9 sm:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{getSemesterLabel(1)}</SelectItem>
            <SelectItem value="2">{getSemesterLabel(2)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Academic Year */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-xs sm:text-sm">Tahun Ajaran</Label>
        <Select
          value={year.toString()}
          onValueChange={(value) => onYearChange(parseInt(value))}
        >
          <SelectTrigger className="h-9 sm:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {getAcademicYear(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Class */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-xs sm:text-sm">Kelas</Label>
        <Select value={classFilter} onValueChange={onClassChange}>
          <SelectTrigger className="h-9 sm:h-10">
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
      </div>
    </div>
  );
}
