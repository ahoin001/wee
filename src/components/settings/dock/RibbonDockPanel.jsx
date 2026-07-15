import React from 'react';
import PropTypes from 'prop-types';
import { Layers, SlidersHorizontal, Sparkles } from 'lucide-react';
import Text from '../../../ui/Text';
import Slider from '../../../ui/Slider';
import WSelect from '../../../ui/WSelect';
import {
  WeeHelpLinkButton,
  WeeHelpParagraph,
  WeeModalFieldCard,
  WeeRevealWhen,
  WeeSettingsCollapsibleSection,
} from '../../../ui/wee';
import SettingsToggleFieldCard from '../SettingsToggleFieldCard';
import RibbonLivePreview from './RibbonLivePreview';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
} from '../../../design/runtimeColorStrings.js';
import {
  getRibbonChromeEffectMeta,
  getRibbonChromeEffectOptions,
  isRibbonChromeGlassSoftMode,
} from '../../dock/ribbon/ribbonChromeEffectMeta';
import { openSettingsToDockSubtab } from '../../../utils/settingsNavigation';

const TOGGLE_TITLE =
  '!text-[0.8125rem] !font-black !uppercase !tracking-[0.06em] !leading-snug !text-[hsl(var(--text-primary))]';

const CHROME_EFFECT_OPTIONS = getRibbonChromeEffectOptions();

function ColorRow({ label, hint, value, fallbackHex, onChange, hexLabel }) {
  const hex = (value ?? fallbackHex).toUpperCase();
  return (
    <div>
      <Text variant="body" className="mb-1 text-[hsl(var(--text-secondary))]">
        {label}
      </Text>
      {hint ? (
        <Text variant="caption" className="!mb-2 !mt-0 block text-[hsl(var(--text-tertiary))]">
          {hint}
        </Text>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={value ?? fallbackHex}
          onChange={onChange}
          aria-label={hexLabel}
          className="surface-color-input h-11 w-11 shrink-0 cursor-pointer rounded-[var(--radius-sm)]"
        />
        <span className="rounded-full border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary))] px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-[hsl(var(--text-primary))]">
          {hex}
        </span>
      </div>
    </div>
  );
}

ColorRow.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.string,
  fallbackHex: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  hexLabel: PropTypes.string.isRequired,
};

function ScaleRow({ label, hint, valueDisplay, value, min, max, step, onChange, ariaLabel }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          {label}
        </Text>
        <Text variant="caption" className="!m-0 tabular-nums text-[hsl(var(--text-tertiary))]">
          {valueDisplay}
        </Text>
      </div>
      {hint ? (
        <Text variant="caption" className="!mb-2 !mt-0 block text-[hsl(var(--text-tertiary))]">
          {hint}
        </Text>
      ) : null}
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        hideValue
        containerClassName="!mb-0"
        aria-label={ariaLabel}
      />
    </div>
  );
}

ScaleRow.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  valueDisplay: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

function RibbonGlowFields({
  ribbon,
  hoverAnimationEnabled,
  onRibbonGlowColorChange,
  onRibbonGlowStrengthChange,
  onRibbonGlowStrengthHoverChange,
}) {
  const gStrength = ribbon?.ribbonGlowStrength ?? 20;
  const gHover = ribbon?.ribbonGlowStrengthHover ?? 28;

  return (
    <div className="surface-controls">
      <ColorRow
        label="Glow color"
        hint="Halation and rim light around the ribbon edge."
        value={ribbon?.ribbonGlowColor}
        fallbackHex={DEFAULT_RIBBON_GLOW_HEX}
        onChange={onRibbonGlowColorChange}
        hexLabel="Ribbon glow color"
      />
      <ScaleRow
        label="Glow strength"
        hint="Base bloom radius — visible at rest."
        valueDisplay={`${gStrength}px`}
        value={gStrength}
        min={0}
        max={50}
        step={1}
        onChange={onRibbonGlowStrengthChange}
        ariaLabel="Ribbon glow strength in pixels"
      />
      <WeeRevealWhen when={hoverAnimationEnabled}>
        <ScaleRow
          label="Hover glow boost"
          hint="Extra bloom when the ribbon hover animation runs."
          valueDisplay={`${gHover}px`}
          value={gHover}
          min={0}
          max={96}
          step={1}
          onChange={onRibbonGlowStrengthHoverChange}
          ariaLabel="Ribbon hover glow boost in pixels"
        />
      </WeeRevealWhen>
      <WeeRevealWhen when={!hoverAnimationEnabled}>
        <WeeHelpParagraph className="!mb-0 !normal-case !tracking-[0.04em]">
          Enable Ribbon hover animation in Style to tune extra hover bloom.
        </WeeHelpParagraph>
      </WeeRevealWhen>
    </div>
  );
}

RibbonGlowFields.propTypes = {
  ribbon: PropTypes.object,
  hoverAnimationEnabled: PropTypes.bool.isRequired,
  onRibbonGlowColorChange: PropTypes.func.isRequired,
  onRibbonGlowStrengthChange: PropTypes.func.isRequired,
  onRibbonGlowStrengthHoverChange: PropTypes.func.isRequired,
};

