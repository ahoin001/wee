import React, { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  PERFORMANCE_CONTROLS,
  PERFORMANCE_SECTIONS,
  applyPerformanceProfile,
  markPerformanceProfileCustom,
  normalizePerformanceProfile,
  setPerformanceControl,
} from '../../utils/performanceControls';
import { openSettingsToTab } from '../../utils/settingsNavigation';
import {
  WeeHelpLinkButton,
  WeeModalFieldCard,
  WeeMorphStack,
  WeeRevealWhen,
  WeeSegmentedControl,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsWeeSection from './SettingsWeeSection';
import SettingsToggleFieldCard from './SettingsToggleFieldCard';
import SettingsDataCachesCard from './SettingsDataCachesCard';

const PROFILE_OPTIONS = [
  { value: 'smooth', label: 'Smooth', title: 'Prioritize fluidity — turn down heavy FX' },
  { value: 'balanced', label: 'Balanced', title: 'Good default for all-day use' },
  { value: 'max', label: 'Max', title: 'Turn atmosphere and attract up' },
  { value: 'custom', label: 'Custom', title: 'Manual mix of controls' },
];

const COST_LABEL = {
  high: 'High cost',
  medium: 'Medium cost',
  low: 'Low cost',
};

const COST_CLASS = {
  high: 'border-[hsl(var(--state-error)/0.45)] text-[hsl(var(--state-error))]',
  medium: 'border-[hsl(var(--state-warning)/0.45)] text-[hsl(var(--state-warning))]',
  low: 'border-[hsl(var(--border-primary)/0.55)] text-[hsl(var(--text-tertiary))]',
};

function CostBadge({ cost }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
        COST_CLASS[cost] || COST_CLASS.low
      }`}
    >
      {COST_LABEL[cost] || cost}
    </span>
  );
}

const PerformanceSettingsTab = React.memo(() => {
  const snapshot = useConsolidatedAppStore(
    useShallow((state) => {
      const values = {};
      for (const control of PERFORMANCE_CONTROLS) {
        values[control.id] = control.get(state);
      }
      return {
        values,
        performanceProfile: normalizePerformanceProfile(state.ui?.performanceProfile),
      };
    })
  );

  const [lastChanges, setLastChanges] = useState(null);

  const handleProfileChange = useCallback((profileId) => {
    if (profileId === 'custom') {
      markPerformanceProfileCustom();
      setLastChanges(null);
      return;
    }
    const result = applyPerformanceProfile(profileId);
    setLastChanges(result.changes);
  }, []);

  const handleToggle = useCallback((controlId, next) => {
    setPerformanceControl(controlId, next);
    setLastChanges(null);
  }, []);

  const handleSelect = useCallback((controlId, next) => {
    setPerformanceControl(controlId, next);
    setLastChanges(null);
  }, []);

  const sections = useMemo(() => {
    return PERFORMANCE_SECTIONS.map((section) => ({
      ...section,
      controls: PERFORMANCE_CONTROLS.filter((c) => c.section === section.id),
    })).filter((s) => s.controls.length > 0);
  }, []);

  const showWhatChanged = Array.isArray(lastChanges) && lastChanges.length > 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-12">
      <SettingsTabPageHeader
        title="Performance"
        subtitle="One place to dial back cost and keep Wee smooth all day"
      />

      <SettingsWeeSection eyebrow="Profiles">
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-6 md:p-8">
          <Text variant="h3" className="m-0 text-[hsl(var(--text-primary))]">
            Performance profile
          </Text>
          <Text variant="desc" className="mt-1 block">
            Profiles only flip existing switches — they do not invent a second settings store.
            Choosing Custom after a profile means you edited a row yourself.
          </Text>
          <div className="mt-5">
            <WeeSegmentedControl
              ariaLabel="Performance profile"
              value={snapshot.performanceProfile}
              onChange={handleProfileChange}
              options={PROFILE_OPTIONS}
              wrap
              className="w-full min-w-0 justify-start"
              layoutId="perfProfileSegment"
            />
          </div>

          <WeeMorphStack open={showWhatChanged} className="mt-4" gapOpen="gap-3" gapClosed="gap-0">
            <WeeRevealWhen when={showWhatChanged} keepMounted={false}>
              <div
                className="rounded-[var(--wee-radius-rail-item)] border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] p-4"
                role="status"
              >
                <Text variant="p" className="!m-0 text-sm font-semibold text-[hsl(var(--text-primary))]">
                  What this profile changed
                </Text>
                <ul className="mt-2 m-0 list-none space-y-1.5 p-0">
                  {lastChanges?.map((change) => (
                    <li
                      key={change.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-[hsl(var(--text-secondary))]"
                    >
                      <span>{change.title}</span>
                      <span className="font-medium text-[hsl(var(--text-primary))]">
                        {change.from} → {change.to}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </WeeRevealWhen>
          </WeeMorphStack>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      {sections.map((section) => (
        <SettingsWeeSection key={section.id} eyebrow={section.title}>
          {section.controls.map((control) => {
            const value = snapshot.values[control.id];
            const learnMore = control.learnMore ? (
              <WeeHelpLinkButton
                className="!mt-2"
                onClick={() => openSettingsToTab(control.learnMore.tabId, control.learnMore.options)}
              >
                Learn more
              </WeeHelpLinkButton>
            ) : null;

            if (control.kind === 'select') {
              return (
                <WeeModalFieldCard
                  key={control.id}
                  hoverAccent="none"
                  paddingClassName="p-6 md:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Text variant="h3" className="m-0 text-[hsl(var(--text-primary))]">
                          {control.title}
                        </Text>
                        <CostBadge cost={control.cost} />
                      </div>
                      <Text variant="desc" className="mt-1 block">
                        {control.desc}
                      </Text>
                      {learnMore}
                    </div>
                  </div>
                  <div className="mt-4">
                    <WeeSegmentedControl
                      ariaLabel={control.title}
                      value={value}
                      onChange={(next) => handleSelect(control.id, next)}
                      options={control.options}
                      size="sm"
                      wrap
                      className="w-full min-w-0 justify-start"
                      layoutId={`perfSelect-${control.id}`}
                    />
                  </div>
                </WeeModalFieldCard>
              );
            }

            return (
              <SettingsToggleFieldCard
                key={control.id}
                title={
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span>{control.title}</span>
                    <CostBadge cost={control.cost} />
                  </span>
                }
                desc={
                  <>
                    {control.desc}
                    {learnMore}
                  </>
                }
                checked={Boolean(value)}
                onChange={(next) => handleToggle(control.id, next)}
              />
            );
          })}
        </SettingsWeeSection>
      ))}

      <SettingsWeeSection eyebrow="Data & caches">
        <Text variant="caption" className="!mb-3 block text-[hsl(var(--text-tertiary))]">
          Smooth reduces background FX — it does not clear library caches. Image warm runs on idle
          after libraries load.
        </Text>
        <SettingsDataCachesCard />
      </SettingsWeeSection>
    </div>
  );
});

PerformanceSettingsTab.displayName = 'PerformanceSettingsTab';

export default PerformanceSettingsTab;
