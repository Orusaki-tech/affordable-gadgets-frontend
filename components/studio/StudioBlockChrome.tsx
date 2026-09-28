'use client';

import type { ReactNode } from 'react';

type StudioBlockChromeProps = {
  label: string;
  onEdit: () => void;
  children: ReactNode;
  className?: string;
  /** Shown in the edit button title so editors know their role context. */
  roleHint?: string;
};

/** Always-visible edit control over any mirrored storefront block. */
export function StudioBlockChrome({
  label,
  onEdit,
  children,
  className,
  roleHint,
}: StudioBlockChromeProps) {
  const title = roleHint ? `Edit ${label} · ${roleHint}` : `Edit ${label}`;
  return (
    <div className={`studio-editable-card${className ? ` ${className}` : ''}`}>
      <div className="studio-editable-card__chrome" aria-label="Studio actions">
        <button
          type="button"
          className="studio-icon-btn studio-icon-btn--edit"
          title={title}
          aria-label={title}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
          </svg>
          <span>Edit</span>
        </button>
      </div>
      {children}
    </div>
  );
}
