'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ReactNode } from 'react';

export type ErrorSeverity = 'info' | 'warning' | 'error';

interface ErrorDisplayProps {
  severity?: ErrorSeverity;
  title?: string;
  children: ReactNode;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  severity = 'error',
  title,
  children,
  onRetry,
  className = '',
}: ErrorDisplayProps) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const colors = {
    info: 'bg-blue-900/30 border-blue-700 text-blue-400',
    warning: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
    error: 'bg-red-900/30 border-red-700 text-red-400',
  };

  const Icon = icons[severity];

  return (
    <div className={`p-4 rounded-lg border ${colors[severity]} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          <div className="text-sm opacity-90">{children}</div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ApiError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <ErrorDisplay severity="error" title="Erreur API" onRetry={onRetry}>
      {message}
    </ErrorDisplay>
  );
}

export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-slate-400">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export function EmptyState({ message = 'Aucune donnée disponible' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-slate-400">
      <span>{message}</span>
    </div>
  );
}
