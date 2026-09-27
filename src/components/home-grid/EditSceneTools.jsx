import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Heart, Upload } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  applyWallpaperToPage,
  applyWallpaperToSpace,
  readBoardPageIndex,
  setCycleWallpapers,
  setOverlayPatch,
  setRibbonScope,
  setSpaceBlur,
  setSpaceBrightness,
  setSpaceSaturate,
  setWallpaperMatchEnabled,
  setWallpaperOpacity,
  setWallpaperScope,
} from '../../utils/surfaceSceneActions';
import { OVERLAY_EFFECT_OPTIONS } from '../settings/wallpaper/wallpaperSettingsConstants';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { WeeButton, WeeSegmentedControl, WeeSlider } from '../../ui/wee';
import WToggle from '../../ui/WToggle';

const CHANNEL_BOARD_SPACES = new Set(['home', 'workspaces']);

function appliedWallpaperUrl(state, spaceId) {
  const wp = state.appearanceBySpace?.[spaceId]?.wallpaper || {};
  const perPage = wp.wallpaperScope === 'perPage' && CHANNEL_BOARD_SPACES.has(spaceId);
  if (perPage) {
    const page = readBoardPageIndex(spaceId);
    const byPage = wp.wallpaperByPage || {};
    const pageUrl = byPage[page] || byPage[String(page)];
    if (typeof pageUrl === 'string' && pageUrl.length > 0) return pageUrl;
  }
  if (spaceId !== 'home' && wp.useGlobalWallpaper === false && typeof wp.spaceWallpaperUrl === 'string') {
    return wp.spaceWallpaperUrl;
  }
  return state.wallpaper?.current?.url || null;
}

function LookSlider({ label, value, min, max, step, onChange, format }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <WeeSlider
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-[length:var(--font-size-micro)] font-bold tabular-nums text-[hsl(var(--text-secondary))]">
        {format(value)}
      </span>
    </div>
  );
}

LookSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  format: PropTypes.func.isRequired,
};

/**
 * Wallpaper, look, atmosphere, and ribbon bodies for the edit pill.
 * Writes go through the same helpers Surfaces uses.
 */
