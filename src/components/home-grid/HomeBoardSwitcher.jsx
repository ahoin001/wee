import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LayoutTemplate } from 'lucide-react';
import { WeeButton, WeeSectionEyebrow } from '../../ui/wee';
import WSelect from '../../ui/WSelect';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

/**
 * Thin "load a template" switcher for the live Home board: picks one of the swappable
 * second-space channel layouts (`secondaryChannelProfiles`) and one-shot copies its grid
 * onto `dataBySpace.home` via `applySecondaryChannelProfileToHome`. Home stays the SSOT
 * afterwards — this does not create a live link between the two spaces.
 */
function HomeBoardSwitcher() {
  const { secondaryChannelProfiles, applySecondaryChannelProfileToHome } = useConsolidatedAppStore(
    useShallow((state) => ({
      secondaryChannelProfiles: state.channels.secondaryChannelProfiles,
      applySecondaryChannelProfileToHome: state.actions.applySecondaryChannelProfileToHome,
    }))
  );

  const profilesList = useMemo(() => {
    const map = secondaryChannelProfiles || {};
    return Object.values(map).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [secondaryChannelProfiles]);

  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');

  if (profilesList.length === 0) return null;

  const effectiveId = selectedId && profilesList.some((p) => p.id === selectedId)
    ? selectedId
    : profilesList[0].id;

  const handleApply = () => {
    const profile = profilesList.find((p) => p.id === effectiveId);
    if (!profile) return;
    applySecondaryChannelProfileToHome(profile.id);
    setStatus(`Loaded "${profile.name}" onto the Home board.`);
  };

  return (
    <div className="flex flex-col gap-2 rounded-[1.5rem] border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.55)] p-4 md:p-5">
      <div className="flex items-center gap-2">
        <LayoutTemplate size={15} className="text-[hsl(var(--primary))]" aria-hidden />
        <WeeSectionEyebrow trackingClassName="tracking-[0.14em]">Load a template</WeeSectionEyebrow>
      </div>
      <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
        Copy a saved second-space channel layout onto Home. Home stays what you edit afterward.
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[10rem] flex-1">
          <WSelect
            options={profilesList.map((p) => ({ value: p.id, label: p.name || 'Untitled layout' }))}
            value={effectiveId}
            onChange={(id) => setSelectedId(id)}
            placeholder="Pick a saved layout…"
          />
        </div>
        <WeeButton variant="primary" className="!px-4 !py-2" onClick={handleApply}>
          Use as Home board
        </WeeButton>
      </div>
      {status ? (
        <Text variant="caption" className="!m-0 text-[hsl(var(--text-secondary))]" role="status">
          {status}
        </Text>
      ) : null}
    </div>
  );
}

export default React.memo(HomeBoardSwitcher);
