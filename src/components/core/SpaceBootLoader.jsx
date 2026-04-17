import React from 'react';
import './SpaceBootLoader.css';

function SpaceBootLoader() {
  return (
    <div className="space-boot-loader" aria-live="polite" aria-busy="true">
      <div className="space-boot-loader__halo" />
      <div className="space-boot-loader__ring" />
      <div className="space-boot-loader__core">
        <span className="space-boot-loader__dot space-boot-loader__dot--a" />
        <span className="space-boot-loader__dot space-boot-loader__dot--b" />
        <span className="space-boot-loader__dot space-boot-loader__dot--c" />
      </div>
      <div className="space-boot-loader__sparkles" aria-hidden>
        <span className="space-boot-loader__sparkle space-boot-loader__sparkle--a" />
        <span className="space-boot-loader__sparkle space-boot-loader__sparkle--b" />
        <span className="space-boot-loader__sparkle space-boot-loader__sparkle--c" />
      </div>
    </div>
  );
}

export default React.memo(SpaceBootLoader);
