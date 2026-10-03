import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const handleClick = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  // Logged-out visitors: bell sends them to login
  if (!isAuthenticated) {
    return (
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => navigate('/profile')}>
        <Bell className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-4 text-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
        ) : (
          <ScrollArea className="max-h-96">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
                  n.is_read ? '' : 'bg-primary/5'
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
