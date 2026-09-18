import { useState, type ReactNode } from 'react';
import { Menu, Plus, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { Button } from '@/components/ui';
import { UploadDialog } from '@/components/upload-dialog';
import { cn } from '@/helpers/tailwind';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/chat', label: 'Chat', end: false },
  { to: '/documents', label: 'Documents', end: false },
] as const;

export const AppShell = ({ children }: { children: ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex min-h-15 max-w-[1440px] items-center gap-6 px-4 md:px-7">
          <NavLink className="flex items-baseline gap-2.5" to="/">
            <span className="font-serif text-xl font-semibold">
              Second Brain
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
              DAW Capital
            </span>
          </NavLink>
          <nav
            className={cn(
              'absolute left-0 right-0 top-full border-b bg-card p-2 md:static md:flex md:border-0 md:p-0',
              isMenuOpen ? 'block' : 'hidden md:flex',
            )}
          >
            {links.map((link) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'block border-b-2 border-transparent px-3 py-4 text-sm text-muted-foreground hover:text-foreground',
                    isActive && 'border-primary text-foreground',
                  )
                }
                end={link.end}
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <span className="text-xs text-muted-foreground">
              Sam Iyer · Talent Associate
            </span>
            <span className="grid size-8 place-items-center rounded-full border bg-subtle text-[11px] font-semibold text-muted-foreground">
              SI
            </span>
          </div>
          <Button
            aria-label="Add file"
            className="hidden sm:inline-flex"
            onClick={() => setIsUploadOpen(true)}
          >
            <Plus size={15} /> Add file
          </Button>
          <Button
            aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
            className="md:hidden"
            variant="ghost"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </header>
      <main>{children}</main>
      {isUploadOpen && <UploadDialog onClose={() => setIsUploadOpen(false)} />}
    </div>
  );
};
