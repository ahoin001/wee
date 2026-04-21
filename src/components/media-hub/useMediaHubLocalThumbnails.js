import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const THUMB_CACHE_MAX = 300;
const VISIBLE_PREFETCH_PAD = 12;

export function useMediaHubLocalThumbnails({
  activeSpaceId,
  activeTab,
  filteredLocal,
}) {
  const thumbMtimeRef = useRef(new Map());
  const inFlightByPathRef = useRef(new Map());
  const thumbnailByPathRef = useRef({});
  const [thumbnailByPath, setThumbnailByPath] = useState({});
  const [visibleLocalRange, setVisibleLocalRange] = useState({ startIndex: 0, endIndex: 0 });

  const handleLocalVisibleRangeChange = useCallback(({ startIndex, endIndex }) => {
    setVisibleLocalRange((prev) => {
      if (prev.startIndex === startIndex && prev.endIndex === endIndex) return prev;
      return { startIndex, endIndex };
    });
  }, []);

  useEffect(() => {
    thumbnailByPathRef.current = thumbnailByPath;
  }, [thumbnailByPath]);

  const visibleLocalPathSignature = useMemo(() => {
    if (!filteredLocal.length) return '';
    const startPad = Math.max(0, visibleLocalRange.startIndex - VISIBLE_PREFETCH_PAD);
    const endPad = Math.min(
      filteredLocal.length - 1,
      visibleLocalRange.endIndex + VISIBLE_PREFETCH_PAD
    );
    let sig = '';
    for (let i = startPad; i <= endPad; i += 1) {
      const f = filteredLocal[i];
      if (!f?.path) continue;
      sig += `${f.path}\0${f.modifiedAt || ''}|`;
    }
    return sig;
  }, [filteredLocal, visibleLocalRange.startIndex, visibleLocalRange.endIndex]);

  useEffect(() => {
    if (activeSpaceId !== 'mediahub' || activeTab !== 'local') return undefined;
    const api = window.api?.mediaHub?.getFileThumbnail;
    if (typeof api !== 'function') return undefined;

    const allPaths = new Set(filteredLocal.map((f) => f.path).filter(Boolean));
    for (const p of thumbMtimeRef.current.keys()) {
      if (!allPaths.has(p)) thumbMtimeRef.current.delete(p);
    }

    const startPad = Math.max(0, visibleLocalRange.startIndex - VISIBLE_PREFETCH_PAD);
    const endPad = Math.min(
      filteredLocal.length - 1,
      visibleLocalRange.endIndex + VISIBLE_PREFETCH_PAD
    );
    const visiblePaths = new Set();
    for (let i = startPad; i <= endPad; i += 1) {
      const p = filteredLocal[i]?.path;
      if (p) visiblePaths.add(p);
    }

    setThumbnailByPath((prev) => {
      const prevKeys = Object.keys(prev);
      if (!prevKeys.length) return prev;
      let changed = false;
      const next = { ...prev };
      for (const k of prevKeys) {
        if (!allPaths.has(k)) {
          delete next[k];
          changed = true;
        }
      }
      const remaining = Object.keys(next);
      if (remaining.length > THUMB_CACHE_MAX) {
        const overflow = remaining.length - THUMB_CACHE_MAX;
        let removed = 0;
        for (const k of remaining) {
          if (removed >= overflow) break;
          if (visiblePaths.has(k)) continue;
          delete next[k];
          removed += 1;
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    let cancelled = false;
    const queue = [];
    for (let i = startPad; i <= endPad; i += 1) {
      const file = filteredLocal[i];
      if (!file?.path) continue;
      if (inFlightByPathRef.current.has(file.path)) continue;
      const m = file.modifiedAt || '';
      if (
        thumbMtimeRef.current.get(file.path) === m &&
        thumbnailByPathRef.current[file.path]
      ) {
        continue;
      }
      queue.push(file);
    }

    let active = 0;
    const maxConcurrent = 3;

    const pump = () => {
      if (cancelled) return;
      while (active < maxConcurrent && queue.length > 0) {
        const file = queue.shift();
        if (!file?.path) continue;
        active += 1;
        const req = api({ filePath: file.path, maxWidth: 400, maxHeight: 400 });
        inFlightByPathRef.current.set(file.path, req);
        req
          .then((res) => {
            if (cancelled) return;
            if (res?.success && res?.fileUrl) {
              thumbMtimeRef.current.set(file.path, file.modifiedAt || '');
              setThumbnailByPath((prev) => {
                if (prev[file.path] === res.fileUrl) return prev;
                return { ...prev, [file.path]: res.fileUrl };
              });
            }
          })
          .finally(() => {
            inFlightByPathRef.current.delete(file.path);
            active -= 1;
            if (!cancelled) pump();
          });
      }
    };

    pump();
    return () => {
      cancelled = true;
    };
  }, [activeSpaceId, activeTab, visibleLocalPathSignature, filteredLocal, visibleLocalRange]);

  return {
    thumbnailByPath,
    handleLocalVisibleRangeChange,
  };
}

export default useMediaHubLocalThumbnails;
