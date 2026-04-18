import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';

/**
 * Right-click on a collection shelf stack: manage Wee collections or jump to manage dialog.
 */
export default function CollectionShelfContextMenu({
  children,
  collection,
  onOpenShelf,
  onOpenManage,
  onRenameShelf,
  onDeleteShelf,
}) {
  const isWee = collection?.id && String(collection.id).startsWith('wee-');

  const handleRename = useCallback(() => {
    if (!isWee) return;
    onRenameShelf?.(collection);
  }, [collection, isWee, onRenameShelf]);

  const handleDelete = useCallback(() => {
    if (!isWee) return;
    onDeleteShelf?.(collection);
  }, [collection, isWee, onDeleteShelf]);

  return (
    <ContextMenu.Root modal={false}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="aura-hub-context-menu"
          collisionPadding={12}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <ContextMenu.Item className="aura-hub-context-menu__item" onSelect={() => onOpenShelf?.(collection)}>
            Toggle shelf
          </ContextMenu.Item>
          <ContextMenu.Item className="aura-hub-context-menu__item" onSelect={() => onOpenManage?.()}>
            Manage collections…
          </ContextMenu.Item>
          {isWee ? (
            <>
              <ContextMenu.Item className="aura-hub-context-menu__item" onSelect={handleRename}>
                Rename collection…
              </ContextMenu.Item>
              <ContextMenu.Item
                className="aura-hub-context-menu__item aura-hub-context-menu__item--danger"
                onSelect={handleDelete}
              >
                Delete collection…
              </ContextMenu.Item>
            </>
          ) : null}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

CollectionShelfContextMenu.propTypes = {
  children: PropTypes.node.isRequired,
  collection: PropTypes.object.isRequired,
  onOpenShelf: PropTypes.func,
  onOpenManage: PropTypes.func,
  onRenameShelf: PropTypes.func,
  onDeleteShelf: PropTypes.func,
};
