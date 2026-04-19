import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { MousePointer2, Settings, Sparkles, Zap } from 'lucide-react';
import { WeeModalShell, WeeModalRail, WeeModalRailItem, WeeModalRailSection } from '../../ui/wee';
import { useWeeMotion, WEE_VARIANTS } from '../../design/weeMotion';

const TabPanel = m.div;

/**
 * Wee shell for Configure Channel: left rail + header title + scroll body + footer slot.
 */
function WeeChannelModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  headerTitle,
  statusReady,
  footerContent,
  children,
  maxWidth = 'min(1400px, 96vw)',
  onExitAnimationComplete,
}) {
  const { tabTransition } = useWeeMotion();

  const rail = (
    <WeeModalRail>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--text-primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--wee-shadow-rail-active)]">
            <Zap size={24} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-xl font-black uppercase italic leading-none tracking-tight text-[hsl(var(--wee-text-header))]">
              Config
            </h2>
            <span className="mt-1 block text-[9px] font-black uppercase tracking-widest text-[hsl(var(--wee-text-rail-muted))]">
              Channel engine
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <WeeModalRailSection label="Make channel">
            <WeeModalRailItem
              icon={MousePointer2}
              title="Channel setup"
              subtitle="Path & creative"
              active={activeTab === 'setup'}
              onClick={() => onTabChange('setup')}
              accent="primary"
            />
            <WeeModalRailItem
              icon={Settings}
              title="Behavior"
              subtitle="Runtime logic"
              active={activeTab === 'behavior'}
              onClick={() => onTabChange('behavior')}
              accent="primary"
            />
          </WeeModalRailSection>

          <WeeModalRailSection label="Discovery">
            <WeeModalRailItem
              icon={Sparkles}
              title="Suggested"
              subtitle="Games & apps"
              active={activeTab === 'suggested'}
              onClick={() => onTabChange('suggested')}
              accent="discovery"
            />
          </WeeModalRailSection>
        </div>
      </div>

      <div className="mt-auto rounded-[2.5rem] border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] p-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 shrink-0 rounded-full ${statusReady ? 'bg-[hsl(var(--state-success))]' : 'bg-[hsl(var(--state-warning))]'}`}
            aria-hidden
          />
          <span className="text-[10px] font-black uppercase tracking-tight text-[hsl(var(--wee-text-rail-muted))]">
            Status: {statusReady ? 'Ready' : 'Incomplete'}
          </span>
        </div>
      </div>
    </WeeModalRail>
  );

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={onClose}
      headerTitle={headerTitle}
      rail={rail}
      footerContent={footerContent}
      maxWidth={maxWidth}
      showRail
      onExitAnimationComplete={onExitAnimationComplete}
    >
      <AnimatePresence mode="wait">
        <TabPanel
          key={activeTab}
          initial={WEE_VARIANTS.tabBodyInitial}
          animate={WEE_VARIANTS.tabBodyAnimate}
          exit={WEE_VARIANTS.tabBodyExit}
          transition={tabTransition}
        >
          {children}
        </TabPanel>
      </AnimatePresence>
    </WeeModalShell>
  );
}

WeeChannelModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  activeTab: PropTypes.oneOf(['setup', 'behavior', 'suggested']).isRequired,
  onTabChange: PropTypes.func.isRequired,
  headerTitle: PropTypes.string.isRequired,
  statusReady: PropTypes.bool,
  footerContent: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.string,
  onExitAnimationComplete: PropTypes.func,
};

WeeChannelModal.defaultProps = {
  isOpen: true,
  statusReady: false,
  maxWidth: 'min(1400px, 96vw)',
  onExitAnimationComplete: undefined,
};

export default WeeChannelModal;
