import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PresetListItem } from '../../app-library';
import Text from '../../../ui/Text';
import Button from '../../../ui/WButton';

/** Saved presets shown per page in Looks settings. */
export const PRESETS_PER_PAGE = 5;

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
    onApplyCommunityUpdate,
    onShare,
    onImportFile,
    onFocusSaveSection,
  }) => {
    const filtered = useMemo(
      () => presets.filter((preset) => preset.name !== excludeName),
      [presets, excludeName]
    );

    const pageCount = Math.max(1, Math.ceil(filtered.length / PRESETS_PER_PAGE));
    const [page, setPage] = useState(0);

    useEffect(() => {
      setPage((prev) => Math.min(prev, pageCount - 1));
    }, [pageCount]);

    const pageItems = useMemo(() => {
      const start = page * PRESETS_PER_PAGE;
      return filtered.slice(start, start + PRESETS_PER_PAGE);
    }, [filtered, page]);

    if (filtered.length === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-2xl border border-dashed border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary)/0.45)] px-5 py-8 text-center">
            <Text variant="body" className="!m-0 font-semibold text-[hsl(var(--text-primary))]">
              No saved presets yet
            </Text>
            <Text variant="caption" className="!mt-2 !mb-4 block text-[hsl(var(--text-tertiary))]">
              Capture your current wallpaper and colors as a named preset.
            </Text>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onFocusSaveSection ? (
                <Button variant="primary" onClick={onFocusSaveSection}>
                  Save current look
                </Button>
              ) : null}
              {onImportFile ? (
                <Button variant="secondary" onClick={onImportFile}>
                  Import .wee-preset
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

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
        hasCommunityUpdate: Boolean(communityUpdateMap[preset.id || preset.name]?.hasUpdate),
        onApplyCommunityUpdate,
        onShare,
      };
    };

    const showPager = filtered.length > PRESETS_PER_PAGE;
    const rangeStart = page * PRESETS_PER_PAGE + 1;
    const rangeEnd = Math.min(filtered.length, (page + 1) * PRESETS_PER_PAGE);

    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
            {customPresetCount} custom preset{customPresetCount === 1 ? '' : 's'} · Drag ⋮⋮ to
            reorder
            {showPager ? ` · Showing ${rangeStart}–${rangeEnd}` : ''}
          </Text>
          {onImportFile ? (
            <Button variant="tertiary" size="sm" onClick={onImportFile}>
              Import .wee-preset
            </Button>
          ) : null}
        </div>

        <ul className="m-0 mb-0 list-none p-0">
          {pageItems.map((preset) => (
            <PresetListItem key={preset.id || preset.name} {...itemProps(preset)} />
          ))}
        </ul>

        {showPager ? (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous presets page"
              title="Previous page"
            >
              <span className="inline-flex items-center gap-1">
                <ChevronLeft size={14} strokeWidth={2.5} aria-hidden />
                Prev
              </span>
            </Button>
            <Text
              variant="caption"
              className="!m-0 min-w-[5.5rem] text-center font-semibold tabular-nums text-[hsl(var(--text-secondary))]"
            >
              Page {page + 1} of {pageCount}
            </Text>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              aria-label="Next presets page"
              title="Next page"
            >
              <span className="inline-flex items-center gap-1">
                Next
                <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
              </span>
            </Button>
          </div>
        ) : null}
      </div>
    );
  }
);

PresetsSavedListCard.displayName = 'PresetsSavedListCard';

export default PresetsSavedListCard;
