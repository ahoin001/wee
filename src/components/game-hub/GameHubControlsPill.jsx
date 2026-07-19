/**
 * Game Hub top-right controls — Pill Morph Reveal (circle → small toggle card).
 * Same clock as space rail / side nav: WeeGlassPill + createWeeSideNavPeekVariants.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import WToggle from '../../ui/WToggle';
import Text from '../../ui/Text';
import { WeeButton, WeeGlassPill, WeeHelpLinkButton, WeePillFloorShadow } from '../../ui/wee';
import {
  createWeeSideNavPeekVariants,
  createWeeTransition,
  useWeeMotion,
} from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import GameHubHiddenGamesDialog from './GameHubHiddenGamesDialog';

const MotionDiv = m.div;

const COMPACT_SIZE = 56;
const EXPANDED_WIDTH = 288;
/** Title + 3 toggles + Hidden games row + steam link + padding (border-box via Framer width/height). */
const EXPANDED_HEIGHT = 318;

function HubControlRow({ title, description, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
      <div className="min-w-0">
        <Text
          variant="body"
          className="!m-0 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]"
        >
          {title}
        </Text>
        {description ? (
          <Text variant="caption" className="!mt-0.5 !block text-[0.62rem] leading-snug text-[hsl(var(--text-tertiary))]">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

function GameHubControlsPill({ hiddenGames = [] }) {
  const rootRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [hiddenManagerOpen, setHiddenManagerOpen] = useState(false);

  const { ui } = useConsolidatedAppStore(
    useShallow((state) => ({
      ui: state.gameHub?.ui || {},
    }))
  );
  const setGameHubState = useConsolidatedAppStore((state) => state.actions.setGameHubState);

  const { pillOpen, pillClose } = useWeeMotion();
  const { osReduced, gooey } = useMotionFeedback();
  const reducedMotion = Boolean(osReduced || !gooey?.enabled);

  const revealed = hovered || focusWithin || hiddenManagerOpen;

  const peekVariants = useMemo(() => {
    const base = createWeeSideNavPeekVariants(null, {
      compactSize: COMPACT_SIZE,
      expandedWidth: EXPANDED_WIDTH,
      expandedHeight: EXPANDED_HEIGHT,
      pillClose,
      pillOpen,
      reducedMotion,
    });
    return {
      closed: {
        ...base.closed,
        borderRadius: COMPACT_SIZE / 2,
      },
      open: {
        ...base.open,
        borderRadius: 22,
      },
    };
  }, [pillClose, pillOpen, reducedMotion]);

  const showHubBackdrop = ui.showHubBackdrop ?? false;
  const hubSteamOnlyGames = ui.hubSteamOnlyGames ?? true;
  const effectsEnabled = ui.effectsEnabled ?? true;
  const hiddenCount = Array.isArray(ui.hiddenGameIds) ? ui.hiddenGameIds.length : 0;

  const onHoverEnter = useCallback(() => setHovered(true), []);
  const onHoverLeave = useCallback(() => setHovered(false), []);

  const onFocusCapture = useCallback(() => setFocusWithin(true), []);
  const onBlurCapture = useCallback((event) => {
    const next = event.relatedTarget;
    if (rootRef.current?.contains(next)) return;
    setFocusWithin(false);
    setHovered(false);
  }, []);

  const openHiddenManager = useCallback(() => {
    setHiddenManagerOpen(true);
  }, []);

  return (
    <>
      <div
        ref={rootRef}
        className="aura-hub-controls-pill relative flex flex-col items-end"
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
      >
        <div className="relative flex items-center justify-center">
          <WeePillFloorShadow expanded={revealed} reducedMotion={reducedMotion} />
          <WeeGlassPill
            motion
            initial={false}
            animate={revealed ? 'open' : 'closed'}
            variants={peekVariants}
            onMouseEnter={onHoverEnter}
            onMouseLeave={onHoverLeave}
            className="aura-hub-controls-pill__surface relative z-10 overflow-hidden"
            role="toolbar"
            aria-label="Game Hub controls"
            aria-expanded={revealed}
            tabIndex={0}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!revealed ? (
                <MotionDiv
                  key="compact"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: reducedMotion
                      ? { duration: 0.12 }
                      : { delay: 0.12, ...createWeeTransition('pillOpen') },
                  }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.1 } }}
                  className="absolute inset-0 flex items-center justify-center text-[hsl(var(--text-primary))]"
                >
                  <SlidersHorizontal size={22} strokeWidth={2.25} aria-hidden />
                </MotionDiv>
              ) : (
                <MotionDiv
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="absolute inset-0 flex flex-col gap-2.5 overflow-hidden px-3.5 py-3"
                >
                  <Text
                    variant="body"
                    className="!m-0 shrink-0 text-[0.72rem] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-secondary))]"
                  >
                    Hub controls
                  </Text>

                  <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5">
                    <HubControlRow title="Backdrop" description="Art over wallpaper">
                      <WToggle
                        checked={showHubBackdrop}
                        onChange={(checked) => setGameHubState({ ui: { showHubBackdrop: checked } })}
                        disableLabelClick
                        aria-label="Show hub backdrop"
                      />
                    </HubControlRow>

                    <HubControlRow title="Steam only" description="Hide non-Steam games">
                      <WToggle
                        checked={hubSteamOnlyGames}
                        onChange={(checked) => setGameHubState({ ui: { hubSteamOnlyGames: checked } })}
                        disableLabelClick
                        aria-label="Only Steam games"
                        title="Non-Steam games can still be opened, but art may not be found."
                      />
                    </HubControlRow>

                    <HubControlRow title="Effects" description="Motion & lift">
                      <WToggle
                        checked={effectsEnabled}
                        onChange={(checked) => setGameHubState({ ui: { effectsEnabled: checked } })}
                        disableLabelClick
                        aria-label="Enhanced effects and animations"
                      />
                    </HubControlRow>

                    <HubControlRow
                      title="Hidden games"
                      description={hiddenCount === 1 ? '1 title hidden' : `${hiddenCount} titles hidden`}
                    >
                      <WeeButton
                        type="button"
                        variant="secondary"
                        className="!px-2.5 !py-1 !text-[10px]"
                        onClick={openHiddenManager}
                        aria-label={`Manage hidden games (${hiddenCount})`}
                      >
                        Manage
                      </WeeButton>
                    </HubControlRow>
                  </div>

                  <WeeHelpLinkButton
                    type="button"
                    className="!mt-0 shrink-0 self-start text-left text-[0.65rem]"
                    onClick={() =>
                      openSettingsToTab(SETTINGS_TAB_ID.API_INTEGRATIONS, {
                        integrationsSubTab: 'steam',
                      })
                    }
                  >
                    Steam account settings
                  </WeeHelpLinkButton>
                </MotionDiv>
              )}
            </AnimatePresence>
          </WeeGlassPill>
        </div>
      </div>

      <GameHubHiddenGamesDialog
        open={hiddenManagerOpen}
        onOpenChange={setHiddenManagerOpen}
        hiddenGames={hiddenGames}
      />
    </>
  );
}

GameHubControlsPill.propTypes = {
  hiddenGames: PropTypes.arrayOf(PropTypes.object),
};

export default React.memo(GameHubControlsPill);
