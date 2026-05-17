'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/lib/slices/authSlice';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Flag, Users, LogOut, MessageSquare, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/features', label: 'Feature Flags', icon: Flag },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="flex h-full w-60 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-sm font-bold text-foreground">Admin Panel</h1>
      </div>

      <div className="px-3 pb-2">
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              pathname === item.href && 'bg-primary/10 text-primary font-medium'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          Back to Chat
        </Link>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
