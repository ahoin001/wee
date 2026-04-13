import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';

const PresetListItem = ({
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
  hasCommunityUpdate
}) => {
  return (
    <li
      className={clsx(
        'flex items-center border-b border-[hsl(var(--border-primary))] px-6 py-3 mb-2.5 transition-all duration-200',
        selectMode ? 'cursor-pointer' : isDragging ? 'cursor-grabbing opacity-50 scale-[0.98]' : 'cursor-grab',
        isSelected && 'pulse-blue rounded-[10px] bg-[hsl(var(--surface-primary))]',
        !isSelected && [
          'rounded-lg',
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
      <div className="flex flex-1 items-center">
        {!selectMode && (
          <Text 
            variant="small"
            className="mr-2 cursor-grab select-none text-[hsl(var(--text-tertiary))]"
            title="Drag to reorder"
          >
            ⋮⋮
          </Text>
        )}
        <Text 
          variant="p" 
          className="mb-0 text-left text-base font-medium text-[hsl(var(--text-primary))]"
        >
          {preset.name}
          {(preset.data?.channels || preset.data?.channelData) && (
            <span
              className="ml-2 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-medium text-white bg-[hsl(var(--wii-blue))]"
              title="Includes channel data for workspace switching"
            >
              🎯
            </span>
          )}
          {hasCommunityUpdate && (
            <span
              className="ml-2 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-semibold text-[hsl(var(--state-warning))] bg-[hsl(var(--state-warning)/0.18)]"
              title="A newer community version is available"
            >
              Update
            </span>
          )}
        </Text>
      </div>
      <div className="flex items-center justify-end gap-2.5">
        {editingPreset === preset.name ? (
          <>
            <input
              type="text"
              value={editName}
              onChange={onEditNameChange}
              onKeyDown={onKeyPress}
              className="mr-2 min-w-0 flex-1 rounded-md border-[1.5px] border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-2.5 py-1.5 text-base text-[hsl(var(--text-primary))]"
              autoFocus
            />
            <Button className="min-w-[70px] mr-2" onClick={onSaveEdit}>Save</Button>
            <Button className="min-w-[70px]" onClick={onCancelEdit}>Cancel</Button>
          </>
        ) : (
          <>
            <Button className="min-w-[70px]" onClick={e => { e.stopPropagation(); onApply(preset); }}>Apply</Button>
            <Button className="min-w-[70px]" onClick={e => { e.stopPropagation(); onUpdate(preset.name); }}>
              {justUpdated === preset.name ? 'Updated!' : 'Update'}
            </Button>
            <Button className="min-w-[70px]" onClick={e => { e.stopPropagation(); onStartEdit(preset); }}>Rename</Button>
            <Button 
              variant="danger-primary"
              size="sm"
              onClick={e => { e.stopPropagation(); onDelete(preset.name); }}
              title="Delete this preset (requires confirmation)"
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </li>
  );
};

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
  hasCommunityUpdate: PropTypes.bool,
};

export default PresetListItem;

