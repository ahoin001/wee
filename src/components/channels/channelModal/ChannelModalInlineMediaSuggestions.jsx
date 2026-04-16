import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';
import { getAllMatchingMedia, getCachedMediaLibrary } from '../../../utils/mediaLibraryCache';
import { getStoragePublicObjectUrl } from '../../../utils/supabase';
import { resolveMimeTypeFromMediaLibraryRow } from '../../../utils/channelMediaType';

/** Exported for channel art panel + library search seeding. */
export function deriveChannelArtSearchQuery({ path, type, matchingApp }) {
  const appName = String(matchingApp?.name || '').trim();
  if (appName) return appName;

  const rawPath = String(path || '').trim();
  if (!rawPath) return '';

  if (type === 'url') {
    try {
      const parsed = new URL(rawPath);
      return parsed.hostname.replace(/^www\./i, '');
    } catch {
      return rawPath;
    }
  }

  const normalized = rawPath.replace(/\\/g, '/');
  const leaf = normalized.split('/').pop() || normalized;
  return leaf.replace(/\.(exe|lnk|url)$/i, '').trim();
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCandidateTerms({ path, type, matchingApp }) {
  const terms = new Set();
  const primary = deriveChannelArtSearchQuery({ path, type, matchingApp });
  if (primary) terms.add(primary);

  const appName = String(matchingApp?.name || '').trim();
  if (appName) terms.add(appName);

  const rawPath = String(path || '').trim();
  if (rawPath && type !== 'url') {
    const leaf = rawPath.replace(/\\/g, '/').split('/').pop() || rawPath;
    const sanitized = leaf
      .replace(/\.(exe|lnk|url|bat|cmd)$/i, '')
      .replace(/\b(x64|x86|win32|release|launcher|game|app)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (sanitized) terms.add(sanitized);
  }

  return [...terms].filter(Boolean);
}

function buildQueryTokens(terms) {
  const stop = new Set(['the', 'and', 'for', 'game', 'app', 'launcher', 'edition', 'remastered']);
  const tokens = new Set();
  terms.forEach((term) => {
    normalizeText(term)
      .split(' ')
      .filter((t) => t.length > 2 && !stop.has(t))
      .forEach((t) => tokens.add(t));
  });
  return [...tokens];
}

function scoreFallbackMedia(row, terms, tokens) {
  const title = normalizeText(row?.title || '');
  const description = normalizeText(row?.description || '');
  const tags = Array.isArray(row?.tags) ? normalizeText(row.tags.join(' ')) : '';
  const haystack = `${title} ${description} ${tags}`.trim();
  if (!haystack) return 0;

  let score = 0;

  for (const term of terms) {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) continue;
    if (haystack.includes(normalizedTerm)) {
      score += 1.2;
    }
  }

  let tokenHits = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      tokenHits += 1;
    }
  }
  if (tokens.length > 0) {
    score += (tokenHits / tokens.length) * 1.35;
  }

  const downloads = Number(row?.downloads || 0);
  if (downloads > 0) {
    score += Math.min(0.45, Math.log10(downloads + 1) / 10);
  }

  return score;
}

function formatMediaKind(row) {
  const ft = String(row?.file_type || '').toLowerCase();
  if (ft === 'video') return 'Video';
  if (ft === 'gif') return 'GIF';
  if (ft === 'image') return 'Image';
  return 'Media';
}

function rowKey(row) {
  return row?.id || row?.file_url || '';
}

function rowPublicUrl(row) {
  return getStoragePublicObjectUrl('media-library', row.file_url);
}

function SuggestionThumb({ row, thumbUrl }) {
  const ft = String(row?.file_type || '').toLowerCase();
  if (ft === 'video') {
    return (
      <span className="channel-inline-media-suggest__thumb channel-inline-media-suggest__thumb--media">
        <video
          className="channel-inline-media-suggest__thumb-video"
          src={thumbUrl}
          muted
          loop
          playsInline
          autoPlay
        />
      </span>
    );
  }
  return (
    <span className="channel-inline-media-suggest__thumb channel-inline-media-suggest__thumb--media">
      <img src={thumbUrl} alt="" className="channel-inline-media-suggest__thumb-img" loading="lazy" />
    </span>
  );
}