function RibbonDockPanel({
  ribbon,
  onGlassWiiRibbonChange,
  onRibbonHoverAnimationChange,
  onDynamicRibbonColorEnabledChange,
  onRibbonColorChange,
  onRibbonDockOpacityChange,
  onRibbonGlowColorChange,
  onRibbonGlowStrengthChange,
  onRibbonGlowStrengthHoverChange,
  hoverAnimationEnabled,
  dynamicRibbonColorEnabled,
  onGlassOpacityChange,
  onGlassBlurChange,
  onGlassBorderOpacityChange,
  onGlassShineOpacityChange,
  onChromeEffectChange,
  onChromeEffectIntensityChange,
  onChromeEffectSpeedChange,
  onChromeEffectGlowStrengthChange,
  onChromeEffectIdleOnlyChange,
}) {
  const glassOn = ribbon?.glassWiiRibbon ?? false;
  const dockOp = ribbon?.ribbonDockOpacity ?? 1;
  const gOp = ribbon?.glassOpacity ?? 0.18;
  const gBlur = ribbon?.glassBlur ?? 2.5;
  const gBorder = ribbon?.glassBorderOpacity ?? 0.5;
  const gShine = ribbon?.glassShineOpacity ?? 0.7;
  const chromeEffect = ribbon?.chromeEffect ?? 'none';
  const chromeIntensity = ribbon?.chromeEffectIntensity ?? 0.55;
  const chromeSpeed = ribbon?.chromeEffectSpeed ?? 1;
  const chromeGlowStrength = ribbon?.chromeEffectGlowStrength ?? 0.7;
  const chromeIdleOnly = ribbon?.chromeEffectIdleOnly ?? false;

  return (
    <div className="flex flex-col gap-5">
      <RibbonLivePreview sticky />

      <WeeSettingsCollapsibleSection
        icon={SlidersHorizontal}
        title="Style & behavior"
        description="Hover motion and dynamic accents."
        defaultOpen
      >
        <div className="flex flex-col gap-4">
          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Ribbon hover animation"
            desc="Lift, stretch, and extra hover glow when enabled."
            checked={hoverAnimationEnabled}
            onChange={onRibbonHoverAnimationChange}
          />
          <SettingsToggleFieldCard
            hoverAccent="none"
            titleClassName={TOGGLE_TITLE}
            title="Dynamic color from ribbon"
            desc="When on, ribbon glow drives dynamic accents in supported UI areas."
            checked={dynamicRibbonColorEnabled}
            onChange={onDynamicRibbonColorEnabledChange}
          />
        </div>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Layers}
        title="Surface"
        description="Glow, solid fill, or glass material."
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="flex flex-col gap-6">
            <RibbonGlowFields
              ribbon={ribbon}
              hoverAnimationEnabled={hoverAnimationEnabled}
              onRibbonGlowColorChange={onRibbonGlowColorChange}
              onRibbonGlowStrengthChange={onRibbonGlowStrengthChange}
              onRibbonGlowStrengthHoverChange={onRibbonGlowStrengthHoverChange}
            />

            <SettingsToggleFieldCard
              hoverAccent="none"
              titleClassName={TOGGLE_TITLE}
              title="Glass ribbon"
              desc="Frosted blur, shine, and border on the ribbon body."
              checked={glassOn}
              onChange={onGlassWiiRibbonChange}
            >
              <div className="surface-controls">
                <ScaleRow
                  label="Glass opacity"
                  hint="Overall transparency of the frosted panel."
                  valueDisplay={`${Math.round(gOp * 100)}%`}
                  value={gOp}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={onGlassOpacityChange}
                  ariaLabel="Glass opacity"
                />
                <ScaleRow
                  label="Glass blur"
                  hint="Backdrop frost — higher reads more like glass."
                  valueDisplay={`${gBlur}px`}
                  value={gBlur}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={onGlassBlurChange}
                  ariaLabel="Glass blur in pixels"
                />
                <ScaleRow
                  label="Border intensity"
                  hint="Rim contrast around the ribbon edge."
                  valueDisplay={`${Math.round(gBorder * 100)}%`}
                  value={gBorder}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={onGlassBorderOpacityChange}
                  ariaLabel="Glass border intensity"
                />
                <ScaleRow
                  label="Shine intensity"
                  hint="Specular streak for a wet-glass highlight."
                  valueDisplay={`${Math.round(gShine * 100)}%`}
                  value={gShine}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={onGlassShineOpacityChange}
                  ariaLabel="Glass shine intensity"
                />
              </div>
            </SettingsToggleFieldCard>

            <WeeRevealWhen when={!glassOn}>
              <div className="surface-controls">
                <ColorRow
                  label="Ribbon color"
                  hint="Main face color behind icons and labels."
                  value={ribbon?.ribbonColor}
                  fallbackHex={DEFAULT_RIBBON_SURFACE_HEX}
                  onChange={onRibbonColorChange}
                  hexLabel="Ribbon solid color"
                />
                <ScaleRow
                  label="Ribbon opacity"
                  hint="How much wallpaper shows through the fill."
                  valueDisplay={`${Math.round(dockOp * 100)}%`}
                  value={dockOp}
                  min={0.1}
                  max={1}
                  step={0.1}
                  onChange={onRibbonDockOpacityChange}
                  ariaLabel="Ribbon opacity percentage"
                />
              </div>
            </WeeRevealWhen>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Sparkles}
        title="Chrome effects"
        description="Surface FX on the ribbon body (not ambient particles)."
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="surface-controls">
            <div>
              <Text variant="body" className="mb-2 text-[hsl(var(--text-secondary))]">
                Effect mode
              </Text>
              <WSelect
                value={chromeEffect}
                onChange={onChromeEffectChange}
                options={CHROME_EFFECT_OPTIONS}
                className="w-full"
              />
              {chromeEffect !== 'none' ? (
                <Text
                  variant="caption"
                  className="!mb-0 !mt-2 block text-[hsl(var(--text-tertiary))]"
                >
                  {getRibbonChromeEffectMeta(chromeEffect).description}
                </Text>
              ) : null}
              {glassOn && isRibbonChromeGlassSoftMode(chromeEffect) ? (
                <Text
                  variant="caption"
                  className="!mb-0 !mt-1.5 block text-[hsl(var(--text-tertiary))]"
                >
                  Boosted for glass so the effect stays visible.
                </Text>
              ) : null}
            </div>

            <WeeRevealWhen when={chromeEffect !== 'none'}>
              <div className="surface-controls">
                <ScaleRow
                  label="Intensity"
                  hint="How strong the effect reads on the ribbon."
                  valueDisplay={`${Math.round(chromeIntensity * 100)}%`}
                  value={chromeIntensity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={onChromeEffectIntensityChange}
                  ariaLabel="Chrome effect intensity"
                />
                <ScaleRow
                  label="Speed"
                  hint="Animation pace for the selected chrome effect."
                  valueDisplay={`${Number(chromeSpeed).toFixed(2)}×`}
                  value={chromeSpeed}
                  min={0.25}
                  max={2}
                  step={0.05}
                  onChange={onChromeEffectSpeedChange}
                  ariaLabel="Chrome effect speed"
                />
                <WeeRevealWhen when={chromeEffect === 'neonTrace'}>
                  <ScaleRow
                    label="Glow strength"
                    hint="Soft bloom around the light tip (fairy / sacred-light feel)."
                    valueDisplay={`${Math.round(chromeGlowStrength * 100)}%`}
                    value={chromeGlowStrength}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={onChromeEffectGlowStrengthChange}
                    ariaLabel="Neon trace glow strength"
                  />
                </WeeRevealWhen>
                <SettingsToggleFieldCard
                  hoverAccent="none"
                  titleClassName={TOGGLE_TITLE}
                  title="Idle only"
                  desc="Animate when the dock is idle; pause while you use it."
                  checked={chromeIdleOnly}
                  onChange={onChromeEffectIdleOnlyChange}
                />
              </div>
            </WeeRevealWhen>

            <WeeHelpParagraph className="!mb-0 !normal-case !tracking-[0.04em]">
              Ambient dock particles (Classic + Ribbon) live under{' '}
              <WeeHelpLinkButton type="button" className="!mt-0 inline" onClick={() => openSettingsToDockSubtab('animations')}>
                Dock → Animations
              </WeeHelpLinkButton>
              .
            </WeeHelpParagraph>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
    </div>
  );
}

