import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import AuraGameCard from './AuraGameCard';
import GameCardContextMenu from './GameCardContextMenu';
import CollectionShelfContextMenu from './CollectionShelfContextMenu';
import GameHubManageCollectionsDialog from './GameHubManageCollectionsDialog';
import GameHubRenameCollectionDialog from './GameHubRenameCollectionDialog';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import {
  COLLECTION_EXPANSION_MS,
  COLLECTION_FLY_PHASE_MS,
  SHELF_PHYSICS_EASE,
  flyOutBlockingMs,
  runFlyInAnimations,
  runFlyOutAnimations,
} from './collectionFlyAnimations';
import { maybeScrollHubExpansionIntoView, readHubDockInsetPx, readHubScrollTopReservePx } from './hubScrollUtils';

/** One frame — hub-design uses rAF before measuring slot rects. */
function nextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(resolve);
  });
}

function preloadGameArt(games) {
  games.forEach((g) => {
    if (g?.imageUrl) {
      const img = new Image();
      img.src = g.imageUrl;
    }
  });
}

function waitMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function shouldIgnoreCollectionCloseTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest('.modal-overlay')) return true;
  if (target.closest('.modal-content')) return true;
  if (target.closest('.aura-hub-modal-overlay')) return true;
  if (target.closest('[role="dialog"]')) return true;
  if (target.closest('[role="alertdialog"]')) return true;
  if (target.closest('[role="menu"]')) return true;
  if (target.closest('[data-radix-popper-content-wrapper]')) return true;
  if (target.closest('.dock-container')) return true;
  if (target.closest('.space-rail')) return true;
  return false;
}