export default function ChannelModalInlineMediaSuggestions({
  path,
  type,
  matchingApp,
  onApplyMedia,
  appliedMedia,
}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });
  const reduceMotion = useReducedMotion();

  const terms = useMemo(() => buildCandidateTerms({ path, type, matchingApp }), [path, type, matchingApp]);
  const query = terms[0] || '';
  const tokens = useMemo(() => buildQueryTokens(terms), [terms]);
  const matches = useMemo(() => {
    if (!terms.length) return [];

    const seen = new Map();
    for (const term of terms) {
      const direct = getAllMatchingMedia(term).slice(0, 8);
      direct.forEach((row) => {
        const key = row.id || row.file_url;
        if (!key) return;
        const existing = seen.get(key);
        if (!existing || Number(row.score || 0) > Number(existing.score || 0)) {
          seen.set(key, row);
        }
      });
    }

    const directMatches = [...seen.values()]
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 8);
    if (directMatches.length >= 5) {
      return directMatches;
    }

    const cached = getCachedMediaLibrary();
    if (!Array.isArray(cached) || cached.length === 0) {
      return directMatches;
    }

    const fallback = cached
      .filter((row) => !seen.has(row.id || row.file_url))
      .map((row) => ({ row, score: scoreFallbackMedia(row, terms, tokens) }))
      .filter((x) => x.score >= 0.42)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8 - directMatches.length)
      .map((x) => ({ ...x.row, score: x.score }));

    return [...directMatches, ...fallback].slice(0, 8);
  }, [terms, tokens]);

  const updateScrollAffordance = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = 1;
    setCanScroll({
      left: scrollLeft > max,
      right: scrollLeft + clientWidth < scrollWidth - max,
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    const track = trackRef.current;
    if (!el) return undefined;
    updateScrollAffordance();
    requestAnimationFrame(updateScrollAffordance);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            updateScrollAffordance();
          })
        : null;
    ro?.observe(el);
    if (track) ro?.observe(track);
    el.addEventListener('scroll', updateScrollAffordance, { passive: true });
    return () => {
      ro?.disconnect();
      el.removeEventListener('scroll', updateScrollAffordance);
    };
  }, [matches, updateScrollAffordance]);

  const scrollCarousel = useCallback(
    (dir) => {
      const el = viewportRef.current;
      if (!el) return;
      const step = Math.max(140, Math.floor(el.clientWidth * 0.72));
      el.scrollBy({
        left: dir * step,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    },
    [reduceMotion]
  );

  const isRowApplied = useCallback(
    (row) => {
      if (!appliedMedia?.url || appliedMedia.loading) return false;
      return appliedMedia.url === rowPublicUrl(row);
    },
    [appliedMedia]
  );

  const applyMedia = useCallback(
    (row) => {
      if (!row) return;
      const mediaData = {
        url: rowPublicUrl(row),
        type: resolveMimeTypeFromMediaLibraryRow(row),
        name: row.title || row.file_url,
        isBuiltin: true,
      };
      onApplyMedia?.(mediaData);
    },
    [onApplyMedia]
  );

  const hasMatches = matches.length > 0;

  if (!hasMatches) {
    return null;
  }

  return (
    <section className="channel-inline-media-suggest" aria-labelledby="channel-inline-media-suggest-heading">
      <div className="channel-inline-media-suggest__header">
        <h4 id="channel-inline-media-suggest-heading" className="channel-inline-media-suggest__title">
          Suggested channel art
        </h4>
        {query ? (
          <span className="channel-inline-media-suggest__query">Picked for “{query}”</span>
        ) : null}
      </div>

      <div className="channel-inline-media-suggest__carousel">
        <button
          type="button"
          className="channel-inline-media-suggest__carousel-btn"
          aria-label="Scroll suggestions left"
          disabled={!canScroll.left}
          onClick={() => scrollCarousel(-1)}
        >
          <span aria-hidden className="channel-inline-media-suggest__carousel-btn-icon">
            ‹
          </span>
        </button>

        <div
          ref={viewportRef}
          className="channel-inline-media-suggest__viewport channel-inline-media-suggest__viewport--no-scrollbar"
          role="region"
          aria-roledescription="carousel"
          aria-label="Suggested channel art"
        >
          <div ref={trackRef} className="channel-inline-media-suggest__track" role="list">
            {matches.map((item) => {
              const thumbUrl = rowPublicUrl(item);
              const applied = isRowApplied(item);
              return (
                <button
                  type="button"
                  key={rowKey(item)}
                  role="listitem"
                  className={`channel-inline-media-suggest__card ${applied ? 'is-applied' : ''}`}
                  onClick={() => applyMedia(item)}
                  title={`Use “${item.title || 'this media'}”`}
                  aria-current={applied ? 'true' : undefined}
                >
                  <span className="channel-inline-media-suggest__thumb-wrap">
                    <SuggestionThumb row={item} thumbUrl={thumbUrl} />
                    {applied ? (
                      <span className="channel-inline-media-suggest__applied-pill">On channel</span>
                    ) : null}
                    <span className="channel-inline-media-suggest__kind-badge">{formatMediaKind(item)}</span>
                  </span>
                  <span className="channel-inline-media-suggest__meta">
                    <span className="channel-inline-media-suggest__name">{item.title || 'Untitled media'}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="channel-inline-media-suggest__carousel-btn"
          aria-label="Scroll suggestions right"
          disabled={!canScroll.right}
          onClick={() => scrollCarousel(1)}
        >
          <span aria-hidden className="channel-inline-media-suggest__carousel-btn-icon">
            ›
          </span>
        </button>
      </div>
    </section>
  );
}

ChannelModalInlineMediaSuggestions.propTypes = {
  path: PropTypes.string,
  type: PropTypes.string,
  matchingApp: PropTypes.object,
  onApplyMedia: PropTypes.func,
  appliedMedia: PropTypes.shape({
    url: PropTypes.string,
    loading: PropTypes.bool,
  }),
};

ChannelModalInlineMediaSuggestions.defaultProps = {
  path: '',
  type: 'exe',
  matchingApp: null,
  onApplyMedia: undefined,
  appliedMedia: null,
};
