import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowLeft, Copy, Download, ExternalLink, MonitorPlay, Sparkles, Store } from 'lucide-react';
import WeeModalShell from '../../ui/wee/WeeModalShell';
import WButton from '../../ui/WButton';
import WToggle from '../../ui/WToggle';
import MediaHubStreamPlayer from './MediaHubStreamPlayer';
import { getResolvableStreamUri } from '../../utils/mediaHubStreamUri';
import { PLAYFUL_SPRINGS } from '../../design/playfulMotion';

const MotionDiv = m.div;

const STAGGER = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};

const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 28, mass: 0.65 },
  },
};

/** Conservative: progressive / simple URLs only (HLS may still fail in-app). */
export function isLikelyDirectHttpVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const path = u.pathname.toLowerCase();
    return /\.(mp4|webm|ogv|m4v|mkv)(\?|$)/i.test(path) || /\.m3u8(\?|$)/i.test(path);
  } catch {
    return false;
  }
}

function getStreamUri(stream) {
  return getResolvableStreamUri(stream);
}

async function openExternalResolved(url) {
  const api = window.api;
  if (api?.openExternalWithResult) {
    return api.openExternalWithResult(url);
  }
  try {
    api?.openExternal?.(url);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

async function launchExeWithUri(exePath, extraArgs, uri) {
  const prefix = extraArgs?.trim() ? `${extraArgs.trim()} ` : '';
  const payloadPath = `"${exePath}" ${prefix}"${uri}"`;
  return window.api?.launchApp?.({ type: 'exe', path: payloadPath, asAdmin: false });
}

/** Official download; Store listing may change — https URL is stable. */
const VLC_DOWNLOAD_URL = 'https://www.videolan.org/vlc/';
/** Microsoft Store web → can open Store app on Windows */
const VLC_STORE_WEB_URL = 'https://apps.microsoft.com/store/detail/xpdm1zw5bqcsm2';

export default function MediaHubStreamOpenModal({
  isOpen,
  onClose,
  onExitAnimationComplete,
  stream,
  normalizeStreamLabel,
  preferredPlayerPath,
  preferredPlayerArgs,
  onSavePreferredPlayer,
  onOpenedSuccessfully,
  mediaTitle,
}) {
  const [step, setStep] = useState('choose');
  const [statusMessage, setStatusMessage] = useState('');
  const [playerError, setPlayerError] = useState('');
  const [saveBrowseAsDefault, setSaveBrowseAsDefault] = useState(true);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);

  const uri = useMemo(() => (stream ? getStreamUri(stream) : ''), [stream]);
  const label = useMemo(() => (stream ? normalizeStreamLabel(stream) : ''), [stream, normalizeStreamLabel]);
  const canInlinePlay = useMemo(() => isLikelyDirectHttpVideoUrl(uri), [uri]);
  const isMagnet = useMemo(() => /^magnet:/i.test(uri), [uri]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('choose');
    setStatusMessage('');
    setPlayerError('');
  }, [isOpen, stream]);

  useEffect(() => {
    if (!isOpen || !window.api?.mediaHub?.detectSuggestedPlayers) {
      setSuggestedPlayers([]);
      return undefined;
    }
    let cancelled = false;
    window.api.mediaHub
      .detectSuggestedPlayers()
      .then((res) => {
        if (!cancelled && res?.success && Array.isArray(res.players)) {
          setSuggestedPlayers(res.players);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestedPlayers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, stream]);

  const notifySuccess = useCallback(() => {
    onOpenedSuccessfully?.();
  }, [onOpenedSuccessfully]);

  const handleOpenWindowsDefault = useCallback(async () => {
    if (!uri) {
      setStatusMessage('This source has no link to open.');
      return;
    }
    setStatusMessage('');
    const result = await openExternalResolved(uri);
    if (result?.ok !== false) {
      notifySuccess();
      onClose();
      return;
    }
    setStatusMessage(result?.error || 'Could not open with the system default.');
  }, [uri, notifySuccess, onClose]);

  const handleOpenWithSavedPlayer = useCallback(async () => {
    if (!uri) {
      setStatusMessage('This source has no link to open.');
      return;
    }
    if (!preferredPlayerPath) {
      setStatusMessage('Choose a preferred player in the header first, or use Browse app.');
      return;
    }
    setStatusMessage('');
    const result = await launchExeWithUri(preferredPlayerPath, preferredPlayerArgs, uri);
    if (result?.ok !== false) {
      notifySuccess();
      onClose();
      return;
    }
    setStatusMessage(result?.error || 'Could not launch with your saved player.');
  }, [uri, preferredPlayerPath, preferredPlayerArgs, notifySuccess, onClose]);

  const handleBrowseAndOpen = useCallback(async () => {
    if (!uri) {
      setStatusMessage('This source has no link to open.');
      return;
    }
    const pick = await window.api?.selectExeOrShortcutFile?.();
    if (!pick?.success || !pick.file?.path) return;
    const exePath = pick.file.path;
    const args = pick.file.args || '';
    setStatusMessage('');
    const result = await launchExeWithUri(exePath, args, uri);
    if (result?.ok !== false) {
      if (saveBrowseAsDefault) {
        onSavePreferredPlayer?.(exePath, args);
      }
      notifySuccess();
      onClose();
      return;
    }
    setStatusMessage(result?.error || 'Could not launch with the selected app.');
  }, [uri, saveBrowseAsDefault, onSavePreferredPlayer, notifySuccess, onClose]);

  const handleCopy = useCallback(async () => {
    if (!uri || !navigator?.clipboard?.writeText) {
      setStatusMessage('Could not copy link.');
      return;
    }
    try {
      await navigator.clipboard.writeText(uri);
      setStatusMessage('Link copied to clipboard.');
    } catch {
      setStatusMessage('Could not copy link.');
    }
  }, [uri]);

  const handleOpenWithSuggestedExe = useCallback(
    async (exePath) => {
      if (!uri || !exePath) return;
      setStatusMessage('');
      const result = await launchExeWithUri(exePath, '', uri);
      if (result?.ok !== false) {
        notifySuccess();
        onClose();
        return;
      }
      setStatusMessage(result?.error || 'Could not launch with this app.');
    },
    [uri, notifySuccess, onClose]
  );

  const handleWindowsSystemOpenWith = useCallback(async () => {
    if (!uri || !window.api?.mediaHub?.openWithWindowsDialog) {
      setStatusMessage('Open With is not available.');
      return;
    }
    setStatusMessage('');
    const result = await window.api.mediaHub.openWithWindowsDialog({ uri });
    if (result?.success) {
      // No notifySuccess — user may cancel the system dialog; we only launched the picker.
      onClose();
      return;
    }
    setStatusMessage(result?.error || 'Could not open the Windows “Open with” dialog.');
  }, [uri, onClose]);

  const handleOpenVlcDownload = useCallback(async () => {
    const r = await openExternalResolved(VLC_DOWNLOAD_URL);
    if (r?.ok === false) setStatusMessage(r?.error || 'Could not open browser.');
  }, []);

  const handleOpenVlcStore = useCallback(async () => {
    const r = await openExternalResolved(VLC_STORE_WEB_URL);
    if (r?.ok === false) setStatusMessage(r?.error || 'Could not open Store.');
  }, []);

  if (!stream) {
    return null;
  }

  const subtitle = mediaTitle ? `${mediaTitle} · ${label}` : label;

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={onClose}
      onExitAnimationComplete={onExitAnimationComplete}
      headerTitle="How do you want to watch?"
      showRail={false}
      maxWidth="min(520px, 96vw)"
      className="!max-w-[min(520px,96vw)]"
      panelClassName="!bg-[hsl(var(--wee-surface-well))]"
      footerContent={null}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-2xl border-2 border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.45)] p-4">
          <Sparkles className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" size={22} aria-hidden />
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
              Stream source
            </p>
            <p className="m-0 mt-1 font-mono text-[11px] leading-snug text-[hsl(var(--text-secondary))] break-all">{subtitle}</p>
            {isMagnet ? (
              <p className="m-0 mt-2 text-[12px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Magnet links open in your default torrent app. You can use Windows’ “Open with” picker, VLC, or
                another installed player below.
              </p>
            ) : canInlinePlay ? (
              <p className="m-0 mt-2 text-[12px] leading-relaxed text-[hsl(var(--text-secondary))]">
                This link may play inside Wee if it is a direct stream. Other links work best with VLC or Windows.
              </p>
            ) : (
              <p className="m-0 mt-2 text-[12px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Many Torrentio links are not direct video files. Use Windows default or pick VLC / another app to open.
              </p>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'player' && canInlinePlay && uri ? (
            <MotionDiv
              key="player"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={PLAYFUL_SPRINGS.modalEnter}
              className="overflow-hidden rounded-2xl border border-[hsl(var(--border-primary)/0.45)]"
            >
              <MediaHubStreamPlayer
                url={uri}
                title={label}
                onClose={() => {
                  setPlayerError('');
                  setStep('choose');
                }}
                onPlaybackError={(msg) => setPlayerError(msg)}
              />
              {playerError ? (
                <p className="m-0 border-t border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.6)] px-3 py-2 text-[11px] text-[hsl(var(--state-warning))]">
                  {playerError}
                </p>
              ) : null}
              <div className="border-t border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-shell))] p-3">
                <WButton variant="secondary" size="sm" fullWidth type="button" onClick={() => setStep('choose')}>
                  <ArrowLeft size={16} className="mr-2 inline" aria-hidden />
                  Back to options
                </WButton>
              </div>
            </MotionDiv>
          ) : (
            <MotionDiv
              key="chooser"
              variants={STAGGER}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {canInlinePlay ? (
                <MotionDiv variants={ITEM}>
                  <WButton
                    variant="primary"
                    fullWidth
                    type="button"
                    onClick={() => {
                      setPlayerError('');
                      setStep('player');
                    }}
                  >
                    <MonitorPlay size={18} className="mr-2 inline" aria-hidden />
                    Play in Wee
                  </WButton>
                </MotionDiv>
              ) : null}

              {suggestedPlayers.length > 0 ? (
                <MotionDiv variants={ITEM} className="rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.35)] p-3">
                  <p className="m-0 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
                    On this PC
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {suggestedPlayers.map((p) => (
                      <WButton
                        key={p.path}
                        variant="secondary"
                        size="sm"
                        fullWidth
                        type="button"
                        onClick={() => handleOpenWithSuggestedExe(p.path)}
                      >
                        Open with {p.label}
                      </WButton>
                    ))}
                  </div>
                </MotionDiv>
              ) : null}

              <MotionDiv variants={ITEM}>
                <WButton variant="secondary-strong" fullWidth type="button" onClick={handleWindowsSystemOpenWith}>
                  <MonitorPlay size={18} className="mr-2 inline" aria-hidden />
                  Windows “Open with” picker…
                </WButton>
                <p className="m-0 mt-2 text-[11px] leading-relaxed text-[hsl(var(--text-tertiary))]">
                  Opens the same style of system dialog Windows uses for files (we save a tiny temp playlist or magnet
                  file so Windows can list compatible apps). Appearance varies by Windows version.
                </p>
              </MotionDiv>

              <MotionDiv variants={ITEM}>
                <WButton variant="secondary-strong" fullWidth type="button" onClick={handleOpenWindowsDefault}>
                  <ExternalLink size={18} className="mr-2 inline" aria-hidden />
                  Open with Windows default
                </WButton>
              </MotionDiv>

              <MotionDiv variants={ITEM}>
                <WButton
                  variant="secondary"
                  fullWidth
                  type="button"
                  disabled={!preferredPlayerPath}
                  onClick={handleOpenWithSavedPlayer}
                  title={!preferredPlayerPath ? 'Set a preferred player in the Media Hub header first' : undefined}
                >
                  Open with saved player
                  {preferredPlayerPath ? (
                    <span className="ml-2 truncate text-[11px] font-bold uppercase tracking-wide opacity-90">
                      ({preferredPlayerPath.split(/[/\\]/).pop()})
                    </span>
                  ) : null}
                </WButton>
              </MotionDiv>

              <MotionDiv variants={ITEM} className="rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.35)] p-3">
                <WToggle
                  checked={saveBrowseAsDefault}
                  onChange={setSaveBrowseAsDefault}
                  label="Save chosen app as default player"
                  containerClassName="mb-3"
                />
                <WButton variant="tertiary" fullWidth type="button" onClick={handleBrowseAndOpen}>
                  Choose app & open…
                </WButton>
              </MotionDiv>

              <MotionDiv variants={ITEM} className="rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.25)] p-3">
                <p className="m-0 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
                  Need a player?
                </p>
                <p className="m-0 mt-1 text-[11px] leading-relaxed text-[hsl(var(--text-secondary))]">
                  We can’t install apps automatically from here, but you can grab VLC (popular and free) or use the
                  Microsoft Store listing.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <WButton variant="tertiary" size="sm" fullWidth type="button" onClick={handleOpenVlcDownload}>
                    <Download size={16} className="mr-2 inline" aria-hidden />
                    Get VLC (download)
                  </WButton>
                  <WButton variant="tertiary" size="sm" fullWidth type="button" onClick={handleOpenVlcStore}>
                    <Store size={16} className="mr-2 inline" aria-hidden />
                    VLC in Microsoft Store
                  </WButton>
                </div>
              </MotionDiv>

              <MotionDiv variants={ITEM}>
                <WButton variant="tertiary" fullWidth type="button" onClick={handleCopy}>
                  <Copy size={16} className="mr-2 inline" aria-hidden />
                  Copy link
                </WButton>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>

        {statusMessage ? (
          <p className="m-0 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </WeeModalShell>
  );
}

MediaHubStreamOpenModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExitAnimationComplete: PropTypes.func,
  stream: PropTypes.object,
  normalizeStreamLabel: PropTypes.func.isRequired,
  preferredPlayerPath: PropTypes.string,
  preferredPlayerArgs: PropTypes.string,
  onSavePreferredPlayer: PropTypes.func,
  onOpenedSuccessfully: PropTypes.func,
  mediaTitle: PropTypes.string,
};

MediaHubStreamOpenModal.defaultProps = {
  onExitAnimationComplete: undefined,
  stream: null,
  preferredPlayerPath: '',
  preferredPlayerArgs: '',
  onSavePreferredPlayer: undefined,
  onOpenedSuccessfully: undefined,
  mediaTitle: '',
};