RibbonDockPanel.propTypes = {
  ribbon: PropTypes.object,
  onGlassWiiRibbonChange: PropTypes.func.isRequired,
  onRibbonHoverAnimationChange: PropTypes.func.isRequired,
  onDynamicRibbonColorEnabledChange: PropTypes.func.isRequired,
  onRibbonColorChange: PropTypes.func.isRequired,
  onRibbonDockOpacityChange: PropTypes.func.isRequired,
  onRibbonGlowColorChange: PropTypes.func.isRequired,
  onRibbonGlowStrengthChange: PropTypes.func.isRequired,
  onRibbonGlowStrengthHoverChange: PropTypes.func.isRequired,
  hoverAnimationEnabled: PropTypes.bool.isRequired,
  dynamicRibbonColorEnabled: PropTypes.bool.isRequired,
  onGlassOpacityChange: PropTypes.func.isRequired,
  onGlassBlurChange: PropTypes.func.isRequired,
  onGlassBorderOpacityChange: PropTypes.func.isRequired,
  onGlassShineOpacityChange: PropTypes.func.isRequired,
  onChromeEffectChange: PropTypes.func.isRequired,
  onChromeEffectIntensityChange: PropTypes.func.isRequired,
  onChromeEffectSpeedChange: PropTypes.func.isRequired,
  onChromeEffectGlowStrengthChange: PropTypes.func.isRequired,
  onChromeEffectIdleOnlyChange: PropTypes.func.isRequired,
};

export default React.memo(RibbonDockPanel);
