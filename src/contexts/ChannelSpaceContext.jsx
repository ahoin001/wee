import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const ChannelSpaceContext = createContext('home');

export function ChannelSpaceProvider({ channelSpaceKey, children }) {
  return (
    <ChannelSpaceContext.Provider value={channelSpaceKey}>
      {children}
    </ChannelSpaceContext.Provider>
  );
}

ChannelSpaceProvider.propTypes = {
  channelSpaceKey: PropTypes.oneOf(['home', 'workspaces']).isRequired,
  children: PropTypes.node,
};

export function useChannelSpaceKey() {
  return useContext(ChannelSpaceContext);
}
