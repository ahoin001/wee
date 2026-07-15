import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { RefreshCcw, Trash2 } from 'lucide-react';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';
import {
  clearAllCacheDomains,
  getCacheDomainLastRefreshedAt,
  listCacheDomains,
  refreshCacheDomain,
  subscribeCacheDomains,
} from '../../utils/cacheRegistry';
// Side effect: ensures every cache domain is registered before we list them.
import '../../utils/cacheDomains';

const SCOPE_LABELS = {
  session: 'This session',
  persisted: 'Saved on disk',
  disk: 'System scan',
};

function formatLastRefreshed(ts) {
  if (!Number.isFinite(ts) || ts <= 0) return 'Not loaded yet';
  const deltaMs = Date.now() - ts;
  if (deltaMs < 60 * 1000) return 'Refreshed just now';
  const minutes = Math.round(deltaMs / (60 * 1000));
  if (minutes < 60) return `Refreshed ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Refreshed ${hours} h ago`;
  return `Refreshed ${new Date(ts).toLocaleDateString()}`;
}

/**
 * Settings → General → "Data & caches" — the one place to see and act on every
 * registered cache domain. All actions flow through the cache registry (same path
 * as the command palette refresh commands and in-place refresh buttons).
 */
export default function SettingsDataCachesCard() {
  const domains = useSyncExternalStore(subscribeCacheDomains, listCacheDomains);
  const [busyId, setBusyId] = useState(null);
  const [statusText, setStatusText] = useState('');

  const handleRefresh = useCallback(async (domain) => {
    setBusyId(domain.id);
    setStatusText('');
    const result = await refreshCacheDomain(domain.id);
    setBusyId(null);
    setStatusText(
      result.ok ? `${domain.label} refreshed.` : result.error || `Could not refresh ${domain.label}.`
    );
  }, []);

  const handleClearAll = useCallback(async () => {
    setBusyId('__all__');
    setStatusText('');
    const result = await clearAllCacheDomains();
    setBusyId(null);
    setStatusText(
      result.ok
        ? 'All caches cleared — data refetches as you use the app.'
        : `Some caches could not be cleared: ${result.failed.join(', ')}`
    );
  }, []);

  return (
    <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
      <Text variant="desc" className="!mb-4 block">
        Wee caches libraries, catalogs, and derived visuals so the app stays fast. Refresh a
        domain to refetch it now, or clear everything if something looks stale.
      </Text>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {domains.map((domain) => {
          const lastRefreshedAt = getCacheDomainLastRefreshedAt(domain.id);
          return (
            <li
              key={domain.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--wee-radius-rail-item)] border border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-secondary)/0.55)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Text variant="p" className="!m-0 text-sm font-semibold text-[hsl(var(--text-primary))]">
                    {domain.label}
                  </Text>
                  <span className="rounded-full border border-[hsl(var(--border-primary)/0.5)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--text-tertiary))]">
                    {SCOPE_LABELS[domain.scope] || domain.scope}
                  </span>
                </div>
                <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
                  {domain.description} · {formatLastRefreshed(lastRefreshedAt)}
                </Text>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId !== null}
                onClick={() => handleRefresh(domain)}
              >
                <RefreshCcw size={13} aria-hidden />
                {busyId === domain.id ? 'Refreshing…' : 'Refresh'}
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" disabled={busyId !== null} onClick={handleClearAll}>
          <Trash2 size={13} aria-hidden />
          {busyId === '__all__' ? 'Clearing…' : 'Clear all caches'}
        </Button>
        {statusText ? (
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-secondary))]" role="status">
            {statusText}
          </Text>
        ) : null}
      </div>
    </WeeModalFieldCard>
  );
}
