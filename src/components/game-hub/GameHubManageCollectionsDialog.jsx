import React, { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import WButton from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import AuraHubModalFrame from './AuraHubModalFrame';

export default function GameHubManageCollectionsDialog({ open, onOpenChange }) {
  const { weeCollections, renameWeeCollection, deleteWeeCollection, createWeeCollection } = useConsolidatedAppStore(
    useShallow((state) => ({
      weeCollections: state.gameHub?.library?.weeCollections || [],
      renameWeeCollection: state.actions.renameWeeCollection,
      deleteWeeCollection: state.actions.deleteWeeCollection,
      createWeeCollection: state.actions.createWeeCollection,
    }))
  );

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setEditValue('');
    }
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const startRename = useCallback((c) => {
    setEditingId(c.id);
    setEditValue(c.label || '');
  }, []);

  const commitRename = useCallback(() => {
    if (!editingId) return;
    renameWeeCollection(editingId, editValue);
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, renameWeeCollection]);

  const handleCreate = useCallback(() => {
    createWeeCollection('New collection');
  }, [createWeeCollection]);

  return (
    <AuraHubModalFrame open={open} onOpenChange={onOpenChange} ariaLabelledBy="hub-manage-collections-title">
      <div className="aura-hub-modal__header">
        <h2 id="hub-manage-collections-title" className="aura-hub-modal__title">
          Manage collections
        </h2>
        <button type="button" className="aura-hub-modal__close" onClick={close} aria-label="Close">
          ×
        </button>
      </div>
      <p className="aura-hub-modal__hint">
        Rename or delete collections. Right-click games in the hub to add them to a collection.
      </p>
      <ul className="aura-hub-modal__list">
        {weeCollections.length === 0 ? (
          <li className="aura-hub-modal__empty">No custom collections yet. Create one below or use &quot;New collection…&quot; from a game&apos;s menu.</li>
        ) : (
          weeCollections.map((c) => (
            <li key={c.id} className="aura-hub-modal__row">
              {editingId === c.id ? (
                <>
                  <input
                    type="text"
                    className="aura-hub-modal__input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditValue('');
                      }
                    }}
                    autoFocus
                  />
                  <WButton type="button" variant="secondary" onClick={commitRename}>
                    Save
                  </WButton>
                </>
              ) : (
                <>
                  <span className="aura-hub-modal__label">{c.label}</span>
                  <div className="aura-hub-modal__actions">
                    <WButton type="button" variant="secondary" onClick={() => startRename(c)}>
                      Rename
                    </WButton>
                    <WButton
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (window.confirm(`Delete collection “${c.label}”?`)) {
                          deleteWeeCollection(c.id);
                        }
                      }}
                    >
                      Delete
                    </WButton>
                  </div>
                </>
              )}
            </li>
          ))
        )}
      </ul>
      <div className="aura-hub-modal__footer">
        <WButton type="button" onClick={handleCreate}>
          New collection
        </WButton>
        <WButton type="button" variant="secondary" onClick={close}>
          Done
        </WButton>
      </div>
    </AuraHubModalFrame>
  );
}
