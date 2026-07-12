import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PresetListItem } from '../../app-library';
import Text from '../../../ui/Text';
import Button from '../../../ui/WButton';

const ROW_ESTIMATE_PX = 96;
const VIRTUALIZE_THRESHOLD = 18;

/** Saved preset list — thumbnail rows; parent provides wee shell. */
const PresetsSavedListCard = React.memo(
  ({
    presets,
    excludeName,
    draggingPreset,
    dropTarget,
    editingPreset,
    editName,
    justUpdated,
    justApplied,
    communityUpdateMap,
    customPresetCount,
    maxCustomPresets,
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
    onApplyToActiveProfile,
    hasActiveProfile,
    onApplyCommunityUpdate,
    onShare,
    onFocusSaveSection,
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

    if (filtered.length === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-2xl border border-dashed border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary)/0.45)] px-5 py-8 text-center">
            <Text variant="body" className="!m-0 font-semibold text-[hsl(var(--text-primary))]">
              No saved looks yet
            </Text>
            <Text variant="caption" className="!mt-2 !mb-4 block text-[hsl(var(--text-tertiary))]">
              Capture your current wallpaper and colors as a named preset.
            </Text>
            {onFocusSaveSection ? (
              <Button variant="primary" onClick={onFocusSaveSection}>
                Save current look
              </Button>
            ) : null}
          </div>
        </div>
      );
    }

    const meter = (
      <Text variant="caption" className="!mb-3 !mt-0 block text-[hsl(var(--text-tertiary))]">
        {customPresetCount} / {maxCustomPresets} custom looks saved · Drag ⋮⋮ to reorder
      </Text>
    );

    const itemProps = (preset) => {
      const presetId = preset.id || preset.name;
      return {
        preset,
        isDragging: draggingPreset === presetId,
        isDropTarget: dropTarget === presetId,
        editingPreset,
        editName,
        justUpdated,
        justApplied,
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
        onApplyToActiveProfile,
        hasActiveProfile,
        hasCommunityUpdate: Boolean(communityUpdateMap[preset.id || preset.name]?.hasUpdate),
        onApplyCommunityUpdate,
        onShare,
      };
    };

    if (!useVirtual) {
      return (
        <div>
          {meter}
          <ul className="m-0 mb-0 list-none p-0">
            {filtered.map((preset) => (
              <PresetListItem key={preset.id || preset.name} {...itemProps(preset)} />
            ))}
          </ul>
        </div>
      );
    }

    const items = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    return (
      <div>
        {meter}
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
                  key={preset.id || preset.name}
                  ref={virtualizer.measureElement}
                  dataIndex={vi.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vi.start}px)`,
                  }}
                  {...itemProps(preset)}
                />
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
);

PresetsSavedListCard.displayName = 'PresetsSavedListCard';

export default PresetsSavedListCard;
