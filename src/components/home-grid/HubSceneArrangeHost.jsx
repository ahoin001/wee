import React from 'react';
import { createPortal } from 'react-dom';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import useHomeBoardArrange from '../../hooks/useHomeBoardArrange';
import HomeBoardArrangeBar from './HomeBoardArrangeBar';

const HUB_SPACE_IDS = new Set(['gamehub', 'mediahub']);

/**
 * Scene-only edit pill for Game Hub and Media Hub.
 * Home and Second Home keep their own bar inside the channel board.
 */
function HubSceneArrangeHost() {
  const activeSpaceId = useConsolidatedAppStore((state) => state.spaces?.activeSpaceId);
  const { arrangeMode, exitArrange } = useHomeBoardArrange();
  const sceneOnly = HUB_SPACE_IDS.has(activeSpaceId);

  if (!sceneOnly || typeof document === 'undefined') return null;

  return createPortal(
    <HomeBoardArrangeBar
      arrangeMode={arrangeMode}
      sceneOnly
      spaceId={activeSpaceId}
      punchMode={false}
      onTogglePunch={() => {}}
      onDone={exitArrange}
    />,
    document.body
  );
}

export default React.memo(HubSceneArrangeHost);
