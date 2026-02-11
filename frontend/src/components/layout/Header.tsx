import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatters';
import { NotificationDropdown } from '@/components/features/NotificationDropdown';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const today = formatDate(new Date().toISOString().split('T')[0]);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <span className="hidden md:block text-sm text-muted-foreground">
            {today}
          </span>
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