function EditSceneTools({ spaceId, tool }) {
  const [status, setStatus] = useState('');
  const scene = useConsolidatedAppStore(
    useShallow((state) => {
      const wp = state.appearanceBySpace?.[spaceId]?.wallpaper || {};
      const hub = spaceId === 'gamehub' || spaceId === 'mediahub';
      const ribbon = state.appearanceBySpace?.[spaceId]?.ribbon || {};
      return {
        opacity: typeof state.wallpaper?.opacity === 'number' ? state.wallpaper.opacity : 1,
        blur: typeof wp.spaceBlur === 'number'
          ? wp.spaceBlur
          : spaceId === 'home'
            ? Number(state.wallpaper?.blur) || 0
            : 0,
        brightness: typeof wp.spaceBrightness === 'number'
          ? wp.spaceBrightness
          : hub
            ? Number(state.wallpaper?.gameHubBrightness) || 0.78
            : Number(state.wallpaper?.workspaceBrightness) || 1,
        saturate: typeof wp.spaceSaturate === 'number'
          ? wp.spaceSaturate
          : hub
            ? Number(state.wallpaper?.gameHubSaturate) || 1
            : Number(state.wallpaper?.workspaceSaturate) || 1,
        wallpaperScope: wp.wallpaperScope === 'perPage' ? 'perPage' : 'space',
        ribbonScope: ribbon.ribbonScope === 'perPage' ? 'perPage' : 'space',
        overlayEnabled: Boolean(state.overlay?.enabled),
        overlayEffect: state.overlay?.effect || 'snow',
        overlayIntensity: typeof state.overlay?.intensity === 'number' ? state.overlay.intensity : 40,
        cycle: Boolean(state.wallpaper?.cycleWallpapers),
        match: state.ui?.wallpaperMatchEnabled !== false,
        saved: Array.isArray(state.wallpaper?.savedWallpapers) ? state.wallpaper.savedWallpapers : [],
        liked: Array.isArray(state.wallpaper?.likedWallpapers) ? state.wallpaper.likedWallpapers : [],
        appliedUrl: appliedWallpaperUrl(state, spaceId),
      };
    })
  );

  const supportsPerPage = CHANNEL_BOARD_SPACES.has(spaceId);

  const refreshLibrary = useCallback(async () => {
    const data = await window.api?.wallpapers?.get?.();
    if (!data) return;
    useConsolidatedAppStore.getState().actions.setWallpaperState({
      savedWallpapers: Array.isArray(data.savedWallpapers) ? data.savedWallpapers : [],
      likedWallpapers: Array.isArray(data.likedWallpapers) ? data.likedWallpapers : [],
    });
  }, []);

  useEffect(() => {
    if (tool !== 'wallpaper') return undefined;
    let cancelled = false;
    refreshLibrary().catch(() => {
      if (!cancelled) setStatus('Could not load wallpapers.');
    });
    return () => {
      cancelled = true;
    };
  }, [tool, refreshLibrary]);

  const handleApply = useCallback(async (wallpaper) => {
    setStatus('');
    try {
      if (supportsPerPage && scene.wallpaperScope === 'perPage') {
        applyWallpaperToPage(spaceId, readBoardPageIndex(spaceId), wallpaper?.url || null);
        return;
      }
      const result = await applyWallpaperToSpace(spaceId, wallpaper);
      if (!result.ok) setStatus(result.error || 'Could not apply wallpaper.');
    } catch (err) {
      setStatus(err?.message || 'Could not apply wallpaper.');
    }
  }, [scene.wallpaperScope, spaceId, supportsPerPage]);

  const handleUpload = useCallback(async () => {
    setStatus('');
    try {
      const fileResult = await window.api?.selectWallpaperFile?.();
      if (!fileResult?.success) return;
      const file = fileResult.file;
      const addResult = await window.api?.wallpapers?.add?.({
        filePath: file.path,
        filename: file.name,
      });
      if (!addResult?.success) {
        setStatus(addResult?.error || 'Upload failed.');
        return;
      }
      await refreshLibrary();
    } catch (err) {
      setStatus(err?.message || 'Upload failed.');
    }
  }, [refreshLibrary]);

  const handleLike = useCallback(async (url) => {
    const result = await window.api?.wallpapers?.toggleLike?.({ url });
    if (result?.success) {
      useConsolidatedAppStore.getState().actions.setWallpaperState({
        likedWallpapers: result.likedWallpapers || [],
      });
    }
  }, []);

  if (tool === 'wallpaper') {
    return (
      <div className="flex max-h-[min(36vh,16rem)] flex-col gap-2.5 overflow-y-auto px-1 pb-1 pt-2.5">
        {supportsPerPage ? (
          <WeeSegmentedControl
            size="sm"
            ariaLabel="Wallpaper scope"
            layoutId="editSceneWallpaperScope"
            value={scene.wallpaperScope}
            onChange={(scope) => setWallpaperScope(spaceId, scope)}
            options={[
              { value: 'space', label: 'This space' },
              { value: 'perPage', label: 'This page' },
            ]}
          />
        ) : null}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {scene.saved.map((wallpaper) => {
            const url = wallpaper?.url;
            if (!url) return null;
            const liked = scene.liked.includes(url);
            const applied = scene.appliedUrl === url;
            return (
              <div key={url} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => handleApply(wallpaper)}
                  title={wallpaper.name || 'Wallpaper'}
                  aria-label={applied ? 'Applied wallpaper' : 'Apply wallpaper'}
                  aria-pressed={applied}
                  className={`h-16 w-24 overflow-hidden rounded-2xl border-2 bg-[hsl(var(--surface-elevated))] ${
                    applied
                      ? 'border-[hsl(var(--primary))]'
                      : 'border-[hsl(var(--border-primary)/0.35)]'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => handleLike(url)}
                  aria-label={liked ? 'Unlike wallpaper' : 'Like wallpaper'}
                  aria-pressed={liked}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.88)] text-[hsl(var(--text-primary))]"
                >
                  <Heart
                    size={12}
                    strokeWidth={2.5}
                    className={liked ? 'fill-[hsl(var(--primary))] text-[hsl(var(--primary))]' : ''}
                  />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <WeeButton variant="secondary" size="sm" onClick={handleUpload}>
            <span className="flex items-center gap-1.5">
              <Upload size={13} strokeWidth={2.5} aria-hidden />
              Upload
            </span>
          </WeeButton>
          {status ? (
            <span className="text-[length:var(--font-size-micro)] font-bold text-[hsl(var(--text-secondary))]">
              {status}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (tool === 'look') {
    return (
      <div className="flex flex-col gap-2.5 px-1 pb-1 pt-2.5">
        <LookSlider
          label="Opacity"
          min={0}
          max={1}
          step={0.01}
          value={scene.opacity}
          onChange={setWallpaperOpacity}
          format={(value) => `${Math.round(value * 100)}%`}
        />
        <LookSlider
          label="Blur"
          min={0}
          max={24}
          step={0.5}
          value={scene.blur}
          onChange={(value) => setSpaceBlur(spaceId, value)}
          format={(value) => String(Math.round(value))}
        />
        <LookSlider
          label="Brightness"
          min={0.45}
          max={1.2}
          step={0.01}
          value={scene.brightness}
          onChange={(value) => setSpaceBrightness(spaceId, value)}
          format={(value) => `${Math.round(value * 100)}%`}
        />
        <LookSlider
          label="Saturation"
          min={0}
          max={1.5}
          step={0.02}
          value={scene.saturate}
          onChange={(value) => setSpaceSaturate(spaceId, value)}
          format={(value) => `${Math.round(value * 100)}%`}
        />
      </div>
    );
  }

  if (tool === 'atmosphere') {
    return (
      <div className="flex flex-col gap-2.5 px-1 pb-1 pt-2.5">
        <WToggle
          checked={scene.overlayEnabled}
          onChange={(value) => setOverlayPatch({ enabled: Boolean(value) })}
          label="Particles"
        />
        <div className="flex flex-wrap justify-center gap-1.5">
          {OVERLAY_EFFECT_OPTIONS.map((option) => (
            <WeeButton
              key={option.value}
              variant={scene.overlayEffect === option.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setOverlayPatch({ effect: option.value, enabled: true })}
            >
              {option.label}
            </WeeButton>
          ))}
        </div>
        <LookSlider
          label="Intensity"
          min={10}
          max={100}
          step={5}
          value={scene.overlayIntensity}
          onChange={(value) => setOverlayPatch({ intensity: value })}
          format={(value) => String(Math.round(value))}
        />
        {spaceId === 'home' ? (
          <WToggle
            checked={scene.cycle}
            onChange={(value) => setCycleWallpapers(Boolean(value))}
            label="Cycle wallpapers"
          />
        ) : null}
      </div>
    );
  }

  if (tool === 'ribbon') {
    return (
      <div className="flex flex-col items-center gap-2.5 px-1 pb-1 pt-2.5">
        {supportsPerPage ? (
          <WeeSegmentedControl
            size="sm"
            ariaLabel="Ribbon scope"
            layoutId="editSceneRibbonScope"
            value={scene.ribbonScope}
            onChange={(scope) => setRibbonScope(spaceId, scope)}
            options={[
              { value: 'space', label: 'This space' },
              { value: 'perPage', label: 'This page' },
            ]}
          />
        ) : null}
        <WToggle
          checked={scene.match}
          onChange={(value) => {
            setWallpaperMatchEnabled(Boolean(value));
          }}
          label="Match wallpaper"
        />
        <WeeButton
          variant="secondary"
          size="sm"
          onClick={() => openSettingsToTab(SETTINGS_TAB_ID.DOCK)}
        >
          Ribbon colors
        </WeeButton>
      </div>
    );
  }

  return null;
}

EditSceneTools.propTypes = {
  spaceId: PropTypes.string.isRequired,
  tool: PropTypes.string,
};

export default React.memo(EditSceneTools);
