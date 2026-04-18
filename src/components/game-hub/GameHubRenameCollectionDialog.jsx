import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import WButton from '../../ui/WButton';
import Text from '../../ui/Text';
import AuraHubModalFrame from './AuraHubModalFrame';

export default function GameHubRenameCollectionDialog({ open, onOpenChange, initialName, onSave }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(String(initialName || ''));
  }, [open, initialName]);

  const submit = useCallback(() => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    onSave(trimmed);
    onOpenChange(false);
  }, [name, onSave, onOpenChange]);

  return (
    <AuraHubModalFrame open={open} onOpenChange={onOpenChange} ariaLabelledBy="hub-rename-collection-title">
      <div className="aura-hub-modal__header">
        <h2 id="hub-rename-collection-title" className="aura-hub-modal__title">
          Rename collection
        </h2>
        <button type="button" className="aura-hub-modal__close" onClick={() => onOpenChange(false)} aria-label="Close">
          ×
        </button>
      </div>
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
          Save
        </WButton>
      </div>
    </AuraHubModalFrame>
  );
}

GameHubRenameCollectionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  initialName: PropTypes.string,
  onSave: PropTypes.func.isRequired,
};
