import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PresetListItem } from '../../app-library';

const ROW_ESTIMATE_PX = 88;
const VIRTUALIZE_THRESHOLD = 18;

/** Saved preset list — body only (parent provides wee shell + description). */
const PresetsSavedListCard = React.memo(
  ({
    presets,
    excludeName,
    draggingPreset,
    dropTarget,
    editingPreset,
    editName,
    justUpdated,
    communityUpdateMap,
    onDragStart,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onDragEnd,
    onApply,
    onUpdate,
    onStartEdit,
    onDelete,
    onSaveEdit,
    onCancelEdit,
    onEditNameChange,
    onKeyPress,
    onApplyToActiveWorkspace,
    hasActiveWorkspace,
  }) => {
    const filtered = useMemo(
      () => presets.filter((preset) => preset.name !== excludeName),
      [presets, excludeName]
    );

    const parentRef = useRef(null);

    const virtualizer = useVirtualizer({
      count: filtered.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => ROW_ESTIMATE_PX,
      overscan: 6,
    });

    const useVirtual = filtered.length >= VIRTUALIZE_THRESHOLD;

    const renderItem = (preset) => {
      const isDragging = draggingPreset === preset.name;
      const isDropTarget = dropTarget === preset.name;

      return (
        <PresetListItem
          preset={preset}
          isDragging={isDragging}
          isDropTarget={isDropTarget}
          isSelected={false}
          selectMode={false}
          editingPreset={editingPreset}
          editName={editName}
          justUpdated={justUpdated}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onToggleSelect={() => {}}
          onApply={onApply}
          onUpdate={onUpdate}
          onStartEdit={onStartEdit}
          onDelete={onDelete}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onEditNameChange={onEditNameChange}
          onKeyPress={onKeyPress}
          onApplyToActiveWorkspace={onApplyToActiveWorkspace}
          hasActiveWorkspace={hasActiveWorkspace}
          hasCommunityUpdate={Boolean(communityUpdateMap[preset.name]?.hasUpdate)}
        />
      );
    };

    if (!useVirtual) {
      return (
        <ul className="m-0 mb-0 list-none p-0">
          {filtered.map((preset) => (
            <React.Fragment key={preset.name}>{renderItem(preset)}</React.Fragment>
          ))}
        </ul>
      );
    }

    const items = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    return (
      <div
        ref={parentRef}
        className="max-h-[min(55vh,520px)] overflow-y-auto pr-1"
        style={{ contain: 'strict' }}
      >
        <ul
          className="m-0 mb-0 list-none p-0"
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((vi) => {
            const preset = filtered[vi.index];
            if (!preset) return null;
            return (
              <PresetListItem
                key={preset.name}
                ref={virtualizer.measureElement}
                dataIndex={vi.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vi.start}px)`,
                }}
                preset={preset}
                isDragging={draggingPreset === preset.name}
                isDropTarget={dropTarget === preset.name}
                isSelected={false}
                selectMode={false}
                editingPreset={editingPreset}
                editName={editName}
                justUpdated={justUpdated}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onToggleSelect={() => {}}
                onApply={onApply}
                onUpdate={onUpdate}
                onStartEdit={onStartEdit}
                onDelete={onDelete}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onEditNameChange={onEditNameChange}
                onKeyPress={onKeyPress}
                onApplyToActiveWorkspace={onApplyToActiveWorkspace}
                hasActiveWorkspace={hasActiveWorkspace}
                hasCommunityUpdate={Boolean(communityUpdateMap[preset.name]?.hasUpdate)}
              />
            );
          })}
        </ul>
      </div>
    );
  }
);

PresetsSavedListCard.displayName = 'PresetsSavedListCard';

export default PresetsSavedListCard;
