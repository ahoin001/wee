import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const SPACE_META = {
  home: { label: 'Home', glyph: '⌂' },
  workspaces: { label: 'Work', glyph: '◫' },
  gamehub: { label: 'Games', glyph: '🎮' },
};

function getNextSpace(order, currentId, delta) {
  if (!Array.isArray(order) || order.length === 0) return currentId;
  const currentIndex = Math.max(0, order.indexOf(currentId));
  const nextIndex = (currentIndex + delta + order.length) % order.length;
  return order[nextIndex];
}

export default function SpaceRail() {
  const {
    activeSpaceId,
    railPinned,
    railVisible,
    order,
    setSpacesState,
    setUIState,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      activeSpaceId: state.spaces.activeSpaceId,
      railPinned: state.spaces.railPinned,
      railVisible: state.spaces.railVisible,
      order: state.spaces.order,
      setSpacesState: state.actions.setSpacesState,
      setUIState: state.actions.setUIState,
    }))
  );

  const [hovered, setHovered] = useState(false);

  const spaceOrder = Array.isArray(order) && order.length > 0
    ? order
    : ['home', 'workspaces', 'gamehub'];

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextSpaceId = getNextSpace(spaceOrder, activeSpaceId, delta);
      if (nextSpaceId !== activeSpaceId) {
        event.preventDefault();
        setSpacesState({ activeSpaceId: nextSpaceId, railVisible: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSpaceId, setSpacesState, spaceOrder]);

  // Temporarily force rail visibility for UX validation.
  useEffect(() => {
    if (!railVisible) {
      setSpacesState({ railVisible: true });
    }
  }, [railVisible, setSpacesState]);

  const isVisible = true;
  const railClassName = `space-rail ${isVisible ? 'space-rail--visible' : 'space-rail--hidden'}`;

  const orderedSpaces = useMemo(
    () => spaceOrder.map((id) => ({ id, ...(SPACE_META[id] || { label: id, glyph: '•' }) })),
    [spaceOrder]
  );

  return (
    <aside
      className={railClassName}
      onMouseEnter={() => {
        setHovered(true);
        if (!railVisible) {
          setSpacesState({ railVisible: true });
        }
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      aria-label="Space navigation rail"
    >
      <div className="space-rail__pill">
        {orderedSpaces.map((space) => {
          const active = space.id === activeSpaceId;
          return (
            <button
              key={space.id}
              type="button"
              className={`space-rail__item ${active ? 'space-rail__item--active' : ''}`}
              onClick={() => {
                if (space.id !== activeSpaceId || !railVisible) {
                  setSpacesState({ activeSpaceId: space.id, railVisible: true });
                }
              }}
              title={space.label}
              aria-pressed={active}
            >
              <span className="space-rail__glyph" aria-hidden>{space.glyph}</span>
              <span className="space-rail__label">{space.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="space-rail__pin"
        onClick={() => {
          const nextPinned = !railPinned;
          setSpacesState({ railPinned: nextPinned, railVisible: true });
          setUIState({ spaceRailPinned: nextPinned });
        }}
        title={railPinned ? 'Unpin Space Rail' : 'Pin Space Rail'}
      >
        {railPinned ? 'Unpin' : 'Pin'}
      </button>
    </aside>
  );
}