export default function AuraCollectionsSection({
  collections,
  activeCollection,
  activeCollectionId,
  onSetCollection,
  onSelectGame,
  onLaunchGame,
  onHeroPreview,
  effectsEnabled = true,
  shelfOrderMode = 'custom',
  onShelfOrderModeChange,
  hubCollectionGamesSort = 'default',
  onHubCollectionGamesSortChange,
  /** When true: shelf fly, collapse, or grid height transition is in progress — parent may freeze scroll-linked hero morph. */
  onCollectionChromeBusyChange,
  /** Hub `main` scroll root — used to nudge scroll when an opened shelf is mostly off-screen. */
  hubScrollContainerRef,
}) {
  const sectionRef = useRef(null);
  const expansionRef = useRef(null);
  const stackButtonRefs = useRef({});
  const flyGeneration = useRef(0);
  /** AbortController for the in-flight open fly — cancelled on close / collection switch. */
  const flyAbortRef = useRef(null);
  /** Synchronous guard — stack clicks can land before React state would reflect an in-flight close. */
  const uiLockedRef = useRef(false);
  const shelfClosingRef = useRef(false);
  /** Single in-flight close — rapid clicks await the same work instead of racing. */
  const closePromiseRef = useRef(null);
  const closeSessionRef = useRef(0);
  const activeCollectionIdRef = useRef(activeCollectionId);
  activeCollectionIdRef.current = activeCollectionId;
  /** Last collection id requested while stacks were busy — applied once in finally. */
  const pendingOpenCollectionIdRef = useRef(null);

  const [cardsRevealed, setCardsRevealed] = useState(true);
  const [flyInProgress, setFlyInProgress] = useState(false);
  /** After hub-style handoff: real tiles crossfade in while flyers fade out — avoids settle flicker. */
  const [flyHandoff, setFlyHandoff] = useState(false);
  const [manageCollectionsOpen, setManageCollectionsOpen] = useState(false);
  const [renameCollectionOpen, setRenameCollectionOpen] = useState(false);
  const [renameCollectionTarget, setRenameCollectionTarget] = useState(null);
  const { deleteWeeCollection, renameWeeCollection } = useConsolidatedAppStore(
    useShallow((state) => ({
      deleteWeeCollection: state.actions.deleteWeeCollection,
      renameWeeCollection: state.actions.renameWeeCollection,
    }))
  );
  /** After fly-out (or when closing without fly): delay clearing collection so grid animates 1fr → 0fr. */
  const [shelfClosing, setShelfClosing] = useState(false);
  /** Covers CSS grid row expansion/collapse tail after fly completes (or full duration when reduced-motion / no-fly). */
  const [expansionHold, setExpansionHold] = useState(false);
  useEffect(() => {
    shelfClosingRef.current = shelfClosing;
  }, [shelfClosing]);

  const { off: motionFeedbackOff } = useMotionFeedback();
  const flyAllowed = Boolean(effectsEnabled) && !motionFeedbackOff;

  useEffect(() => {
    if (!activeCollectionId) {
      setExpansionHold(false);
      return;
    }
    setExpansionHold(true);
    const t = window.setTimeout(() => setExpansionHold(false), COLLECTION_EXPANSION_MS + 80);
    return () => window.clearTimeout(t);
  }, [activeCollectionId]);

  const collectionChromeBusy = flyInProgress || shelfClosing || expansionHold;

  useLayoutEffect(() => {
    onCollectionChromeBusyChange?.(collectionChromeBusy);
  }, [collectionChromeBusy, onCollectionChromeBusyChange]);

  const games = activeCollection?.games || [];

  /** Instant scroll only — never smooth-scroll while fixed flyers are in flight. */
  const ensureExpansionInView = useCallback((behavior = 'auto') => {
    const container = hubScrollContainerRef?.current;
    const region = expansionRef.current;
    if (!container || !region) return;
    maybeScrollHubExpansionIntoView(container, region, {
      bottomInset: readHubDockInsetPx(region),
      topReserve: readHubScrollTopReservePx(region),
      minVisibleRatio: 0.42,
      behavior,
    });
  }, [hubScrollContainerRef]);
  const gameSignature = useMemo(
    () => `${activeCollectionId}:${(activeCollection?.games || []).map((g) => g.id).join(',')}`,
    [activeCollectionId, activeCollection]
  );

  const gridSlotRefs = useRef([]);

  const assignStackRef = (id) => (el) => {
    if (el) stackButtonRefs.current[id] = el;
    else delete stackButtonRefs.current[id];
  };

  const assignSlotRef = (index, el) => {
    gridSlotRefs.current[index] = el;
  };

  /**
   * Shelf collapse runs in parallel with fly-out vacuum (hub-design pattern) so open/close feel symmetrical.
   * Concurrent callers await one shared promise so rapid clicks cannot interleave two closes.
   */
  const animateClose = useCallback(async () => {
    if (closePromiseRef.current) {
      await closePromiseRef.current;
      return;
    }

    const run = async () => {
      const id = activeCollectionIdRef.current;
      const coll = collections.find((c) => c.id === id);
      const closeGames = coll?.games || [];
      const stackBtn = id ? stackButtonRefs.current[id] : null;
      const stackArea = stackBtn?.querySelector?.('.aura-hub-stack__cards');
      const toRect = stackArea?.getBoundingClientRect();

      flyGeneration.current += 1;
      flyAbortRef.current?.abort();
      flyAbortRef.current = null;
      setFlyInProgress(false);
      setFlyHandoff(false);
      const session = ++closeSessionRef.current;

      const finishClear = () => {
        setShelfClosing(false);
        if (session !== closeSessionRef.current) return;
        if (activeCollectionIdRef.current !== id) return;
        onSetCollection(null);
      };

      if (!id || !closeGames.length || !toRect?.width) {
        setShelfClosing(false);
        if (activeCollectionIdRef.current === id) onSetCollection(null);
        return;
      }

      const shelfWaitMs = Math.max(
        COLLECTION_EXPANSION_MS + 48,
        flyOutBlockingMs(closeGames.length)
      );

      if (!flyAllowed) {
        flushSync(() => {
          setCardsRevealed(false);
          setShelfClosing(true);
        });
        await waitMs(shelfWaitMs);
        if (session !== closeSessionRef.current) return;
        finishClear();
        return;
      }

      const fromRects = closeGames.map((_, i) => gridSlotRefs.current[i]?.getBoundingClientRect?.() || null);
      const closeController = new AbortController();

      flushSync(() => {
        setCardsRevealed(false);
        setShelfClosing(true);
      });

      await Promise.all([
        runFlyOutAnimations({
          games: closeGames,
          fromRects,
          toRect,
          signal: closeController.signal,
        }),
        waitMs(shelfWaitMs),
      ]);

      if (session !== closeSessionRef.current) {
        closeController.abort();
        return;
      }
      finishClear();
    };

    const p = run();
    closePromiseRef.current = p;
    try {
      await p;
    } finally {
      closePromiseRef.current = null;
    }
  }, [collections, flyAllowed, onSetCollection]);

  /** Decode / wait for collection grid imgs before crossfade so real tiles match flyers */
  const prepareCollectionHandoff = useCallback(async () => {
    const root = sectionRef.current;
    if (!root) return;
    const imgs = root.querySelectorAll('.aura-game-card img[src]');
    await Promise.all(
      Array.from(imgs).map((img) => {
        if (img.complete) {
          return img.decode?.().catch(() => {}) ?? Promise.resolve();
        }
        return new Promise((resolve) => {
          const done = () => resolve(undefined);
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }).then(() => img.decode?.().catch(() => {}) ?? Promise.resolve());
      })
    );
  }, []);

  useLayoutEffect(() => {
    if (!activeCollectionId || !games.length) {
      setCardsRevealed(true);
      setFlyInProgress(false);
      setFlyHandoff(false);
      return undefined;
    }
    if (!flyAllowed) {
      setCardsRevealed(true);
      setFlyInProgress(false);
      setFlyHandoff(false);
      return undefined;
    }

    const myGen = ++flyGeneration.current;
    flyAbortRef.current?.abort();
    const controller = new AbortController();
    flyAbortRef.current = controller;

    setFlyInProgress(true);
    setFlyHandoff(false);
    preloadGameArt(games);

    let cancelled = false;

    (async () => {
      // Instant scroll before measuring — fixed flyers cannot track smooth scroll.
      ensureExpansionInView('auto');
      await nextFrame();
      if (cancelled || myGen !== flyGeneration.current || controller.signal.aborted) {
        setFlyInProgress(false);
        setFlyHandoff(false);
        return;
      }

      const stackBtn = stackButtonRefs.current[activeCollectionId];
      const stackArea = stackBtn?.querySelector?.('.aura-hub-stack__cards');
      const fromRect = stackArea?.getBoundingClientRect();
      if (!fromRect?.width) {
        if (!cancelled && myGen === flyGeneration.current) {
          setFlyInProgress(false);
          setFlyHandoff(false);
          setCardsRevealed(true);
        }
        return;
      }

      const { didFly, aborted } = await runFlyInAnimations({
        games,
        fromRect,
        getToRect: (i) => gridSlotRefs.current[i]?.getBoundingClientRect?.() || null,
        prepareHandoff: prepareCollectionHandoff,
        signal: controller.signal,
        onHandoffStart: () => {
          flushSync(() => {
            setFlyHandoff(true);
          });
        },
      });

      if (!cancelled && myGen === flyGeneration.current && !aborted) {
        setFlyInProgress(false);
        setFlyHandoff(false);
        setCardsRevealed(true);
        if (didFly) {
          // Soft post-settle nudge if dock still clips the shelf — still instant, not mid-flight.
          ensureExpansionInView('auto');
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (flyAbortRef.current === controller) flyAbortRef.current = null;
    };
  }, [
    activeCollectionId,
    ensureExpansionInView,
    flyAllowed,
    gameSignature,
    prepareCollectionHandoff,
  ]);

  const flushPendingOpen = useCallback(() => {
    const pid = pendingOpenCollectionIdRef.current;
    pendingOpenCollectionIdRef.current = null;
    if (pid == null) return;
    const col = collections.find((c) => c.id === pid);
    if (!col) return;
    if (activeCollectionIdRef.current === pid) return;
    onSetCollection(pid);
  }, [collections, onSetCollection]);

  const handleStackClick = useCallback(
    async (e, collection) => {
      e.stopPropagation();

      if (uiLockedRef.current || shelfClosingRef.current) {
        if (collection.id !== activeCollectionId) {
          pendingOpenCollectionIdRef.current = collection.id;
        }
        return;
      }

      uiLockedRef.current = true;
      try {
        const isActive = activeCollectionId === collection.id;

        if (isActive) {
          await animateClose();
          return;
        }

        if (activeCollectionId && activeCollectionId !== collection.id) {
          await animateClose();
        }

        onSetCollection(collection.id);
      } finally {
        uiLockedRef.current = false;
        flushPendingOpen();
      }
    },
    [activeCollectionId, animateClose, flushPendingOpen, onSetCollection]
  );

  useEffect(() => {
    if (!activeCollectionId) return undefined;

    const onGlobalDown = (event) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (shouldIgnoreCollectionCloseTarget(target)) return;
      if (target.closest('.aura-hub-stack')) return;
      if (target.closest('.aura-hub-expansion')) return;
      if (target.closest('#game-hub-library') || target.closest('.aura-hub-section--library')) return;
      if (target.closest('.aura-hub-scroll-anchors')) return;
      if (target.closest('.aura-hub-controls-pill')) return;
      if (uiLockedRef.current) return;
      uiLockedRef.current = true;
      Promise.resolve(animateClose()).finally(() => {
        uiLockedRef.current = false;
      });
    };

    window.addEventListener('mousedown', onGlobalDown);
    return () => window.removeEventListener('mousedown', onGlobalDown);
  }, [activeCollectionId, animateClose]);

  const handleShelfOpenFromMenu = useCallback(
    (col) => {
      const ev = { stopPropagation: () => {} };
      handleStackClick(ev, col);
    },
    [handleStackClick]
  );

  const handleShelfRenameRequest = useCallback((col) => {
    setRenameCollectionTarget(col);
    setRenameCollectionOpen(true);
  }, []);

  const handleShelfDeleteRequest = useCallback(
    (col) => {
      if (!col?.id || !String(col.id).startsWith('wee-')) return;
      const ok = window.confirm(
        `Delete collection "${col.label || 'Collection'}"? Games stay in your library; only this shelf is removed.`
      );
      if (ok) deleteWeeCollection(col.id);
    },
    [deleteWeeCollection]
  );

  const handleRenameSave = useCallback(
    (label) => {
      if (!renameCollectionTarget?.id) return;
      renameWeeCollection(renameCollectionTarget.id, label);
    },
    [renameCollectionTarget, renameWeeCollection]
  );

  const slotClassName = useMemo(() => {
    if (!flyAllowed) return 'aura-hub-card-slot';
    if (!cardsRevealed) return 'aura-hub-card-slot aura-hub-card-slot--hide-cards';
    if (flyInProgress) return 'aura-hub-card-slot aura-hub-card-slot--fly-lock';
    return 'aura-hub-card-slot';
  }, [flyAllowed, cardsRevealed, flyInProgress]);

  const gridClassName = useMemo(() => {
    const parts = ['aura-hub-grid'];
    if (flyAllowed && flyInProgress) {
      parts.push('aura-hub-grid--fly-active');
      if (flyHandoff) parts.push('aura-hub-grid--fly-handoff');
    }
    return parts.join(' ');
  }, [flyAllowed, flyInProgress, flyHandoff]);

  return (
    <section
      ref={sectionRef}
      className="aura-hub-section aura-hub-section--collections"
      id="game-hub-collections"
    >
      <div className="aura-hub-section__header aura-hub-section__header--row aura-hub-section__header--collections">
        <h3>Curated Collections</h3>
        <div className="aura-hub-section__header-actions">
          <label className="aura-hub-sort">
            <span className="sr-only">Shelf order</span>
            <select
              className="aura-hub-sort__select"
              value={shelfOrderMode}
              onChange={(e) => onShelfOrderModeChange?.(e.target.value)}
            >
              <option value="custom">Shelves: Custom</option>
              <option value="alphabetical">Shelves: A–Z</option>
            </select>
          </label>
          <label className="aura-hub-sort">
            <span className="sr-only">Games in each shelf</span>
            <select
              className="aura-hub-sort__select"
              value={hubCollectionGamesSort}
              onChange={(e) => onHubCollectionGamesSortChange?.(e.target.value)}
            >
              <option value="default">Games: Default</option>
              <option value="alphabetical">Games: A–Z</option>
            </select>
          </label>
        </div>
      </div>
      <GameHubManageCollectionsDialog open={manageCollectionsOpen} onOpenChange={setManageCollectionsOpen} />
      <GameHubRenameCollectionDialog
        open={renameCollectionOpen}
        onOpenChange={setRenameCollectionOpen}
        initialName={renameCollectionTarget?.label || ''}
        onSave={handleRenameSave}
      />
      {collections.length ? (
        <>
          <div className="aura-hub-collections">
            {collections.map((collection) => {
              const stack = collection.games.slice(0, 3);
              const isActive = activeCollectionId === collection.id;
              const weeContextId = String(collection.id || '').startsWith('wee-') ? collection.id : null;
              return (
                <CollectionShelfContextMenu
                  key={collection.id}
                  collection={collection}
                  onOpenShelf={handleShelfOpenFromMenu}
                  onOpenManage={() => setManageCollectionsOpen(true)}
                  onRenameShelf={handleShelfRenameRequest}
                  onDeleteShelf={handleShelfDeleteRequest}
                >
                  <div
                    ref={assignStackRef(collection.id)}
                    role="button"
                    tabIndex={0}
                    className={`aura-hub-stack${isActive ? ' aura-hub-stack--active' : ''}${
                      isActive && !flyInProgress && !shelfClosing ? ' aura-hub-stack--settled' : ''
                    }`}
                    onClick={(e) => handleStackClick(e, collection)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStackClick(e, collection);
                      }
                    }}
                  >
                    <div className="aura-hub-stack__cards">
                      {stack.map((game, index) => (
                        <GameCardContextMenu
                          key={`${collection.id}-${game.id}`}
                          game={game}
                          contextCollectionId={weeContextId}
                        >
                          <div
                            className={`aura-hub-stack__item aura-hub-stack__item--${index + 1}`}
                            style={{ backgroundImage: game.imageUrl ? `url('${game.imageUrl}')` : 'none' }}
                            onMouseEnter={() => onHeroPreview?.(game)}
                            onMouseLeave={() => onHeroPreview?.(null)}
                          />
                        </GameCardContextMenu>
                      ))}
                    </div>
                    <span className="aura-hub-stack__label">{collection.label}</span>
                  </div>
                </CollectionShelfContextMenu>
              );
            })}
          </div>
          <div
            ref={expansionRef}
            className={`aura-hub-expansion ${activeCollection && !shelfClosing ? 'aura-hub-expansion--open' : ''} ${shelfClosing ? 'aura-hub-expansion--shelf-closing' : ''}`}
            style={
              (activeCollection || shelfClosing) && flyAllowed
                ? {
                    transitionDuration: `${COLLECTION_EXPANSION_MS}ms`,
                    transitionTimingFunction: SHELF_PHYSICS_EASE,
                  }
                : undefined
            }
          >
            <div className="aura-hub-expansion__inner">
              <div
                className={gridClassName}
                key={gameSignature}
                style={{
                  '--collection-handoff-crossfade-ms': `${COLLECTION_FLY_PHASE_MS.handoffCrossfade}ms`,
                  '--collection-ghost-handshake-ms': `${COLLECTION_FLY_PHASE_MS.ghostHandshake}ms`,
                }}
              >
                {(activeCollection?.games || []).map((game, index) => (
                  <div key={game.id} ref={(el) => assignSlotRef(index, el)} className={slotClassName}>
                    <GameCardContextMenu game={game} contextCollectionId={activeCollectionId}>
                      <AuraGameCard
                        game={game}
                        imageLoading={flyAllowed ? 'eager' : 'lazy'}
                        onHover={() => onSelectGame(game.id)}
                        onHeroPreview={onHeroPreview}
                        onLaunch={onLaunchGame}
                      />
                    </GameCardContextMenu>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="aura-hub-empty">
          <p className="!m-0 mb-2 font-semibold text-[hsl(var(--text-primary))]">Start your first shelf</p>
          <p className="!m-0 leading-relaxed">
            Add Wee favorites from a game&apos;s right-click menu, connect Steam for playtime shelves, or create a Wee
            collection from a shelf context menu.
          </p>
        </div>
      )}
    </section>
  );
}
