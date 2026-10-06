import React, { useState } from 'react';
import { Disc, LayoutGrid, MousePointerClick, Shapes, Sparkles, Type, Zap } from 'lucide-react';
import {
  WeeButton,
  WeeGooeyField,
  WeeGooeyIconButton,
  WeeGooeyTileButton,
  WeeGooeyChoiceGroup,
  WeeGooeyToggle,
  WeeHelpParagraph,
  WeeModalFieldCard,
  WeeRevealWhen,
  WeeSegmentedControl,
  WeeSettingsSection,
} from '../../ui/wee';
import ChannelMorphFace from '../channels/ChannelMorphFace';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './surfaceStyles.css';

const EMPTY_PAINT = {
  plus: '+',
  plusSize: 32,
  plusColor: 'hsl(var(--text-primary))',
};

const TWO_OPTIONS = [
  { value: 'app', label: 'App' },
  { value: 'web', label: 'Website' },
];

const FIVE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'exe', label: 'Apps' },
  { value: 'steam', label: 'Steam' },
  { value: 'epic', label: 'Epic' },
  { value: 'microsoft', label: 'Store' },
];

const FIVE_WITH_DISABLED = FIVE_OPTIONS.map((opt) =>
  opt.value === 'epic' ? { ...opt, disabled: true } : opt
);

/** The shipped ladder, smallest first. Swatches read straight from the tokens. */
const RADIUS_LADDER = [
  { token: '--control-radius-sm', label: 'Control sm', note: '12 · chips, segments' },
  { token: '--control-radius-md', label: 'Control md', note: '14 · default button' },
  { token: '--control-radius-lg', label: 'Control lg', note: '16 · fields, selects' },
  { token: '--wee-radius-rail-item', label: 'Rail item', note: '18 · list rows' },
  { token: '--wee-radius-pill', label: 'Studio pill', note: 'md + pad · concentric' },
  { token: '--wee-radius-card', label: 'Card', note: '28 · wells' },
  { token: '--radius-2xl', label: 'Channel tile', note: '32' },
  { token: '--wee-radius-shell', label: 'Modal shell', note: '36' },
];

function MiniPlate({ kind }) {
  const [path, setPath] = useState('');
  const empty = kind === 'empty';
  return (
    <div className="relative overflow-hidden rounded-[var(--wee-radius-card)] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-surface-shell))] shadow-[var(--wee-shadow-modal)]">
      {!empty ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[hsl(var(--primary))]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-[hsl(var(--color-pure-black)/0.55)]"
            aria-hidden
          />
        </>
      ) : null}
      <div className="relative z-10 flex min-h-0">
        {!empty ? (
          <div className="flex w-24 shrink-0 flex-col justify-start bg-[hsl(var(--wee-surface-rail))] px-3 py-4">
            <span className="text-[10px] font-black uppercase italic tracking-tight text-[hsl(var(--wee-text-header))]">
              Config
            </span>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4 border-b-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-shell))] px-5 py-4">
          {empty ? (
            <ChannelMorphFace variant="chip" paint={EMPTY_PAINT} />
          ) : (
            <div
              className="h-10 w-20 shrink-0 overflow-hidden rounded-[var(--control-radius-sm)] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--primary))]"
              aria-hidden
            />
          )}
          <span className="text-lg font-black uppercase italic tracking-tight text-[hsl(var(--wee-text-header))]">
            Configure
          </span>
        </div>
        <div className="bg-[hsl(var(--wee-surface-well))] px-5 py-5">
          <WeeGooeyField
            label="Path"
            placeholder="Browse or paste a path"
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-input))] px-5 py-4">
          <WeeButton variant="secondary" size="sm">Cancel</WeeButton>
          <WeeButton variant="primary" size="sm">Save</WeeButton>
        </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive playground for the rebuilt Wee gooey primitives.
 * Plate vs form layout is a follow-up — this tab is the pin-point surface.
 */
