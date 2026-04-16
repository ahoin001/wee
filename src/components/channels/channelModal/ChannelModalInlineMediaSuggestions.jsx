import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WButton from '../../../ui/WButton';
import { getAllMatchingMedia, getCachedMediaLibrary } from '../../../utils/mediaLibraryCache';
import { getStoragePublicObjectUrl } from '../../../utils/supabase';
import { resolveMimeTypeFromMediaLibraryRow } from '../../../utils/channelMediaType';

function deriveSuggestionQuery({ path, type, matchingApp }) {
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
  const primary = deriveSuggestionQuery({ path, type, matchingApp });
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

export default function ChannelModalInlineMediaSuggestions({
  path,
  type,
  matchingApp,
  onApplyMedia,
  onOpenMediaSearch,
}) {
  const [selectedMediaId, setSelectedMediaId] = useState('');
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

  const hasMatches = matches.length > 0;

  const applyMedia = (row) => {
    if (!row) return;
    const mediaData = {
      url: getStoragePublicObjectUrl(row.file_url),
      type: resolveMimeTypeFromMediaLibraryRow(row),
      name: row.title || row.file_url,
      isBuiltin: true,
    };
    onApplyMedia?.(mediaData);
    setSelectedMediaId(row.id || row.file_url);
  };

  return (
    <section className="channel-inline-media-suggest">
      <div className="channel-inline-media-suggest__header">
        <h4 className="channel-inline-media-suggest__title">Suggested channel art</h4>
        {query ? <span className="channel-inline-media-suggest__query">Matches for "{query}"</span> : null}
      </div>

      {hasMatches ? (
        <div className="channel-inline-media-suggest__rail" role="list" aria-label="Suggested channel media">
          {matches.map((item, index) => {
            const active = selectedMediaId
              ? selectedMediaId === (item.id || item.file_url)
              : index === 0;
            const thumbUrl = getStoragePublicObjectUrl(item.file_url);
            return (
              <button
                type="button"
                key={item.id || item.file_url}
                role="listitem"
                className={`channel-inline-media-suggest__card ${active ? 'is-active' : ''}`}
                onClick={() => applyMedia(item)}
                title={`Use "${item.title || 'media'}"`}
              >
                <span
                  className="channel-inline-media-suggest__thumb"
                  style={{ backgroundImage: `url('${thumbUrl}')` }}
                  aria-hidden
                />
                <span className="channel-inline-media-suggest__meta">
                  <span className="channel-inline-media-suggest__name">{item.title || 'Untitled media'}</span>
                  <span className="channel-inline-media-suggest__sub">
                    {item.file_type || 'media'} · score {(item.score || 0).toFixed(2)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="channel-inline-media-suggest__empty">
          <span className="channel-inline-media-suggest__empty-text">
            No direct matches found yet. Browse the media library for a better fit.
          </span>
          <WButton variant="secondary" size="sm" onClick={onOpenMediaSearch}>
            Find media for this channel
          </WButton>
        </div>
      )}
    </section>
  );
}

ChannelModalInlineMediaSuggestions.propTypes = {
  path: PropTypes.string,
  type: PropTypes.string,
  matchingApp: PropTypes.object,
  onApplyMedia: PropTypes.func,
  onOpenMediaSearch: PropTypes.func,
};

ChannelModalInlineMediaSuggestions.defaultProps = {
  path: '',
  type: 'exe',
  matchingApp: null,
  onApplyMedia: undefined,
  onOpenMediaSearch: undefined,
};
