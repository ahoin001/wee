import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import AuraGameCard from './AuraGameCard';
import GameCardContextMenu from './GameCardContextMenu';
import GameHubManageCollectionsDialog from './GameHubManageCollectionsDialog';
import {
  COLLECTION_EXPANSION_MS,
  COLLECTION_FLY_PHASE_MS,
  SHELF_PHYSICS_EASE,
  runFlyInAnimations,
  runFlyOutAnimations,
} from './collectionFlyAnimations';
import { readHubDockInsetPx, scrollHubRegionIntoFocus } from './hubScrollUtils';

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

/** Scroll after shelf + fly settle (hub: scrollIntoView first — we defer to avoid fighting expansion). */
function scrollDelayMs(flyEnabled) {
  return flyEnabled ? COLLECTION_EXPANSION_MS + 160 : 100;
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
  scrollContainerRef,
  collections,
  activeCollection,
  activeCollectionId,
  onSetCollection,
  onSelectGame,
  onLaunchGame,
  onHeroPreview,
  effectsEnabled = true,
}) {
  const sectionRef = useRef(null);
  const stackButtonRefs = useRef({});
  const flyGeneration = useRef(0);
  /** Synchronous guard — stack clicks can land before React state would reflect an in-flight close. */
  const uiLockedRef = useRef(false);
  const shelfClosingRef = useRef(false);
  const scrollIntoCollectionViewRef = useRef(false);
  const scrollRoRef = useRef(null);
  const scrollStopTimerRef = useRef(null);
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
  /** After fly-out (or when closing without fly): delay clearing collection so grid animates 1fr → 0fr. */
  const [shelfClosing, setShelfClosing] = useState(false);
  useEffect(() => {
    shelfClosingRef.current = shelfClosing;
  }, [shelfClosing]);

  const reducedMotion = useMemo(
    () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false),
    []
  );

  const flyAllowed = Boolean(effectsEnabled) && !reducedMotion;

  const games = activeCollection?.games || [];
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

      const shelfWaitMs = COLLECTION_EXPANSION_MS + 48;

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

      flushSync(() => {
        setCardsRevealed(false);
        setShelfClosing(true);
      });

      await Promise.all([runFlyOutAnimations({ games: closeGames, fromRects, toRect }), waitMs(shelfWaitMs)]);

      if (session !== closeSessionRef.current) return;
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
      return;
    }
    if (!flyAllowed) {
      setCardsRevealed(true);
      setFlyInProgress(false);
      setFlyHandoff(false);
      return;
    }

    const myGen = ++flyGeneration.current;
    setFlyInProgress(true);
    setFlyHandoff(false);
    preloadGameArt(games);

    let cancelled = false;

    (async () => {
      await nextFrame();
      if (cancelled || myGen !== flyGeneration.current) {
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

      const { didFly } = await runFlyInAnimations({
        games,
        fromRect,
        getToRect: (i) => gridSlotRefs.current[i]?.getBoundingClientRect?.() || null,
        prepareHandoff: prepareCollectionHandoff,
        onHandoffStart: () => {
          flushSync(() => {
            setFlyHandoff(true);
          });
        },
      });

      if (!cancelled && myGen === flyGeneration.current) {
        setFlyInProgress(false);
        setFlyHandoff(false);
        if (!didFly) setCardsRevealed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCollectionId, gameSignature, flyAllowed, prepareCollectionHandoff]);

  useEffect(() => {
    if (!activeCollectionId || !scrollIntoCollectionViewRef.current) return undefined;
    scrollIntoCollectionViewRef.current = false;

    const container = scrollContainerRef?.current;
    const region = sectionRef.current;
    if (!container || !region) return undefined;

    const runScroll = () => {
      const inset = readHubDockInsetPx(region);
      scrollHubRegionIntoFocus(container, region, { bottomInset: inset });
    };

    const delayMs = scrollDelayMs(flyAllowed);

    const startTimer = window.setTimeout(() => {
      runScroll();
      if (scrollRoRef.current) {
        scrollRoRef.current.disconnect();
        scrollRoRef.current = null;
      }
      const ro = new ResizeObserver(() => runScroll());
      scrollRoRef.current = ro;
      ro.observe(region);
      scrollStopTimerRef.current = window.setTimeout(() => {
        scrollRoRef.current?.disconnect();
        scrollRoRef.current = null;
        scrollStopTimerRef.current = null;
      }, 650);
    }, delayMs);

    return () => {
      window.clearTimeout(startTimer);
      scrollRoRef.current?.disconnect();
      scrollRoRef.current = null;
      if (scrollStopTimerRef.current) {
        window.clearTimeout(scrollStopTimerRef.current);
        scrollStopTimerRef.current = null;
      }
    };
  }, [activeCollectionId, gameSignature, scrollContainerRef, flyAllowed]);

  const flushPendingOpen = useCallback(() => {
    const pid = pendingOpenCollectionIdRef.current;
    pendingOpenCollectionIdRef.current = null;
    if (pid == null) return;
    const col = collections.find((c) => c.id === pid);
    if (!col) return;
    if (activeCollectionIdRef.current === pid) return;
    scrollIntoCollectionViewRef.current = true;
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

        scrollIntoCollectionViewRef.current = true;
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
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (shouldIgnoreCollectionCloseTarget(target)) return;
      if (target.closest('.aura-hub-stack')) return;
      if (target.closest('.aura-hub-expansion')) return;
      if (target.closest('.aura-hub-scroll-anchors')) return;
      if (target.closest('.aura-hub-mode-toggle')) return;
      if (uiLockedRef.current) return;
      uiLockedRef.current = true;
      Promise.resolve(animateClose()).finally(() => {
        uiLockedRef.current = false;
      });
    };

    window.addEventListener('mousedown', onGlobalDown);
    return () => window.removeEventListener('mousedown', onGlobalDown);
  }, [activeCollectionId, animateClose]);

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
      <div className="aura-hub-section__header aura-hub-section__header--row">
        <h3>Curated Collections</h3>
        <button
          type="button"
          className="aura-hub-section__manage"
          onClick={() => setManageCollectionsOpen(true)}
        >
          Manage collections
        </button>
      </div>
      <GameHubManageCollectionsDialog open={manageCollectionsOpen} onOpenChange={setManageCollectionsOpen} />
      {collections.length ? (
        <>
          <div className="aura-hub-collections">
            {collections.map((collection) => {
              const stack = collection.games.slice(0, 3);
              const isActive = activeCollectionId === collection.id;
              return (
                <button
                  key={collection.id}
                  ref={assignStackRef(collection.id)}
                  type="button"
                  className={`aura-hub-stack ${isActive ? 'aura-hub-stack--active' : ''}`}
                  onClick={(e) => handleStackClick(e, collection)}
                >
                  <div className="aura-hub-stack__cards">
                    {stack.map((game, index) => (
                      <div
                        key={`${collection.id}-${game.id}`}
                        className={`aura-hub-stack__item aura-hub-stack__item--${index + 1}`}
                        style={{ backgroundImage: game.imageUrl ? `url('${game.imageUrl}')` : 'none' }}
                        onMouseEnter={() => onHeroPreview?.(game)}
                        onMouseLeave={() => onHeroPreview?.(null)}
                      />
                    ))}
                  </div>
                  <span className="aura-hub-stack__label">{collection.label}</span>
                </button>
              );
            })}
          </div>
          <div
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
          No shelves yet. Add Wee favorites from the right-click menu, launch games from the hub to build a Recently
          played shelf, or connect Steam for playtime-based shelves and client tags.
        </div>
      )}
    </section>
  );
}