const KitLabSettingsTab = React.memo(() => {
  const [launch, setLaunch] = useState('app');
  const [source, setSource] = useState('all');
  const [sourceWrap, setSourceWrap] = useState('steam');
  const [sourceDisabled, setSourceDisabled] = useState('all');
  const [fieldRest, setFieldRest] = useState('Wii Sports');
  const [fieldError, setFieldError] = useState('');
  const [choice, setChoice] = useState('spark');
  const [iconActive, setIconActive] = useState('play');
  const [toggleOn, setToggleOn] = useState(true);
  const [morphKind, setMorphKind] = useState(null);

  return (
    <div className="surface-stack">
      <SettingsTabPageHeader
        title="UI Lab"
        subtitle="Gooey squircles — hover, press, and toggle every state"
      />

      <WeeModalFieldCard className="p-5 md:p-6" hoverAccent="primary">
        <WeeHelpParagraph>
          Labeled controls are squircles, never stadium ovals. Disabled is a Wii-tint chip,
          not a grey slab. This tab is the pin-point for empty-vs-art plate talk.
        </WeeHelpParagraph>
      </WeeModalFieldCard>

      <WeeSettingsSection
        icon={Shapes}
        label="Corner ladder"
        description="Every radius is a length, so corners stay circular. Containers are concentric — their radius is the control they wrap plus their own padding."
      >
        <div className="flex flex-wrap gap-3">
          {RADIUS_LADDER.map(({ token, label, note }) => (
            <div key={token} className="flex w-28 flex-col gap-1.5">
              <div
                className="h-14 w-full border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))]"
                style={{ borderRadius: `var(${token})` }}
                aria-hidden
              />
              <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-secondary))]">
                {label}
              </span>
              <span className="text-[length:var(--font-size-caption)] text-[hsl(var(--text-tertiary))]">
                {note}
              </span>
            </div>
          ))}
        </div>
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={MousePointerClick}
        label="Actions"
        description="Primary cyan fill, glass secondary, danger signal. Radius rides with height, so all three sizes read as one corner family."
      >
        <div className="flex flex-wrap items-center gap-3">
          <WeeButton variant="primary">Primary</WeeButton>
          <WeeButton variant="secondary">Secondary</WeeButton>
          <WeeButton variant="danger">Danger</WeeButton>
          <WeeButton variant="primary" disabled>Disabled</WeeButton>
          <WeeButton variant="secondary" active>Selected</WeeButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WeeButton variant="secondary" size="sm">Small</WeeButton>
          <WeeButton variant="secondary" size="md">Medium</WeeButton>
          <WeeButton variant="secondary" size="lg">Large</WeeButton>
        </div>
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={LayoutGrid}
        label="Segments"
        description="One glass cell per option, traveling liquid disc. Wrap stays a row of tiles."
      >
        <WeeSegmentedControl
          ariaLabel="Launch target"
          layoutId="kitLabLaunch"
          value={launch}
          onChange={setLaunch}
          options={TWO_OPTIONS}
        />
        <WeeSegmentedControl
          ariaLabel="Library source wrap"
          layoutId="kitLabSourceWrap"
          wrap
          size="sm"
          value={sourceWrap}
          onChange={setSourceWrap}
          options={FIVE_OPTIONS}
        />
        <WeeSegmentedControl
          ariaLabel="Library source with disabled"
          layoutId="kitLabSourceDisabled"
          wrap
          size="sm"
          value={sourceDisabled}
          onChange={setSourceDisabled}
          options={FIVE_WITH_DISABLED}
        />
        <WeeSegmentedControl
          ariaLabel="Disabled segment"
          layoutId="kitLabSourceOff"
          disabled
          value={source}
          onChange={setSource}
          options={TWO_OPTIONS}
        />
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={Type}
        label="Fields"
        description="Focus uses pillOpen. Error paints the rim. Disabled is Wii-tint."
      >
        <WeeGooeyField
          label="Rest"
          placeholder="Type to focus"
          value={fieldRest}
          onChange={(event) => setFieldRest(event.target.value)}
        />
        <WeeGooeyField
          label="Error"
          placeholder="Needs a path"
          value={fieldError}
          onChange={(event) => setFieldError(event.target.value)}
          error
          helperText="Paste a path or browse"
        />
        <WeeGooeyField
          label="Disabled"
          value="Locked"
          onChange={() => {}}
          disabled
        />
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={Disc}
        label="Icon disc and tile"
        description="Round discs stay for icon-only chrome. Tiles share the press spring."
      >
        <WeeGooeyChoiceGroup
          ariaLabel="Sample choices"
          layoutId="kitLabChoice"
          value={choice}
          onChange={setChoice}
          options={[
            { value: 'spark', label: 'Spark', icon: <Sparkles size={18} /> },
            { value: 'zap', label: 'Zap', icon: <Zap size={18} /> },
            { value: 'grid', label: 'Grid', icon: <LayoutGrid size={18} /> },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <WeeGooeyIconButton
            variant="outline"
            size="md"
            active={iconActive === 'play'}
            layoutId="kitLabIcon"
            aria-label="Play"
            onClick={() => setIconActive('play')}
          >
            <Sparkles size={18} />
          </WeeGooeyIconButton>
          <WeeGooeyIconButton
            variant="solid"
            size="md"
            active={iconActive === 'zap'}
            layoutId="kitLabIcon"
            aria-label="Zap"
            onClick={() => setIconActive('zap')}
          >
            <Zap size={18} />
          </WeeGooeyIconButton>
          <WeeGooeyTileButton
            icon={<LayoutGrid size={18} />}
            label="Tile"
            description="Press spring"
            orientation="row"
            className="min-w-[12rem]"
          />
        </div>
        <WeeGooeyToggle
          checked={toggleOn}
          onChange={setToggleOn}
          label="Gooey toggle"
        />
      </WeeSettingsSection>

      <WeeSettingsSection
        icon={Sparkles}
        label="Empty vs art morph"
        description="Tap a tile. Empty opens an opaque gooey well with a living plus chip — no washed plate. Art keeps a Game Space darken."
      >
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            aria-pressed={morphKind === 'empty'}
            onClick={() => setMorphKind((current) => (current === 'empty' ? null : 'empty'))}
            className="relative flex h-24 w-44 items-center justify-center overflow-hidden rounded-[var(--radius-2xl)] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)]"
          >
            <span className="text-3xl font-light text-[hsl(var(--text-primary))]" aria-hidden>+</span>
            <span className="sr-only">Empty channel tile</span>
          </button>
          <button
            type="button"
            aria-pressed={morphKind === 'art'}
            onClick={() => setMorphKind((current) => (current === 'art' ? null : 'art'))}
            className="relative flex h-24 w-44 items-center justify-center overflow-hidden rounded-[var(--radius-2xl)] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--primary))] shadow-[var(--wee-pill-shadow)]"
          >
            <span className="sr-only">Channel tile with art</span>
          </button>
        </div>
        <WeeRevealWhen when={Boolean(morphKind)} keepMounted={false}>
          <div className="pt-2">
            {morphKind ? <MiniPlate kind={morphKind} /> : null}
          </div>
        </WeeRevealWhen>
      </WeeSettingsSection>
    </div>
  );
});

KitLabSettingsTab.displayName = 'KitLabSettingsTab';

export default KitLabSettingsTab;
