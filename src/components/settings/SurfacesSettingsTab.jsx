/**
 * Surfaces — space & page scoped wallpaper + ribbon look.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useWeeMotion } from '../../design/weeMotion';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  getSecondaryChannelSpaceData,
} from '../../utils/channelSpaces';
import { resolveLayout } from '../../utils/channelLayoutSystem';
import {
  syncActiveSpaceAppearanceCapture,
  captureSpaceAppearanceFromState,
} from '../../utils/appearance/spaceAppearance';
import {
  mergeSpaceScopedRibbonFields,
  normalizeRibbonByPage,
  normalizeRibbonScope,
  pickRibbonLook,
} from '../../utils/appearance/resolveEffectiveRibbonLook';
import { wallpaperEntryUrlKey } from '../../utils/wallpaperShape';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsWeeSection from './SettingsWeeSection';
import { WeeButton, WeeHelpLinkButton, WeeModalFieldCard, WeeSegmentedControl } from '../../ui/wee';
import SpaceWallpaperAppearanceSection from './wallpaper/SpaceWallpaperAppearanceSection';
import { SPACE_WALLPAPER_OPTIONS } from './wallpaper/wallpaperSettingsConstants';
import './settings-wee-panels.css';

function SurfacesSettingsTab() {
  const reduceMotion = useReducedMotion();
  const { tabTransition } = useWeeMotion();

  const {
    wallpaper,
    appearanceBySpace,
    activeSpaceId,
    channels,
    ribbon,
    mediaHubEnabled,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      wallpaper: state.wallpaper,
      appearanceBySpace: state.appearanceBySpace,
      activeSpaceId: state.spaces.activeSpaceId,
      channels: state.channels,
      ribbon: state.ribbon,
      mediaHubEnabled: state.spaces.mediaHubEnabled === true,
    }))
  );
  const { setWallpaperState, setAppearanceBySpaceState, setRibbonState, setChannelsState } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        setWallpaperState: state.actions.setWallpaperState,
        setAppearanceBySpaceState: state.actions.setAppearanceBySpaceState,
        setRibbonState: state.actions.setRibbonState,
        setChannelsState: state.actions.setChannelsState,
      }))
    );

  const [selectedSpaceId, setSelectedSpaceId] = useState(activeSpaceId || 'home');

  const selectedSpaceAppearance = appearanceBySpace?.[selectedSpaceId]?.wallpaper || {};
  const selectedSpaceRibbon = appearanceBySpace?.[selectedSpaceId]?.ribbon || {};
  const selectedSpaceUsesGlobalWallpaper = selectedSpaceAppearance.useGlobalWallpaper !== false;
  const selectedSpaceWallpaperUrl =
    typeof selectedSpaceAppearance.spaceWallpaperUrl === 'string'
      ? selectedSpaceAppearance.spaceWallpaperUrl
      : null;
  const selectedWallpaperScope =
    selectedSpaceAppearance.wallpaperScope === 'perPage' ? 'perPage' : 'space';
  const supportsPerPage =
    selectedSpaceId === 'home' || selectedSpaceId === 'workspaces';

  const boardSpaceData =
    selectedSpaceId === 'workspaces'
      ? getSecondaryChannelSpaceData(channels)
      : channels?.dataBySpace?.home;
  const selectedBoardCurrentPage = boardSpaceData?.navigation?.currentPage ?? 0;
  const boardLayout = resolveLayout(boardSpaceData || {});
  const totalPages = Math.max(1, Number(boardLayout?.totalPages) || 1);

  const selectedPageWallpaperUrl = (() => {
    const byPage = selectedSpaceAppearance.wallpaperByPage;
    if (!byPage || typeof byPage !== 'object') return null;
    const url = byPage[selectedBoardCurrentPage] ?? byPage[String(selectedBoardCurrentPage)];
    return typeof url === 'string' && url.length > 0 ? url : null;
  })();

  const pageMapEntries = useMemo(() => {
    const byPage = selectedSpaceAppearance.wallpaperByPage || {};
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const url = byPage[pageIndex] ?? byPage[String(pageIndex)];
      return {
        pageIndex,
        url: typeof url === 'string' && url.length > 0 ? url : null,
      };
    });
  }, [selectedSpaceAppearance.wallpaperByPage, totalPages]);

  const workspaceBrightness = wallpaper.workspaceBrightness ?? 1;
  const workspaceSaturate = wallpaper.workspaceSaturate ?? 1;
  const gameHubBrightness = wallpaper.gameHubBrightness ?? 0.78;
  const gameHubSaturate = wallpaper.gameHubSaturate ?? 1;
  const selectedSpaceBrightness =
    typeof selectedSpaceAppearance.spaceBrightness === 'number'
      ? selectedSpaceAppearance.spaceBrightness
      : selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub'
        ? gameHubBrightness
        : workspaceBrightness;
  const selectedSpaceBlur =
    typeof selectedSpaceAppearance.spaceBlur === 'number'
      ? selectedSpaceAppearance.spaceBlur
      : wallpaper.blur ?? 0;
  const selectedSpaceSaturate =
    typeof selectedSpaceAppearance.spaceSaturate === 'number'
      ? selectedSpaceAppearance.spaceSaturate
      : selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub'
        ? gameHubSaturate
        : workspaceSaturate;

  const selectedSpaceLabel =
    SPACE_WALLPAPER_OPTIONS.find((space) => space.id === selectedSpaceId)?.label || 'Space';

  const effectiveActiveWallpaperUrl = (() => {
    if (selectedWallpaperScope === 'perPage' && selectedPageWallpaperUrl) {
      return selectedPageWallpaperUrl;
    }
    if (selectedSpaceId === 'home') {
      return wallpaperEntryUrlKey(wallpaper.current) || null;
    }
    return selectedSpaceUsesGlobalWallpaper
      ? wallpaperEntryUrlKey(wallpaper.current) || null
      : selectedSpaceWallpaperUrl;
  })();

  const ribbonScope = normalizeRibbonScope(selectedSpaceRibbon.ribbonScope);
  const ribbonByPage = normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage);
  const pageRibbonLook =
    ribbonByPage[String(selectedBoardCurrentPage)] ||
    ribbonByPage[selectedBoardCurrentPage] ||
    null;

  const updateSpaceWallpaperAppearance = useCallback(
    (spaceId, patch) => {
      const state = useConsolidatedAppStore.getState();
      const currentSnapshot =
        state.appearanceBySpace?.[spaceId] ?? captureSpaceAppearanceFromState(state);
      setAppearanceBySpaceState({
        [spaceId]: {
          ...currentSnapshot,
          wallpaper: {
            ...(currentSnapshot.wallpaper || {}),
            ...patch,
          },
        },
      });
    },
    [setAppearanceBySpaceState]
  );

  const updateSpaceRibbonAppearance = useCallback(
    (spaceId, patch) => {
      const state = useConsolidatedAppStore.getState();
      const currentSnapshot =
        state.appearanceBySpace?.[spaceId] ?? captureSpaceAppearanceFromState(state);
      const nextRibbon = mergeSpaceScopedRibbonFields(
        { ...(currentSnapshot.ribbon || {}), ...patch },
        { ...(currentSnapshot.ribbon || {}), ...patch }
      );
      setAppearanceBySpaceState({
        [spaceId]: {
          ...currentSnapshot,
          ribbon: nextRibbon,
        },
      });
      if (spaceId === state.spaces?.activeSpaceId) {
        setRibbonState(pickRibbonLook(nextRibbon));
        syncActiveSpaceAppearanceCapture({
          getState: () => useConsolidatedAppStore.getState(),
          setAppearanceBySpaceState,
        });
      }
    },
    [setAppearanceBySpaceState, setRibbonState]
  );

  const handleSelectBoardPage = useCallback(
    (pageIndex) => {
      const page = Math.max(0, Math.floor(Number(pageIndex) || 0));
      if (selectedSpaceId === 'workspaces') {
        const secondaryId = channels?.activeSecondaryChannelProfileId;
        const profiles = channels?.secondaryChannelProfiles || {};
        if (!secondaryId || !profiles[secondaryId]) return;
        const space = profiles[secondaryId].channelSpace || {};
        setChannelsState({
          secondaryChannelProfiles: {
            ...profiles,
            [secondaryId]: {
              ...profiles[secondaryId],
              channelSpace: {
                ...space,
                navigation: {
                  ...(space.navigation || {}),
                  currentPage: page,
                },
              },
            },
          },
        });
        return;
      }
      if (selectedSpaceId === 'home') {
        const home = channels?.dataBySpace?.home || {};
        setChannelsState({
          dataBySpace: {
            ...(channels?.dataBySpace || {}),
            home: {
              ...home,
              navigation: {
                ...(home.navigation || {}),
                currentPage: page,
              },
            },
          },
        });
      }
    },
    [channels, selectedSpaceId, setChannelsState]
  );

  const handleApplyWallpaperToCurrentPage = useCallback(
    (url) => {
      const nextUrl = typeof url === 'string' && url.length > 0 ? url : null;
      if (!nextUrl) return;
      const prev = selectedSpaceAppearance.wallpaperByPage || {};
      updateSpaceWallpaperAppearance(selectedSpaceId, {
        wallpaperScope: 'perPage',
        wallpaperByPage: {
          ...prev,
          [selectedBoardCurrentPage]: nextUrl,
          [String(selectedBoardCurrentPage)]: nextUrl,
        },
      });
    },
    [
      selectedBoardCurrentPage,
      selectedSpaceAppearance.wallpaperByPage,
      selectedSpaceId,
      updateSpaceWallpaperAppearance,
    ]
  );

  const handleClearCurrentPageWallpaper = useCallback(() => {
    const prev = { ...(selectedSpaceAppearance.wallpaperByPage || {}) };
    delete prev[selectedBoardCurrentPage];
    delete prev[String(selectedBoardCurrentPage)];
    updateSpaceWallpaperAppearance(selectedSpaceId, { wallpaperByPage: prev });
  }, [
    selectedBoardCurrentPage,
    selectedSpaceAppearance.wallpaperByPage,
    selectedSpaceId,
    updateSpaceWallpaperAppearance,
  ]);

  const handleApplyRibbonToCurrentPage = useCallback(() => {
    const look = pickRibbonLook(ribbon);
    const prev = normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage);
    updateSpaceRibbonAppearance(selectedSpaceId, {
      ribbonScope: 'perPage',
      ribbonByPage: {
        ...prev,
        [String(selectedBoardCurrentPage)]: look,
      },
    });
  }, [
    ribbon,
    selectedBoardCurrentPage,
    selectedSpaceId,
    selectedSpaceRibbon.ribbonByPage,
    updateSpaceRibbonAppearance,
  ]);

  const handleClearCurrentPageRibbon = useCallback(() => {
    const prev = { ...normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage) };
    delete prev[String(selectedBoardCurrentPage)];
    delete prev[selectedBoardCurrentPage];
    updateSpaceRibbonAppearance(selectedSpaceId, { ribbonByPage: prev });
  }, [
    selectedBoardCurrentPage,
    selectedSpaceId,
    selectedSpaceRibbon.ribbonByPage,
    updateSpaceRibbonAppearance,
  ]);

  const handleSaveRibbonForSpace = useCallback(() => {
    updateSpaceRibbonAppearance(selectedSpaceId, {
      ...pickRibbonLook(ribbon),
      ribbonScope,
      ribbonByPage: normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage),
    });
  }, [ribbon, ribbonScope, selectedSpaceId, selectedSpaceRibbon.ribbonByPage, updateSpaceRibbonAppearance]);

  const spaceOptions = SPACE_WALLPAPER_OPTIONS.filter(
    (space) => mediaHubEnabled || space.id !== 'mediahub'
  );

  return (
    <div className="surface-stack mx-auto flex max-w-4xl flex-col space-y-8 pb-12">
      <SettingsTabPageHeader
        title="Surfaces"
        subtitle="Wallpaper and ribbon looks by space and channel page"
      />

      <SettingsWeeSection eyebrow="Space">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-4 md:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {spaceOptions.map((space) => (
              <WeeButton
                key={space.id}
                type="button"
                size="sm"
                variant={selectedSpaceId === space.id ? 'primary' : 'secondary'}
                onClick={() => setSelectedSpaceId(space.id)}
              >
                {space.label}
              </WeeButton>
            ))}
          </div>
          <Text variant="desc" className="!m-0">
            Configuring <strong>{selectedSpaceLabel}</strong>. Pick wallpapers in the Wallpaper tab,
            then scope them here.
          </Text>
          <div className="mt-3">
            <WeeHelpLinkButton onClick={() => openSettingsToTab(SETTINGS_TAB_ID.WALLPAPER)}>
              Open Wallpaper library
            </WeeHelpLinkButton>
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SpaceWallpaperAppearanceSection
        wallpaperOpacity={wallpaper.opacity ?? 1}
        handleWallpaperOpacityChange={(value) => setWallpaperState({ opacity: value })}
        selectedSpaceId={selectedSpaceId}
        setSelectedSpaceId={setSelectedSpaceId}
        reduceMotion={reduceMotion}
        tabTransition={tabTransition}
        selectedSpaceLabel={selectedSpaceLabel}
        selectedSpaceUsesGlobalWallpaper={selectedSpaceUsesGlobalWallpaper}
        handleSelectedSpaceUseGlobalWallpaperChange={(next) =>
          updateSpaceWallpaperAppearance(selectedSpaceId, { useGlobalWallpaper: next })
        }
        selectedWallpaper={null}
        handleSelectedSpaceWallpaperOverride={(url) =>
          updateSpaceWallpaperAppearance(selectedSpaceId, {
            useGlobalWallpaper: false,
            spaceWallpaperUrl: url || null,
          })
        }
        selectedSpaceWallpaperEntry={null}
        selectedSpaceWallpaperUrl={selectedSpaceWallpaperUrl}
        effectiveActiveWallpaperUrl={effectiveActiveWallpaperUrl}
        selectedSpaceBlur={selectedSpaceBlur}
        handleSelectedSpaceBlurChange={(value) => {
          updateSpaceWallpaperAppearance(selectedSpaceId, { spaceBlur: value });
          if (selectedSpaceId === 'home') setWallpaperState({ blur: value });
        }}
        selectedSpaceBrightness={selectedSpaceBrightness}
        handleSelectedSpaceBrightnessChange={(value) => {
          updateSpaceWallpaperAppearance(selectedSpaceId, { spaceBrightness: value });
          if (selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub') {
            setWallpaperState({ gameHubBrightness: value });
          } else {
            setWallpaperState({ workspaceBrightness: value });
          }
        }}
        selectedSpaceSaturate={selectedSpaceSaturate}
        handleSelectedSpaceSaturateChange={(value) => {
          updateSpaceWallpaperAppearance(selectedSpaceId, { spaceSaturate: value });
          if (selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub') {
            setWallpaperState({ gameHubSaturate: value });
          } else {
            setWallpaperState({ workspaceSaturate: value });
          }
        }}
        handleResetSelectedSpaceAppearance={() => {
          const isHub = selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub';
          updateSpaceWallpaperAppearance(selectedSpaceId, {
            useGlobalWallpaper: true,
            spaceWallpaperUrl: null,
            wallpaperScope: 'space',
            wallpaperByPage: {},
            spaceBlur: 0,
            spaceBrightness: isHub ? 0.78 : 1,
            spaceSaturate: 1,
          });
        }}
        showSpaceSelector={false}
        showGlobalOpacity={selectedSpaceId === 'home'}
        showWallpaperSourceSection={selectedSpaceId !== 'home'}
        supportsPerPageWallpaper={supportsPerPage}
        selectedWallpaperScope={selectedWallpaperScope}
        onWallpaperScopeChange={(scope) =>
          updateSpaceWallpaperAppearance(selectedSpaceId, { wallpaperScope: scope })
        }
        selectedBoardCurrentPage={selectedBoardCurrentPage}
        selectedPageWallpaperUrl={selectedPageWallpaperUrl}
        onApplyWallpaperToCurrentPage={() =>
          handleApplyWallpaperToCurrentPage(effectiveActiveWallpaperUrl)
        }
        onClearCurrentPageWallpaper={handleClearCurrentPageWallpaper}
        canApplyPageWallpaper={Boolean(effectiveActiveWallpaperUrl)}
        pageMapEntries={pageMapEntries}
        onSelectBoardPage={handleSelectBoardPage}
      />

      <SettingsWeeSection eyebrow="Ribbon look">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-1 playful-hero-text">
            Ribbon by space &amp; page
          </Text>
          <Text variant="desc" className="mb-4">
            Color and glass for the Wii ribbon. Buttons stay global — tune chrome in Dock.
          </Text>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className="h-8 w-8 rounded-full border border-[hsl(var(--border-primary)/0.5)] shadow-[var(--shadow-sm)]"
              style={{ background: ribbon?.ribbonColor || 'hsl(var(--primary))' }}
              title="Current ribbon color"
              aria-hidden
            />
            <span
              className="h-8 w-8 rounded-full border border-[hsl(var(--border-primary)/0.5)] shadow-[var(--shadow-sm)]"
              style={{ background: ribbon?.ribbonGlowColor || 'hsl(var(--primary))' }}
              title="Current ribbon glow"
              aria-hidden
            />
            <WeeHelpLinkButton onClick={() => openSettingsToTab(SETTINGS_TAB_ID.DOCK)}>
              Edit ribbon colors in Dock
            </WeeHelpLinkButton>
          </div>

          {supportsPerPage ? (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                Ribbon scope
              </span>
              <WeeSegmentedControl
                size="sm"
                ariaLabel="Ribbon look scope"
                layoutId="surfacesRibbonScope"
                value={ribbonScope}
                onChange={(next) =>
                  updateSpaceRibbonAppearance(selectedSpaceId, { ribbonScope: next })
                }
                options={[
                  { value: 'space', label: 'Space', title: 'One ribbon look for this space' },
                  {
                    value: 'perPage',
                    label: 'Per page',
                    title: 'Different ribbon look per Home/Focus page',
                  },
                ]}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <WeeButton type="button" variant="primary" size="sm" onClick={handleSaveRibbonForSpace}>
              Save current look for {selectedSpaceLabel}
            </WeeButton>
            {supportsPerPage && ribbonScope === 'perPage' ? (
              <>
                <WeeButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyRibbonToCurrentPage}
                >
                  Apply to page {selectedBoardCurrentPage + 1}
                </WeeButton>
                <WeeButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClearCurrentPageRibbon}
                >
                  Clear page look
                </WeeButton>
              </>
            ) : null}
          </div>
          <p className="settings-wee-help !mb-0 mt-3">
            {supportsPerPage && ribbonScope === 'perPage'
              ? pageRibbonLook
                ? `Page ${selectedBoardCurrentPage + 1} has a custom ribbon look.`
                : `Page ${selectedBoardCurrentPage + 1} uses the space ribbon look until you apply one.`
              : 'Space-level ribbon look. Page flips keep the same colors.'}
          </p>
        </WeeModalFieldCard>
      </SettingsWeeSection>
    </div>
  );
}

export default React.memo(SurfacesSettingsTab);
