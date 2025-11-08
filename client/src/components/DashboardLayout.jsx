import { Home, Users, FileText, CreditCard, Settings, BarChart3, Bell, LogOut, Menu, X, ClipboardCheck, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggle from './ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import avatar1 from '@assets/generated_images/Professional_woman_avatar_headshot_e904369d.png';

export default function DashboardLayout({ 
  children, 
  role = 'user' 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useUser();

  const superAdminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/superadmin/dashboard' },
    { icon: Shield, label: 'Admins', path: '/superadmin/admins' },
    { icon: Users, label: 'All Users', path: '/superadmin/users' },
    { icon: BarChart3, label: 'Analytics', path: '/superadmin/analytics' },
    { icon: Settings, label: 'Settings', path: '/superadmin/settings' },
  ];

  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: ClipboardCheck, label: 'Verifications', path: '/admin/verifications' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const userMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
    { icon: CreditCard, label: 'Payments', path: '/dashboard/payments' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const partnerMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/partner/dashboard' },
    { icon: Users, label: 'Clients', path: '/partner/clients' },
    { icon: BarChart3, label: 'Reports', path: '/partner/reports' },
    { icon: Settings, label: 'Settings', path: '/partner/settings' },
  ];

  const menuItems = role === 'superadmin' ? superAdminMenuItems : role === 'admin' ? adminMenuItems : role === 'partner' ? partnerMenuItems : userMenuItems;

  return (
    <div className="flex h-screen bg-background">
      <aside className={`\${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/terrismart-logo.png" alt="TerriSmart" className="h-8 w-auto" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  TerriSmart
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
                data-testid="button-close-sidebar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location === item.path;
              return (
                <Link key={index} href={item.path}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors \${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover-elevate'
                    }`}
                    data-testid={`link-\${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Badge variant="secondary" className="mb-4" data-testid="badge-role">
              {(user?.role || role).charAt(0).toUpperCase() + (user?.role || role).slice(1)}
            </Badge>
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={user?.avatar || avatar1} />
                <AvatarFallback>
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              data-testid="button-logout"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
