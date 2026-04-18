import React from 'react';
import PropTypes from 'prop-types';
import { Droplets, Layers, SlidersHorizontal } from 'lucide-react';
import Text from '../../../ui/Text';
import Slider from '../../../ui/Slider';
import WToggle from '../../../ui/WToggle';
import {
  WeeHelpParagraph,
  WeeModalFieldCard,
  WeeSectionEyebrow,
  WeeSegmentedControl,
  WeeSettingsCollapsibleSection,
} from '../../../ui/wee';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
} from '../../../design/runtimeColorStrings.js';

const RIBBON_FIELD_CARD =
  'rounded-2xl border border-[hsl(var(--border-primary)/0.42)] bg-[hsl(var(--surface-secondary)/0.55)] p-3 shadow-[inset_0_1px_0_0_hsl(var(--border-primary)/0.14)] md:p-4';

/** Shared grid: label block | switch-only — keeps switch tracks aligned vertically */
function ToggleRow({ title, description, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
      <div className="min-w-0">
        {typeof title === 'string' ? (
          <Text
            variant="body"
            className="text-[0.8125rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]"
          >
            {title}
          </Text>
        ) : (
          title
        )}
        {description ? (
          <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

ToggleRow.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  children: PropTypes.node.isRequired,
};

function RibbonColorField({ eyebrow, hint, value, fallbackHex, onChange, hexLabel }) {
  const hex = (value ?? fallbackHex).toUpperCase();
  return (
    <div className={RIBBON_FIELD_CARD}>
      <div className="mb-3">
        <WeeSectionEyebrow className="!mb-1 block" trackingClassName="tracking-[0.12em]">
          {eyebrow}
        </WeeSectionEyebrow>
        {hint ? (
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
            {hint}
          </Text>
        ) : null}
      </div>
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

RibbonColorField.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.string,
  fallbackHex: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  hexLabel: PropTypes.string.isRequired,
};

function RibbonScaleField({
  eyebrow,
  hint,
  rangeLabel,
  valueDisplay,
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
}) {
  return (
    <div className={RIBBON_FIELD_CARD}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <WeeSectionEyebrow className="!mb-1 block" trackingClassName="tracking-[0.12em]">
            {eyebrow}
          </WeeSectionEyebrow>
          {hint ? (
            <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
              {hint}
            </Text>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="rounded-full border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary))] px-2.5 py-1 text-[11px] font-black tabular-nums tracking-wide text-[hsl(var(--text-primary))]">
            {valueDisplay}
          </span>
          {rangeLabel ? (
            <span className="max-w-[10rem] text-[10px] font-black uppercase leading-tight tracking-[0.1em] text-[hsl(var(--wee-text-rail-muted))]">
              {rangeLabel}
            </span>
          ) : null}
        </div>
      </div>
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

RibbonScaleField.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  hint: PropTypes.string,
  rangeLabel: PropTypes.string,
  valueDisplay: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

/** Glow controls shared between solid and glass ribbon surface sections */
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
    <div className="space-y-4">
      <RibbonColorField
        eyebrow="Glow color"
        hint="Halation and rim light around the ribbon edge."
        value={ribbon?.ribbonGlowColor}
        fallbackHex={DEFAULT_RIBBON_GLOW_HEX}
        onChange={onRibbonGlowColorChange}
        hexLabel="Ribbon glow color"
      />
      <RibbonScaleField
        eyebrow="Glow strength"
        hint="Base bloom radius — visible at rest."
        rangeLabel="0 — 50 px"
        valueDisplay={`${gStrength}px`}
        value={gStrength}
        min={0}
        max={50}
        step={1}
        onChange={onRibbonGlowStrengthChange}
        ariaLabel="Ribbon glow strength in pixels"
      />
      {hoverAnimationEnabled ? (
        <RibbonScaleField
          eyebrow="Hover glow boost"
          hint="Extra bloom when the ribbon hover animation runs."
          rangeLabel="0 — 96 px"
          valueDisplay={`${gHover}px`}
          value={gHover}
          min={0}
          max={96}
          step={1}
          onChange={onRibbonGlowStrengthHoverChange}
          ariaLabel="Ribbon hover glow boost in pixels"
        />
      ) : (
        <div className={RIBBON_FIELD_CARD}>
          <WeeSectionEyebrow className="!mb-2 block" trackingClassName="tracking-[0.12em]">
            Hover glow boost
          </WeeSectionEyebrow>
          <WeeHelpParagraph className="!normal-case !tracking-[0.08em]">
            Enable Ribbon hover animation in Style & behavior to tune extra hover bloom.
          </WeeHelpParagraph>
        </div>
      )}
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
  onRibbonColorChange,
  onRibbonDockOpacityChange,
  onRibbonGlowColorChange,
  onRibbonGlowStrengthChange,
  onRibbonGlowStrengthHoverChange,
  hoverAnimationEnabled,
  onGlassOpacityChange,
  onGlassBlurChange,
  onGlassBorderOpacityChange,
  onGlassShineOpacityChange,
}) {
  const glassOn = ribbon?.glassWiiRibbon ?? false;
  const dockOp = ribbon?.ribbonDockOpacity ?? 1;
  const gOp = ribbon?.glassOpacity ?? 0.18;
  const gBlur = ribbon?.glassBlur ?? 2.5;
  const gBorder = ribbon?.glassBorderOpacity ?? 0.5;
  const gShine = ribbon?.glassShineOpacity ?? 0.7;

  return (
    <div className="flex flex-col gap-6">
      <WeeSettingsCollapsibleSection
        icon={SlidersHorizontal}
        title="Style & behavior"
        description="Pick solid or glass first, then tune appearance below."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="space-y-5">
            <div>
              <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                Ribbon surface mode
              </WeeSectionEyebrow>
              <Text variant="desc" className="!mb-3 !mt-0 text-[hsl(var(--text-secondary))]">
                Solid uses a flat fill; Glass adds blur, shine, and border controls.
              </Text>
              <WeeSegmentedControl
                ariaLabel="Ribbon solid or glass"
                value={glassOn ? 'glass' : 'solid'}
                onChange={(v) => onGlassWiiRibbonChange(v === 'glass')}
                size="sm"
                className="w-full max-w-md"
                options={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'glass', label: 'Glass' },
                ]}
              />
            </div>

            <div className="border-t border-[hsl(var(--border-primary)/0.35)] pt-5">
              <ToggleRow
                title="Ribbon hover animation"
                description="Lift, stretch, and extra hover glow when enabled."
              >
                <WToggle
                  checked={hoverAnimationEnabled}
                  onChange={onRibbonHoverAnimationChange}
                  disableLabelClick
                />
              </ToggleRow>
            </div>
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      {!glassOn ? (
        <WeeSettingsCollapsibleSection
          icon={Layers}
          title="Solid surface"
          description="Outer glow first, then solid fill and opacity."
          defaultOpen
        >
          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <WeeSectionEyebrow className="block" trackingClassName="tracking-[0.14em]">
                  Outer glow
                </WeeSectionEyebrow>
                <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                  Tune bloom before the ribbon fill so edge light reads clearly.
                </Text>
                <RibbonGlowFields
                  ribbon={ribbon}
                  hoverAnimationEnabled={hoverAnimationEnabled}
                  onRibbonGlowColorChange={onRibbonGlowColorChange}
                  onRibbonGlowStrengthChange={onRibbonGlowStrengthChange}
                  onRibbonGlowStrengthHoverChange={onRibbonGlowStrengthHoverChange}
                />
              </div>

              <div className="space-y-4 border-t border-[hsl(var(--border-primary)/0.35)] pt-5">
                <div>
                  <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                    Ribbon fill
                  </WeeSectionEyebrow>
                  <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                    Flat color and transparency for the solid ribbon body.
                  </Text>
                </div>
                <RibbonColorField
                  eyebrow="Ribbon color"
                  hint="Main face color behind icons and labels."
                  value={ribbon?.ribbonColor}
                  fallbackHex={DEFAULT_RIBBON_SURFACE_HEX}
                  onChange={onRibbonColorChange}
                  hexLabel="Ribbon solid color"
                />
                <RibbonScaleField
                  eyebrow="Ribbon opacity"
                  hint="How much wallpaper shows through the fill."
                  rangeLabel="10% — 100%"
                  valueDisplay={`${Math.round(dockOp * 100)}%`}
                  value={dockOp}
                  min={0.1}
                  max={1}
                  step={0.1}
                  onChange={onRibbonDockOpacityChange}
                  ariaLabel="Ribbon opacity percentage"
                />
              </div>
            </div>
          </WeeModalFieldCard>
        </WeeSettingsCollapsibleSection>
      ) : null}

      {glassOn ? (
        <WeeSettingsCollapsibleSection
          icon={Droplets}
          title="Glass surface"
          description="Outer glow first, then glass material sliders."
          defaultOpen
        >
          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <WeeSectionEyebrow className="block" trackingClassName="tracking-[0.14em]">
                  Outer glow
                </WeeSectionEyebrow>
                <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                  Same bloom controls as solid — edge light stays consistent when you switch modes.
                </Text>
                <RibbonGlowFields
                  ribbon={ribbon}
                  hoverAnimationEnabled={hoverAnimationEnabled}
                  onRibbonGlowColorChange={onRibbonGlowColorChange}
                  onRibbonGlowStrengthChange={onRibbonGlowStrengthChange}
                  onRibbonGlowStrengthHoverChange={onRibbonGlowStrengthHoverChange}
                />
              </div>

              <div className="space-y-4 border-t border-[hsl(var(--border-primary)/0.35)] pt-5">
                <div>
                  <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                    Glass material
                  </WeeSectionEyebrow>
                  <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                    Frosted layer: transparency, blur, edge, and specular shine.
                  </Text>
                </div>
                <RibbonScaleField
                  eyebrow="Glass opacity"
                  hint="Overall transparency of the frosted panel."
                  rangeLabel="0% — 50%"
                  valueDisplay={`${Math.round(gOp * 100)}%`}
                  value={gOp}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={onGlassOpacityChange}
                  ariaLabel="Glass opacity"
                />
                <RibbonScaleField
                  eyebrow="Glass blur"
                  hint="Backdrop frost — higher reads more like glass."
                  rangeLabel="0 — 10 px"
                  valueDisplay={`${gBlur}px`}
                  value={gBlur}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={onGlassBlurChange}
                  ariaLabel="Glass blur in pixels"
                />
                <RibbonScaleField
                  eyebrow="Border intensity"
                  hint="Rim contrast around the ribbon edge."
                  rangeLabel="0% — 100%"
                  valueDisplay={`${Math.round(gBorder * 100)}%`}
                  value={gBorder}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={onGlassBorderOpacityChange}
                  ariaLabel="Glass border intensity"
                />
                <RibbonScaleField
                  eyebrow="Shine intensity"
                  hint="Specular streak for a wet-glass highlight."
                  rangeLabel="0% — 100%"
                  valueDisplay={`${Math.round(gShine * 100)}%`}
                  value={gShine}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={onGlassShineOpacityChange}
                  ariaLabel="Glass shine intensity"
                />
              </div>
            </div>
          </WeeModalFieldCard>
        </WeeSettingsCollapsibleSection>
      ) : null}
    </div>
  );
}

RibbonDockPanel.propTypes = {
  ribbon: PropTypes.object,
  glassWiiRibbon: PropTypes.bool,
  onGlassWiiRibbonChange: PropTypes.func.isRequired,
  onRibbonHoverAnimationChange: PropTypes.func.isRequired,
  onRibbonColorChange: PropTypes.func.isRequired,
  onRibbonDockOpacityChange: PropTypes.func.isRequired,
  onRibbonGlowColorChange: PropTypes.func.isRequired,
  onRibbonGlowStrengthChange: PropTypes.func.isRequired,
  onRibbonGlowStrengthHoverChange: PropTypes.func.isRequired,
  hoverAnimationEnabled: PropTypes.bool.isRequired,
  onGlassOpacityChange: PropTypes.func.isRequired,
  onGlassBlurChange: PropTypes.func.isRequired,
  onGlassBorderOpacityChange: PropTypes.func.isRequired,
  onGlassShineOpacityChange: PropTypes.func.isRequired,
};

export default React.memo(RibbonDockPanel);
