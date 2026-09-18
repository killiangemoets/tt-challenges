import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/helpers/tailwind';
import type { DocumentStatus } from '@/schemas/api';

export const Button = ({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) => (
  <button
    className={cn(
      'inline-flex min-h-9 items-center justify-center gap-2 rounded-sm border px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' &&
        'border-primary bg-primary text-white hover:bg-primary-dark',
      variant === 'secondary' &&
        'border-strong bg-card text-foreground hover:border-foreground',
      variant === 'danger' &&
        'border-destructive bg-destructive text-white hover:bg-destructive-dark',
      variant === 'ghost' &&
        'border-transparent bg-transparent text-muted-foreground hover:bg-subtle',
      className,
    )}
    {...props}
  />
);

export const Card = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn('rounded border bg-card', className)}>
    {children}
  </section>
);

export const SectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) => (
  <header className="flex min-h-12 flex-wrap items-center gap-3 border-b border-soft px-4 py-3">
    <h2 className="eyebrow">{title}</h2>
    <div className="ml-auto">{action}</div>
  </header>
);

const statusClasses: Record<DocumentStatus, string> = {
  queued: 'bg-status-neutral text-muted-foreground',
  processing: 'bg-status-warning text-warning',
  ready: 'bg-status-ready text-primary-dark',
  failed: 'bg-status-error text-destructive',
};

export const StatusBadge = ({ status }: { status: DocumentStatus }) => (
  <span
    className={cn(
      'inline-flex rounded-sm px-2 py-1 text-[10px] font-medium uppercase tracking-wider',
      statusClasses[status],
    )}
  >
    {status}
  </span>
);

export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="p-6 text-sm text-muted-foreground" role="status">
    {label}
  </div>
);

export const ErrorState = ({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) => (
  <div className="m-4 rounded-sm border border-error-border bg-status-error p-4 text-sm text-destructive">
    <p>{message}</p>
    {retry && (
      <Button className="mt-3" variant="danger" onClick={retry}>
        Try again
      </Button>
    )}
  </div>
);

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="p-6 text-sm text-muted-foreground">{children}</div>
);

export const Modal = ({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4"
    role="presentation"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section
      aria-describedby="modal-description"
      aria-modal="true"
      className="w-full max-w-md rounded border bg-card shadow-lg"
      role="dialog"
    >
      <header className="border-b border-soft px-5 py-4">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        <p
          className="mt-1 text-xs leading-5 text-muted-foreground"
          id="modal-description"
        >
          {description}
        </p>
      </header>
      {children}
    </section>
  </div>
);
