import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import avatar1 from '@assets/generated_images/Professional_woman_avatar_headshot_e904369d.png';
import avatar2 from '@assets/generated_images/Professional_man_avatar_headshot_1e57aa62.png';

export default function NotificationPanel({ onClose ) { onClose: () => void }) {
  const notifications= [
    {
      id: '1',
      avatar: avatar1,
      title,
      message,
      time: '5 minutes ago',
      read,
    },
    {
      id: '2',
      avatar: avatar2,
      title,
      message: 'Payment of $99.00 h,
      time: '1 hour ago',
      read,
    },
    {
      id: '3',
      title,
      message,
      time: '2 hours ago',
      read,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="default" data-testid="badge-unread-count">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" data-testid="button-mark-all-read">
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-panel">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b border-border hover-elevate cursor-pointer ${
              !notification.read ? 'bg-accent/50' : ''
            }`}
            data-testid={`notification-${notification.id}`}
          >
            <div className="flex gap-3">
              {notification.avatar ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={notification.avatar} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
