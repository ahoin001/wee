import React from 'react';
import Card from '../../../ui/Card';
import { PresetListItem } from '../../app-library';

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
  }) => (
    <Card
      className="mb-[18px]"
      title="Saved Presets"
      separator
      desc="Drag presets by the ⋮⋮ handle to reorder them. Apply presets to change your appearance settings."
    >
      <ul className="list-none p-0 m-0 mb-0">
        {presets
          .filter((preset) => preset.name !== excludeName)
          .map((preset) => {
            const isDragging = draggingPreset === preset.name;
            const isDropTarget = dropTarget === preset.name;

            return (
              <PresetListItem
                key={preset.name}
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
                hasCommunityUpdate={Boolean(communityUpdateMap[preset.name]?.hasUpdate)}
              />
            );
          })}
      </ul>
    </Card>
  )
);

PresetsSavedListCard.displayName = 'PresetsSavedListCard';

export default PresetsSavedListCard;
