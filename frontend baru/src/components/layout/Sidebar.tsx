import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import schoolLogo from '@/assets/school-logo.png';
import {
  LayoutDashboard,
  ScanLine,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  BookOpen,
  UserCog,  // NEW: For admin user management
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'teacher'] },
  { icon: ScanLine, label: 'Scan Absensi', path: '/dashboard/scan', roles: ['admin', 'teacher'] },
  { icon: Users, label: 'Data Siswa', path: '/dashboard/students', roles: ['admin'] },
  { icon: BookOpen, label: 'Manajemen Kelas', path: '/dashboard/classes', roles: ['admin'] },
  { icon: FileText, label: 'Laporan Semester', path: '/dashboard/reports', roles: ['admin'] },
  { icon: UserCog, label: 'Kelola Pengguna', path: '/dashboard/users', roles: ['admin'] },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <img
                src='/logosekolah.png'
                alt="SDIT AL HIKMAH"
                className="w-10 h-10"
              />
              <div className="flex flex-col">
                <span className="font-bold text-sm">SDIT AL HIKMAH</span>
                <span className="text-xs text-sidebar-foreground/70">Absensi Digital</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {menuItems
              .filter(item => item.roles.includes(user?.role || 'teacher'))
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && onToggle()}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                        : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.username || 'User'}</span>
                <span className="text-xs text-sidebar-foreground/70 capitalize">{user?.role || 'Teacher'}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
