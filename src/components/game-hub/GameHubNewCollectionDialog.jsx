import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import WButton from '../../ui/WButton';
import Text from '../../ui/Text';
import AuraHubModalFrame from './AuraHubModalFrame';

export default function GameHubNewCollectionDialog({ open, onOpenChange, onCreate }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  const submit = useCallback(() => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    onCreate(trimmed);
    onOpenChange(false);
  }, [name, onCreate, onOpenChange]);

  return (
    <AuraHubModalFrame open={open} onOpenChange={onOpenChange} ariaLabelledBy="hub-new-collection-title">
      <div className="aura-hub-modal__header">
        <h2 id="hub-new-collection-title" className="aura-hub-modal__title">
          New collection
        </h2>
        <button type="button" className="aura-hub-modal__close" onClick={() => onOpenChange(false)} aria-label="Close">
          ×
        </button>
      </div>
      <p className="aura-hub-modal__hint">Name your collection, then add games from the hub.</p>
      <div className="mb-3">
        <Text variant="label" className="mb-1 block">
          Name
        </Text>
        <input
          type="text"
          className="aura-hub-modal__input w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          autoFocus
        />
      </div>
      <div className="aura-hub-modal__actions">
        <WButton variant="secondary" type="button" onClick={() => onOpenChange(false)}>
          Cancel
        </WButton>
        <WButton variant="primary" type="button" onClick={submit} disabled={!String(name || '').trim()}>
          Create
        </WButton>
      </div>
    </AuraHubModalFrame>
  );
}

GameHubNewCollectionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
