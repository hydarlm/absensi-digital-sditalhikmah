import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, UserX, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const typeStyles = {
  info: {
    icon: AlertCircle,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    border: 'border-l-blue-500',
  },
  warning: {
    icon: Clock,
    bg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    border: 'border-l-amber-500',
  },
  success: {
    icon: Check,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    border: 'border-l-emerald-500',
  },
  error: {
    icon: UserX,
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    border: 'border-l-red-500',
  },
};

interface NotificationDropdownProps {
  onViewAll?: () => void;
}

export function NotificationDropdown({ onViewAll }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await notificationsService.getAll();
      // setNotifications(response);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      // await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            🔔 Notifikasi
            {unreadCount > 0 && <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">{unreadCount} baru</span>}
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-primary hover:text-primary">
              Tandai semua dibaca
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[300px] sm:max-h-[400px]">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="h-10 w-10 mx-auto mb-2 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Memuat notifikasi...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const style = typeStyles[notification.type];
                const Icon = style.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn('relative flex gap-3 p-3 sm:p-4 cursor-pointer transition-colors border-l-4', style.border, notification.read ? 'bg-background' : style.bg)}>
                    <div className={cn('flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center', style.bg, style.iconColor)}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium truncate', !notification.read && 'text-foreground')}>{notification.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && <span className="absolute top-3 sm:top-4 right-10 w-2 h-2 bg-primary rounded-full" />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/30">
            <Button
              variant="ghost"
              className="w-full text-sm"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                onViewAll?.();
              }}>
              Lihat semua notifikasi
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
