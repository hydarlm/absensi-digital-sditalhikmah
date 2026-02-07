import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant: 'present' | 'late' | 'sick' | 'permission' | 'default';
  description?: string;
  className?: string;
}

const variantClasses = {
  present: 'stat-card-present',
  late: 'stat-card-late',
  sick: 'stat-card-sick',
  permission: 'stat-card-permission',
  default: 'bg-card text-card-foreground border',
};

export function StatCard({ title, value, icon: Icon, variant, description, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {description && (
            <p className={cn(
              'text-xs mt-2',
              variant === 'default' ? 'text-muted-foreground' : 'text-white/70'
            )}>
              {description}
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          variant === 'default' ? 'bg-muted' : 'bg-white/20'
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
