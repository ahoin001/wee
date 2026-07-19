/**
 * Shared responsive layout tokens for Home-grid widgets.
 * Driven by live colSpan × rowSpan so every size preset gets a deliberate look.
 */

/**
 * @typedef {'compact' | 'cozy' | 'roomy'} HomeWidgetDensity
 * @typedef {'square' | 'wide' | 'tall'} HomeWidgetOrientation
 *
 * @typedef {object} HomeWidgetLayout
 * @property {number} colSpan
 * @property {number} rowSpan
 * @property {number} cells
 * @property {HomeWidgetDensity} density
 * @property {HomeWidgetOrientation} orientation
 * @property {boolean} isCompact — 1×1 (or single-cell) glance
 * @property {boolean} isWide
 * @property {boolean} isTall
 * @property {boolean} showHeader
 * @property {string} shellPadClass
 * @property {string} gapClass
 * @property {string} kickerClass
 * @property {string} titleClass
 * @property {string} bodyClass
 * @property {number} iconPx
 * @property {number} listAvatarPx
 * @property {string} listThumbClass
 * @property {string} listRowClass
 * @property {number} iconGridCols
 * @property {boolean} showIconLabels
 * @property {number} listColumns — friend / row lists
 */

/**
 * @param {number} [colSpan]
 * @param {number} [rowSpan]
 * @returns {HomeWidgetLayout}
 */
export function resolveHomeWidgetLayout(colSpan = 1, rowSpan = 1) {
  const cols = Math.max(1, Math.floor(Number(colSpan) || 1));
  const rows = Math.max(1, Math.floor(Number(rowSpan) || 1));
  const cells = cols * rows;

  const isCompact = cells <= 1;
  const isWide = cols > rows;
  const isTall = rows > cols;
  const orientation = isWide ? 'wide' : isTall ? 'tall' : 'square';

  /** @type {HomeWidgetDensity} */
  let density = 'cozy';
  if (isCompact || cells <= 2) density = 'compact';
  else if (cells >= 6) density = 'roomy';

  const showHeader = !isCompact;

  const shellPadClass =
    density === 'compact' ? 'p-1.5' : density === 'roomy' ? 'p-2.5' : 'p-2';
  const gapClass =
    density === 'compact' ? 'gap-1' : density === 'roomy' ? 'gap-2' : 'gap-1.5';

  const kickerClass =
    density === 'roomy'
      ? 'text-[10px] font-black uppercase tracking-[0.14em] text-[var(--hw-text-secondary)]'
      : 'text-[9px] font-black uppercase tracking-[0.14em] text-[var(--hw-text-secondary)]';

  const titleClass =
    density === 'compact'
      ? 'text-base font-black tabular-nums leading-none'
      : density === 'roomy'
        ? isTall
          ? 'text-5xl font-black tabular-nums leading-none'
          : 'text-4xl font-black tabular-nums leading-none'
        : isWide
          ? 'text-3xl font-black tabular-nums leading-none'
          : 'text-3xl font-black tabular-nums leading-none';

  const bodyClass =
    density === 'roomy'
      ? 'text-[11px] font-bold text-[var(--hw-text-secondary)]'
      : 'text-[10px] font-bold text-[var(--hw-text-secondary)]';

  const iconPx = density === 'compact' ? 22 : density === 'roomy' ? 28 : 24;

  const listAvatarPx = density === 'compact' ? 32 : density === 'roomy' ? 44 : 40;
  /** Friend / media list game capsules — landscape header art, sized to read as the row hero. */
  const listThumbClass =
    density === 'roomy'
      ? 'h-16 w-[7.5rem] rounded-lg'
      : density === 'compact'
        ? 'h-12 w-[5.5rem] rounded-md'
        : 'h-14 w-[6.5rem] rounded-lg';
  const listRowClass =
    density === 'roomy'
      ? 'gap-3 rounded-[1.15rem] p-2.5'
      : density === 'compact'
        ? 'gap-2 rounded-[0.9rem] p-1.5'
        : 'gap-2.5 rounded-[1rem] p-2';

  // Icon grids (Recently Used / Quick Access): prefer readable columns.
  let iconGridCols = 3;
  if (isCompact) iconGridCols = 1;
  else if (isWide && cols >= 3) iconGridCols = Math.min(5, Math.max(3, cols + 1));
  else if (isTall && rows >= 3) iconGridCols = 2;
  else if (cells >= 6) iconGridCols = 3;
  else if (isWide) iconGridCols = 3;
  else iconGridCols = 2;

  const showIconLabels = density === 'roomy' || (isTall && cells >= 4);
  // Friend lists: dual columns on 2×2+ boards; stay single-column on short 2×1 banners.
  const listColumns =
    (isWide && cols >= 3) || (cols >= 2 && rows >= 2) ? 2 : 1;

  return {
    colSpan: cols,
    rowSpan: rows,
    cells,
    density,
    orientation,
    isCompact,
    isWide,
    isTall,
    showHeader,
    shellPadClass,
    gapClass,
    kickerClass,
    titleClass,
    bodyClass,
    iconPx,
    listAvatarPx,
    listThumbClass,
    listRowClass,
    iconGridCols,
    showIconLabels,
    listColumns,
  };
}

export default resolveHomeWidgetLayout;
