'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/lib/slices/authSlice';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Flag, Users, LogOut, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
    <div className="flex h-full w-56 flex-col border-r bg-neutral-50">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-sm font-bold">Admin Panel</h1>
        <LanguageSwitcher />
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100',
              pathname === item.href && 'bg-neutral-200 font-medium'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="space-y-2 p-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100"
        >
          <MessageSquare className="h-4 w-4" />
          Back to Chat
        </Link>
      </div>
      <Separator />
      <div className="flex items-center justify-between p-4">
        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
