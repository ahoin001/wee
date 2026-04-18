import React, { Profiler } from 'react';
import PropTypes from 'prop-types';

const DEV = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

function onRenderCallback(id, phase, actualDuration) {
  if (!DEV || actualDuration < 12) return;
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[Profiler] ${id} ${phase} ${actualDuration.toFixed(1)}ms`);
  }
}

/**
 * Dev-only React Profiler — logs commits slower than ~12ms to help spot heavy settings tabs / lists.
 */
function DevReactProfiler({ id, children }) {
  if (!DEV) return children;
  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}

DevReactProfiler.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default DevReactProfiler;
