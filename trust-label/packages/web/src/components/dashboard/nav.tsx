'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserRole } from '@trust-label/shared';
import {
  LayoutDashboard,
  Package,
  FileCheck,
  QrCode,
  BarChart3,
  Users,
  Settings,
  FlaskConical,
  UserCheck,
  Shield,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.BRAND, UserRole.LABORATORY, UserRole.PRESCRIBER],
  },
  {
    title: 'Produtos',
    href: '/dashboard/products',
    icon: Package,
    roles: [UserRole.ADMIN, UserRole.BRAND],
  },
  {
    title: 'Validações',
    href: '/dashboard/validations',
    icon: FileCheck,
    roles: [UserRole.ADMIN, UserRole.BRAND, UserRole.LABORATORY],
  },
  {
    title: 'QR Codes',
    href: '/dashboard/qr-codes',
    icon: QrCode,
    roles: [UserRole.ADMIN, UserRole.BRAND],
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.BRAND],
  },
  {
    title: 'Laboratórios',
    href: '/dashboard/laboratories',
    icon: FlaskConical,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Marcas',
    href: '/dashboard/brands',
    icon: Shield,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Prescritores',
    href: '/dashboard/prescribers',
    icon: UserCheck,
    roles: [UserRole.ADMIN, UserRole.PRESCRIBER],
  },
  {
    title: 'Usuários',
    href: '/dashboard/users',
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.BRAND, UserRole.LABORATORY, UserRole.PRESCRIBER],
  },
];

interface DashboardNavProps {
  userRole: UserRole;
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <nav className="flex flex-col w-64 border-r bg-card">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-trust-primary" />
          <span className="text-xl font-bold">TRUST LABEL</span>
        </Link>
      </div>
      <div className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}