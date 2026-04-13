import React from 'react';
import PropTypes from 'prop-types';

function ChannelModalTabNav({ activeTab, onTabChange }) {
  return (
    <div className="flex">
      <button
        type="button"
        onClick={() => onTabChange('setup')}
        className={`px-4 py-2 font-medium text-sm transition-colors cursor-pointer border-b-2 border-transparent bg-transparent ${
          activeTab === 'setup'
            ? 'text-[hsl(var(--wii-blue))] border-[hsl(var(--wii-blue))]'
            : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
        }`}
      >
        Channel Setup
      </button>
      <button
        type="button"
        onClick={() => onTabChange('behavior')}
        className={`px-4 py-2 font-medium text-sm transition-colors cursor-pointer border-b-2 border-transparent bg-transparent ${
          activeTab === 'behavior'
            ? 'text-[hsl(var(--wii-blue))] border-[hsl(var(--wii-blue))]'
            : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
        }`}
      >
        Channel Behavior
      </button>
    </div>
  );
}

ChannelModalTabNav.propTypes = {
  activeTab: PropTypes.oneOf(['setup', 'behavior']).isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default React.memo(ChannelModalTabNav);
