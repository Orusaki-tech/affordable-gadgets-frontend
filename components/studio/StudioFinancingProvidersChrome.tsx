'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import {
  listStudioFinancingProviders,
  type StudioFinancingProvider,
} from '@/lib/studio/api';

/**
 * Lists financing providers with edit chrome when the signed-in role can manage them (IM).
 */
export function StudioFinancingProvidersChrome({
  children,
  variant = 'dark',
}: {
  children: ReactNode;
  variant?: 'dark' | 'light';
}) {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditFinancing);
  const [providers, setProviders] = useState<StudioFinancingProvider[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listStudioFinancingProviders();
        if (!cancelled) setProviders(rows.filter((p) => p.id));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load financing providers');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canEdit]);

  if (!canEdit) return <>{children}</>;

  return (
    <div className={`studio-financing-chrome studio-financing-chrome--${variant}`}>
      {children}
      <div className="studio-financing-chrome__panel" role="region" aria-label="Edit financing partners">
        <p className="studio-financing-chrome__label">
          {studioEdit?.capabilities.editableSummary || 'Financing partners'}
        </p>
        <button
          type="button"
          className="studio-btn studio-btn--primary"
          style={{ marginBottom: '0.5rem' }}
          onClick={() => studioEdit?.openFinancingOffers()}
        >
          Manage offers
        </button>
        {error && <p className="studio-financing-chrome__error">{error}</p>}
        <ul className="studio-financing-chrome__list">
          {providers.map((provider) => (
            <li key={provider.id}>
              <StudioBlockChrome
                label={provider.name || `Provider ${provider.id}`}
                roleHint={studioEdit?.capabilities.roleLabel}
                onEdit={() => {
                  void studioEdit?.openEditFinancingProvider(provider.id);
                }}
              >
                <button
                  type="button"
                  className="studio-financing-chrome__chip"
                  onClick={() => void studioEdit?.openEditFinancingProvider(provider.id)}
                >
                  {provider.name || `Provider #${provider.id}`}
                  {provider.is_active === false ? ' (inactive)' : ''}
                </button>
              </StudioBlockChrome>
            </li>
          ))}
          {!providers.length && !error && (
            <li className="studio-financing-chrome__empty">No financing providers loaded.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
