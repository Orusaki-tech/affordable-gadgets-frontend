'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import {
  createStudioPromotionType,
  deleteStudioPromotion,
  deleteStudioPromotionType,
  listAllStudioPromotions,
  listStudioPromotionTypes,
  patchStudioPromotionType,
  StudioApiError,
  type StudioPromotion,
  type StudioPromotionType,
} from '@/lib/studio/api';
import { StudioPromotionEditor } from '@/components/studio/StudioPromotionEditor';
import { StudioCharCount } from '@/components/studio/StudioCharCount';

type StudioPromotionsManagerProps = {
  roleHint?: string;
  onSaved?: () => void;
  onEditPromotion?: (promotion: StudioPromotion) => void;
};

export function StudioPromotionsManager({
  roleHint,
  onSaved,
  onEditPromotion,
}: StudioPromotionsManagerProps) {
  const { capabilities } = useStudioAuth();
  const canManageTypes = capabilities.canManagePromotionTypes;
  const [promotions, setPromotions] = useState<StudioPromotion[]>([]);
  const [types, setTypes] = useState<StudioPromotionType[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<StudioPromotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const reload = async () => {
    const [promos, typeData] = await Promise.all([
      listAllStudioPromotions(),
      listStudioPromotionTypes(),
    ]);
    setPromotions(promos);
    setTypes(typeData);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof StudioApiError ? err.message : 'Could not load promotions');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeletePromo = async (promo: StudioPromotion) => {
    if (!window.confirm(`Delete promotion “${promo.title || promo.id}”?`)) return;
    setBusyId(promo.id);
    setError(null);
    try {
      await deleteStudioPromotion(promo.id);
      await reload();
      setMsg('Promotion deleted.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateType = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!typeName.trim() || !typeCode.trim()) {
      setError('Type name and code are required.');
      return;
    }
    try {
      await createStudioPromotionType({
        name: typeName.trim(),
        code: typeCode.trim().toUpperCase().slice(0, 10),
        is_active: true,
      });
      setTypeName('');
      setTypeCode('');
      await reload();
      setMsg('Promotion type created.');
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not create type');
    }
  };

  const toggleTypeActive = async (type: StudioPromotionType) => {
    try {
      await patchStudioPromotionType(type.id, { is_active: !(type.is_active ?? true) });
      await reload();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not update type');
    }
  };

  const handleDeleteType = async (type: StudioPromotionType) => {
    if (!window.confirm(`Delete promotion type “${type.name}”?`)) return;
    try {
      await deleteStudioPromotionType(type.id);
      await reload();
      setMsg('Promotion type deleted.');
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not delete type');
    }
  };

  if (loading) return <p className="studio-editor__hint">Loading promotions…</p>;

  if (creating || editing) {
    return (
      <StudioPromotionEditor
        key={creating ? 'create' : `edit-${editing?.id}`}
        promotion={creating ? null : editing}
        roleHint={creating ? 'Create promotion' : 'Edit promotion'}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await reload();
          setMsg(creating ? 'Promotion created.' : 'Promotion saved.');
          onSaved?.();
        }}
      />
    );
  }

  return (
    <div className="studio-editor studio-editor--flush">
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Promotions'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">Manage promotions</h2>
        </div>
        <button type="button" className="studio-btn studio-btn--primary" onClick={() => setCreating(true)}>
          Create promotion
        </button>
      </div>

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      {msg && (
        <div className="studio-alert studio-alert--ok" role="status">
          {msg}
        </div>
      )}

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Promotions ({promotions.length})</h3>
        <ul className="studio-hero-placement__list">
          {promotions.map((promo) => (
            <li key={promo.id}>
              <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                <button
                  type="button"
                  className="studio-hero-placement__title"
                  style={{ background: 'none', border: 0, textAlign: 'left', flex: 1, cursor: 'pointer' }}
                  onClick={() => {
                    if (onEditPromotion) onEditPromotion(promo);
                    else setEditing(promo);
                  }}
                >
                  {promo.title || `Promotion #${promo.id}`}
                  {promo.is_active === false ? ' (off)' : ''}
                </button>
                <button
                  type="button"
                  className="studio-icon-btn studio-icon-btn--edit"
                  disabled={busyId === promo.id}
                  onClick={() => {
                    if (onEditPromotion) onEditPromotion(promo);
                    else setEditing(promo);
                  }}
                >
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  disabled={busyId === promo.id}
                  onClick={() => void handleDeletePromo(promo)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Promotion types</h3>
        {canManageTypes ? (
          <>
            <form className="studio-editor__grid" onSubmit={handleCreateType}>
              <label className="studio-field">
                <span>
                  Name <StudioCharCount length={typeName.length} max={50} />
                </span>
                <input
                  className="studio-input"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  maxLength={50}
                />
              </label>
              <label className="studio-field">
                <span>
                  Code <StudioCharCount length={typeCode.length} max={10} />
                </span>
                <input
                  className="studio-input"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  placeholder="SO"
                  maxLength={10}
                />
              </label>
              <button type="submit" className="studio-btn studio-btn--primary">
                Add type
              </button>
            </form>
            <ul className="studio-hero-placement__list" style={{ marginTop: '0.75rem' }}>
              {types.map((type) => (
                <li key={type.id}>
                  <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                    <span className="studio-hero-placement__title">
                      {type.name} ({type.code})
                      {type.is_active === false ? ' · off' : ''}
                    </span>
                    <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void toggleTypeActive(type)}>
                      {type.is_active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDeleteType(type)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="studio-editor__hint">
            Promotion types are managed by Marketing Managers. Available:{' '}
            {types.map((t) => t.name).join(', ') || 'none'}.
          </p>
        )}
      </section>
    </div>
  );
}
