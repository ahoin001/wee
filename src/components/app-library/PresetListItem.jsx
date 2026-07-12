import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { m } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import { WeeEmphasisText, WeeButton, WeePressSurface } from '../../ui/wee';
import { createWeeTransition } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';

const PresetListItem = React.forwardRef(function PresetListItem(
  {
    preset,
    isDragging,
    isDropTarget,
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
    hasCommunityUpdate,
    onApplyCommunityUpdate,
    onShare,
    style,
    dataIndex,
  },
  ref
) {
  const presetKey = preset.id || preset.name;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { channelReorderSlotMotion } = useMotionFeedback();
  const reduceMotion = !channelReorderSlotMotion;
  const enterTransition = createWeeTransition('pillOpen', { reducedMotion: reduceMotion });

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const thumb = preset.thumbnailDataUrl;
  const scopeLabel =
    preset.captureScope === 'visual+homeChannels' ? 'Visual + Home' : 'Visual';

  return (
    <m.li
      ref={ref}
      data-index={dataIndex}
      style={style}
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: isDragging ? 0.98 : 1 }}
      transition={enterTransition}
      className={clsx(
        'mb-3 flex flex-col gap-3 rounded-2xl border px-3 py-3 transition-colors last:mb-0 md:flex-row md:items-center md:gap-4 md:px-4',
        isDragging ? 'cursor-grabbing opacity-60' : 'cursor-grab',
        isDropTarget
          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--surface-wii-tint)/0.45)] shadow-[var(--shadow-md)]'
          : 'border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-primary))] shadow-[var(--shadow-sm)]',
        justApplied === presetKey && 'ring-2 ring-[hsl(var(--primary)/0.55)]'
      )}
      draggable
      onDragStart={(e) => onDragStart(e, presetKey)}
      onDragOver={(e) => onDragOver(e, presetKey)}
      onDragEnter={(e) => onDragEnter(e, presetKey)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, presetKey)}
      onDragEnd={onDragEnd}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Text
          variant="small"
          className="shrink-0 cursor-grab select-none text-[hsl(var(--text-tertiary))]"
          title="Drag to reorder"
          aria-label="Drag preset to reorder"
        >
          ⋮⋮
        </Text>

        <div
          className={clsx(
            'relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary))]',
            justApplied === presetKey && 'scale-[1.03]'
          )}
        >
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
              Look
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {editingPreset === preset.id ? (
            <input
              type="text"
              value={editName}
              onChange={onEditNameChange}
              onKeyDown={onKeyPress}
              className="w-full max-w-full rounded-lg border-[1.5px] border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-3 py-2 text-base font-semibold text-[hsl(var(--text-primary))]"
              autoFocus
            />
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <WeeEmphasisText as="span" size="md" className="break-words">
                {preset.name}
              </WeeEmphasisText>
              <span className="inline-flex shrink-0 rounded-md bg-[hsl(var(--surface-secondary))] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--text-secondary))]">
                {scopeLabel}
              </span>
              {hasCommunityUpdate ? (
                <button
                  type="button"
                  className="inline-flex shrink-0 rounded-md bg-[hsl(var(--state-warning)/0.18)] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--state-warning))] underline-offset-2 hover:underline"
                  title="Install the newer community version"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplyCommunityUpdate?.(preset);
                  }}
                >
                  Update available
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pl-7 md:pl-0">
        {editingPreset === preset.id ? (
          <>
            <Button className="min-w-[4.5rem]" onClick={onSaveEdit}>
              Save
            </Button>
            <Button className="min-w-[4.5rem]" onClick={onCancelEdit}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <WeePressSurface as="div" className="inline-flex">
              <WeeButton
                variant="primary"
                className="min-w-[4.5rem]"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(preset);
                }}
              >
                Apply
              </WeeButton>
            </WeePressSurface>

            <div className="relative" ref={menuRef}>
              <Button
                variant="secondary"
                size="sm"
                aria-label="More preset actions"
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
              >
                <MoreHorizontal size={16} aria-hidden />
              </Button>
              {menuOpen ? (
                <div className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] py-1 shadow-[var(--shadow-lg)]">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-secondary))]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onUpdate(presetKey);
                    }}
                  >
                    {justUpdated === presetKey ? 'Updated!' : 'Update from current'}
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-secondary))] disabled:opacity-45"
                    disabled={!hasActiveProfile}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onApplyToActiveProfile(preset);
                    }}
                  >
                    Apply to profile
                  </button>
                  {preset.shareable !== false && onShare ? (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-secondary))]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onShare(preset);
                      }}
                    >
                      Share…
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-secondary))]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onStartEdit(preset);
                    }}
                  >
                    Rename
                  </button>
                  {hasCommunityUpdate ? (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm font-medium text-[hsl(var(--state-warning))] hover:bg-[hsl(var(--surface-secondary))]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onApplyCommunityUpdate?.(preset);
                      }}
                    >
                      Install community update
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-[hsl(var(--state-error))] hover:bg-[hsl(var(--surface-secondary))]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(presetKey);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </m.li>
  );
});

PresetListItem.propTypes = {
  preset: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
    thumbnailDataUrl: PropTypes.string,
    captureScope: PropTypes.string,
    shareable: PropTypes.bool,
  }).isRequired,
  isDragging: PropTypes.bool.isRequired,
  isDropTarget: PropTypes.bool.isRequired,
  editingPreset: PropTypes.string,
  editName: PropTypes.string,
  justUpdated: PropTypes.string,
  justApplied: PropTypes.string,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onStartEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onEditNameChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  onApplyToActiveProfile: PropTypes.func.isRequired,
  hasActiveProfile: PropTypes.bool.isRequired,
  hasCommunityUpdate: PropTypes.bool,
  onApplyCommunityUpdate: PropTypes.func,
  onShare: PropTypes.func,
  style: PropTypes.object,
  dataIndex: PropTypes.number,
};

PresetListItem.defaultProps = {
  hasCommunityUpdate: false,
  onApplyCommunityUpdate: null,
  onShare: null,
  justApplied: null,
};

PresetListItem.displayName = 'PresetListItem';

export default PresetListItem;
