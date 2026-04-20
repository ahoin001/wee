import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import AuraGameCard from '../game-hub/AuraGameCard';
import {
  COLLECTION_EXPANSION_MS,
  COLLECTION_FLY_PHASE_MS,
  SHELF_PHYSICS_EASE,
  runFlyInAnimations,
  runFlyOutAnimations,
} from '../game-hub/collectionFlyAnimations';
import { maybeScrollHubExpansionIntoView, readHubDockInsetPx, readHubScrollTopReservePx } from '../game-hub/hubScrollUtils';
import '../game-hub/GameHubSpace.css';

/** Mirrors Game Hub curated shelf cap (`MAX_COLLECTION_GAMES`). */
const MAX_LOCAL_SHELF_ITEMS = 18;

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

function shouldIgnoreMediaHubShelfCloseTarget(target) {
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
  if (target.closest('.media-hub-header')) return true;
  if (target.closest('.media-hub-detail-overlay')) return true;
  if (target.closest('.media-hub-detail-aside-wrap')) return true;
  return false;
}

/**
 * Collapsible folder shelves for Media Hub local library — same fly / vacuum timing as Game Hub collections.
 */
export default function MediaHubLocalShelfSection({
  localFolderGroups,
  thumbnailByPath,
  onSelectItem,
  onLaunchLocal,
  hubScrollContainerRef,
}) {
  const sectionRef = useRef(null);
  const expansionRef = useRef(null);
  const stackButtonRefs = useRef({});
  const flyGeneration = useRef(0);
  const uiLockedRef = useRef(false);
  const shelfClosingRef = useRef(false);
  const closePromiseRef = useRef(null);
  const closeSessionRef = useRef(0);
  const activeCollectionIdRef = useRef(null);
  const pendingOpenCollectionIdRef = useRef(null);

  const [activeCollectionId, setActiveCollectionId] = useState(null);
  activeCollectionIdRef.current = activeCollectionId;

  const [cardsRevealed, setCardsRevealed] = useState(true);
  const [flyInProgress, setFlyInProgress] = useState(false);
  const [flyHandoff, setFlyHandoff] = useState(false);
  const [shelfClosing, setShelfClosing] = useState(false);
  const [expansionHold, setExpansionHold] = useState(false);

  useEffect(() => {
    shelfClosingRef.current = shelfClosing;
  }, [shelfClosing]);

  const reducedMotion = useMemo(
    () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false),
    []
  );

  const flyAllowed = !reducedMotion;

  useEffect(() => {
    if (!activeCollectionId) {
      setExpansionHold(false);
      return undefined;
    }
    setExpansionHold(true);
    const t = window.setTimeout(() => setExpansionHold(false), COLLECTION_EXPANSION_MS + 80);
    return () => window.clearTimeout(t);
  }, [activeCollectionId]);

  const collections = useMemo(() => {
    const thumbs = thumbnailByPath || {};
    return localFolderGroups
      .map((g) => ({
        id: g.key,
        label: g.title,
        subtitle: g.subtitle,
        games: g.files.slice(0, MAX_LOCAL_SHELF_ITEMS).map((file) => ({
          id: file.id,
          name: file.name,
          imageUrl: thumbs[file.path] || '',
          path: file.path,
          extension: file.extension,
          size: file.size,
          modifiedAt: file.modifiedAt,
        })),
      }))
      .filter((c) => c.games.length > 0);
  }, [localFolderGroups, thumbnailByPath]);

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === activeCollectionId) || null,
    [collections, activeCollectionId]
  );

  const collectionsRef = useRef(collections);
  collectionsRef.current = collections;

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

  const getFlyLayerParent = useCallback(() => {
    return sectionRef.current ?? document.querySelector('.media-hub-space') ?? document.body;
  }, []);

  const onSetCollection = useCallback((id) => {
    setActiveCollectionId(id);
  }, []);

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

      await Promise.all([
        runFlyOutAnimations({ games: closeGames, fromRects, toRect, getFlyLayerParent }),
        waitMs(shelfWaitMs),
      ]);

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
  }, [collections, flyAllowed, getFlyLayerParent, onSetCollection]);

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
    const games =
      collectionsRef.current.find((c) => c.id === activeCollectionId)?.games || [];
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
        getFlyLayerParent,
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
  }, [activeCollectionId, flyAllowed, gameSignature, getFlyLayerParent, prepareCollectionHandoff]);

  useLayoutEffect(() => {
    if (!activeCollectionId || !hubScrollContainerRef?.current) return undefined;

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const container = hubScrollContainerRef.current;
      const region = expansionRef.current;
      if (!container || !region) return;
      const reduced =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      maybeScrollHubExpansionIntoView(container, region, {
        bottomInset: readHubDockInsetPx(region),
        topReserve: readHubScrollTopReservePx(region),
        minVisibleRatio: 0.42,
        behavior: reduced ? 'auto' : 'smooth',
      });
    };

    const id0 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) run();
      });
    });
    const t = window.setTimeout(() => {
      if (!cancelled) requestAnimationFrame(run);
    }, COLLECTION_EXPANSION_MS + 60);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id0);
      window.clearTimeout(t);
    };
  }, [activeCollectionId, hubScrollContainerRef]);

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
      if (shouldIgnoreMediaHubShelfCloseTarget(target)) return;
      if (target.closest('.aura-hub-stack')) return;
      if (target.closest('.aura-hub-expansion')) return;
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

  if (!collections.length) {
    return null;
  }

  return (
    <section ref={sectionRef} className="media-hub-local-shelves aura-hub-section aura-hub-section--collections">
      <div className="aura-hub-collections">
        {collections.map((collection) => {
          const stack = collection.games.slice(0, 3);
          const isActive = activeCollectionId === collection.id;
          return (
            <div
              key={collection.id}
              ref={assignStackRef(collection.id)}
              role="button"
              tabIndex={0}
              className={`aura-hub-stack ${isActive ? 'aura-hub-stack--active' : ''}`}
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
                  <div
                    key={`${collection.id}-${game.id}`}
                    className={`aura-hub-stack__item aura-hub-stack__item--${index + 1}`}
                    style={{ backgroundImage: game.imageUrl ? `url('${game.imageUrl}')` : 'none' }}
                  />
                ))}
              </div>
              <span className="aura-hub-stack__label">{collection.label}</span>
            </div>
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
                <AuraGameCard
                  game={game}
                  imageLoading={flyAllowed ? 'eager' : 'lazy'}
                  onHover={() => onSelectItem?.(game.id)}
                  onLaunch={() => onLaunchLocal?.(game)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
