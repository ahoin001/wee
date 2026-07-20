import React from 'react';
import { FlaskConical } from 'lucide-react';
import Text from '../../ui/Text';
import { WeeModalFieldCard, WeeSectionEyebrow } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import ImmersiveSoundModeSettingsSection from '../../features/immersiveSoundMode/ImmersiveSoundModeSettingsSection.jsx';
/** BETA: Scene FX — remove with `src/features/sceneFxBeta/`. */
import SceneFxBetaSettingsSection from '../../features/sceneFxBeta/SceneFxBetaSettingsSection.jsx';
import './surfaceStyles.css';

/**
 * Beta experiments tab.
 *
 * REMOVABLE modules (each has its own README):
 * - `src/features/immersiveSoundMode/`
 * - `src/features/sceneFxBeta/`
 */
const BetaSettingsTab = React.memo(() => {
  return (
    <div className="space-y-8">
      <SettingsTabPageHeader
        title="Beta"
        subtitle="Experimental features — easy to turn off or remove"
      />

      <WeeModalFieldCard className="flex items-start gap-3 p-5 md:p-6" hoverAccent="primary">
        <FlaskConical
          className="mt-0.5 shrink-0 text-[hsl(var(--primary))]"
          size={20}
          aria-hidden
        />
        <div className="min-w-0">
          <WeeSectionEyebrow>Experiments</WeeSectionEyebrow>
          <Text variant="desc" className="!mt-1 block">
            These features are intentionally isolated. Disable them here, or ask to remove the
            module later without breaking Now Playing, Color Match, or wallpaper systems.
          </Text>
        </div>
      </WeeModalFieldCard>

      {/* BETA: Immersive Sound Mode — delete feature folder + this import to remove */}
      <ImmersiveSoundModeSettingsSection />

      {/* BETA: Scene FX — delete feature folder + this import to remove */}
      <SceneFxBetaSettingsSection />
    </div>
  );
});

BetaSettingsTab.displayName = 'BetaSettingsTab';

export default BetaSettingsTab;
