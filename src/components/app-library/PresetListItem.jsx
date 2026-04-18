import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import { WeeEmphasisText } from '../../ui/wee';

const PresetListItem = React.forwardRef(function PresetListItem(
  {
    preset,
    isDragging,
    isDropTarget,
    isSelected,
    selectMode,
    editingPreset,
    editName,
    justUpdated,
    onDragStart,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onDragEnd,
    onToggleSelect,
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
    hasCommunityUpdate,
    style,
    dataIndex,
  },
  ref
) {
  return (
    <li
      ref={ref}
      data-index={dataIndex}
      style={style}
      className={clsx(
        'flex flex-col gap-3 border-b border-[hsl(var(--border-primary))] px-4 py-4 transition-all duration-200 last:mb-0 md:px-5',
        selectMode ? 'cursor-pointer' : isDragging ? 'cursor-grabbing opacity-50 scale-[0.98]' : 'cursor-grab',
        isSelected && 'pulse-blue rounded-[10px] bg-[hsl(var(--surface-primary))]',
        !isSelected && [
          'mb-3 rounded-xl',
          isDropTarget
            ? 'scale-[1.02] border-2 border-[hsl(var(--wii-blue))] bg-[hsl(var(--surface-secondary))]'
            : 'border-[1.5px] border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] shadow-[var(--shadow-sm)]',
        ],
      )}
      draggable={!selectMode}
      onDragStart={(e) => onDragStart(e, preset.name)}
      onDragOver={(e) => onDragOver(e, preset.name)}
      onDragEnter={(e) => onDragEnter(e, preset.name)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, preset.name)}
      onDragEnd={onDragEnd}
      onClick={selectMode ? () => onToggleSelect(preset.name) : undefined}
    >
      <div className="flex min-w-0 items-start gap-3">
        {!selectMode && (
          <Text
            variant="small"
            className="mt-0.5 shrink-0 cursor-grab select-none text-[hsl(var(--text-tertiary))]"
            title="Drag to reorder"
          >
            ⋮⋮
          </Text>
        )}
        <div className="min-w-0 flex-1">
          {editingPreset === preset.name ? (
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
              {hasCommunityUpdate && (
                <span
                  className="inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--state-warning))] bg-[hsl(var(--state-warning)/0.18)]"
                  title="A newer community version is available"
                >
                  Update
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={clsx(
          'flex flex-wrap items-center gap-2 sm:gap-3',
          !selectMode && 'pl-7 sm:pl-0 sm:justify-end',
          selectMode && 'justify-end'
        )}
      >
        {editingPreset === preset.name ? (
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
            <Button
              className="min-w-[4.5rem] shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onApply(preset);
              }}
            >
              Apply
            </Button>
            <Button
              className="max-w-full min-w-0 shrink sm:max-w-[min(100%,14rem)]"
              variant="secondary"
              disabled={!hasActiveWorkspace}
              title={
                hasActiveWorkspace
                  ? 'Apply preset look and save into active workspace'
                  : 'No active workspace set'
              }
              onClick={(e) => {
                e.stopPropagation();
                onApplyToActiveWorkspace(preset);
              }}
            >
              <span className="whitespace-normal text-center leading-tight sm:whitespace-nowrap">
                Apply to workspace
              </span>
            </Button>
            <Button
              className="min-w-[4.5rem] shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(preset.name);
              }}
            >
              {justUpdated === preset.name ? 'Updated!' : 'Update'}
            </Button>
            <Button
              className="min-w-[4.5rem] shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(preset);
              }}
            >
              Rename
            </Button>
            <Button
              variant="danger-primary"
              size="sm"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(preset.name);
              }}
              title="Delete this preset (requires confirmation)"
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </li>
  );
});

PresetListItem.propTypes = {
  preset: PropTypes.shape({
    name: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  }).isRequired,
  isDragging: PropTypes.bool.isRequired,
  isDropTarget: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  selectMode: PropTypes.bool.isRequired,
  editingPreset: PropTypes.string,
  editName: PropTypes.string,
  justUpdated: PropTypes.string,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onStartEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onEditNameChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  onApplyToActiveWorkspace: PropTypes.func.isRequired,
  hasActiveWorkspace: PropTypes.bool.isRequired,
  hasCommunityUpdate: PropTypes.bool,
  style: PropTypes.object,
  dataIndex: PropTypes.number,
};

PresetListItem.displayName = 'PresetListItem';

export default PresetListItem;
