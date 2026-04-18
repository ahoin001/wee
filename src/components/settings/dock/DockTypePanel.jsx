import React from 'react';
import PropTypes from 'prop-types';
import { Anchor } from 'lucide-react';
import Text from '../../../ui/Text';
import { WeeChoiceTileGrid, WeeSettingsCollapsibleSection } from '../../../ui/wee';

/**
 * Classic vs Ribbon dock selection.
 */
function DockTypePanel({ classicMode, onChangeMode }) {
  return (
    <div className="flex flex-col gap-6">
      <WeeSettingsCollapsibleSection
        icon={Anchor}
        title="Dock style"
        description="Classic Wii hardware dock or modern glass ribbon — each has its own customization below."
        defaultOpen
      >
        <Text variant="desc" className="!mb-4 text-[hsl(var(--text-secondary))]">
          Pick one style. You can switch anytime; your last choice is remembered.
        </Text>
        <WeeChoiceTileGrid
          value={classicMode ? 'classic' : 'ribbon'}
          onChange={onChangeMode}
          className="!grid-cols-1 sm:!grid-cols-2"
          items={[
            {
              value: 'classic',
              title: 'Classic Wii Dock',
              subtitle: 'SD slot, pods, authentic Wii look',
            },
            {
              value: 'ribbon',
              title: 'Wii Ribbon',
              subtitle: 'Glass, glow, modern strip',
            },
          ]}
        />
      </WeeSettingsCollapsibleSection>
    </div>
  );
}

DockTypePanel.propTypes = {
  classicMode: PropTypes.bool.isRequired,
  onChangeMode: PropTypes.func.isRequired,
};

export default React.memo(DockTypePanel);
