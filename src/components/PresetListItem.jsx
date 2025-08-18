import React from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/WButton';
import Text from '../ui/Text';

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
  onKeyPress
}) => {
  return (
    <li
      className={isSelected ? 'pulse-blue' : ''}
      draggable={!selectMode}
      onDragStart={(e) => onDragStart(e, preset.name)}
      onDragOver={(e) => onDragOver(e, preset.name)}
      onDragEnter={(e) => onDragEnter(e, preset.name)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, preset.name)}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10,
        padding: '12px 24px',
        borderBottom: '1px solid hsl(var(--border-primary))',
        cursor: selectMode ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
        background: isSelected 
          ? 'hsl(var(--surface-primary))' 
          : (isDropTarget ? 'hsl(var(--surface-secondary))' : 'hsl(var(--surface-primary))'),
        borderRadius: isSelected ? 10 : 8,
        boxShadow: !selectMode || !isSelected
          ? 'var(--shadow-sm)'
          : undefined,
        border: !selectMode || !isSelected
          ? (isDropTarget ? '2px solid hsl(var(--wii-blue))' : '1.5px solid hsl(var(--border-primary))')
          : undefined,
        transition: 'background 0.2s, box-shadow 0.2s, border 0.2s, transform 0.2s',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.98)' : (isDropTarget ? 'scale(1.02)' : 'scale(1)'),
      }}
      onClick={selectMode ? () => onToggleSelect(preset.name) : undefined}
    >
      {/* Title left, buttons right */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {!selectMode && (
          <Text 
            variant="small"
            style={{ 
              marginRight: 8, 
              cursor: 'grab',
              userSelect: 'none',
              color: 'hsl(var(--text-tertiary))'
            }}
            title="Drag to reorder"
          >
            ⋮⋮
          </Text>
        )}
        <Text 
          variant="p" 
          style={{ 
            fontWeight: 500, 
            textAlign: 'left', 
            fontSize: 16,
            marginBottom: 0, 
            color: 'hsl(var(--text-primary))'
          }}
        >
          {preset.name}
          {/* Show workspace indicator if preset includes channel data */}
          {(preset.data?.channels || preset.data?.channelData) && (
            <span style={{
              marginLeft: 8,
              padding: '2px 6px',
              background: 'hsl(var(--primary))',
              color: 'white',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 500,
              verticalAlign: 'middle'
            }} title="Includes channel data for workspace switching">
              🎯
            </span>
          )}
        </Text>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
        {editingPreset === preset.name ? (
          <>
            <input
              type="text"
              value={editName}
              onChange={onEditNameChange}
              onKeyDown={onKeyPress}
              style={{ 
                fontSize: 16, 
                padding: '6px 10px', 
                borderRadius: 6, 
                border: '1.5px solid hsl(var(--border-primary))', 
                marginRight: 8, 
                flex: 1, 
                background: 'hsl(var(--surface-primary))', 
                color: 'hsl(var(--text-primary))' 
              }}
              autoFocus
            />
            <Button style={{ minWidth: 70, marginRight: 8 }} onClick={onSaveEdit}>Save</Button>
            <Button style={{ minWidth: 70 }} onClick={onCancelEdit}>Cancel</Button>
          </>
        ) : (
          <>
            <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); onApply(preset); }}>Apply</Button>
            <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); onUpdate(preset.name); }}>
              {justUpdated === preset.name ? 'Updated!' : 'Update'}
            </Button>
            <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); onStartEdit(preset); }}>Rename</Button>
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
};

export default PresetListItem; 