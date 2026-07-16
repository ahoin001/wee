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
      ? 'text-[10px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]'
      : 'text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]';

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
      ? 'text-[11px] font-bold text-[hsl(var(--text-secondary))]'
      : 'text-[10px] font-bold text-[hsl(var(--text-secondary))]';

  const iconPx = density === 'compact' ? 22 : density === 'roomy' ? 28 : 24;

  const listAvatarPx = density === 'compact' ? 28 : density === 'roomy' ? 40 : 36;
  const listThumbClass =
    density === 'roomy'
      ? 'h-11 w-[5.25rem]'
      : density === 'compact'
        ? 'h-8 w-14'
        : 'h-9 w-[4.25rem]';
  const listRowClass =
    density === 'roomy'
      ? 'gap-2.5 rounded-[1rem] p-2'
      : density === 'compact'
        ? 'gap-1.5 rounded-[0.75rem] p-1'
        : 'gap-2 rounded-[0.85rem] p-1.5';

  // Icon grids (Recently Used / Quick Access): prefer readable columns.
  let iconGridCols = 3;
  if (isCompact) iconGridCols = 1;
  else if (isWide && cols >= 3) iconGridCols = Math.min(5, Math.max(3, cols + 1));
  else if (isTall && rows >= 3) iconGridCols = 2;
  else if (cells >= 6) iconGridCols = 3;
  else if (isWide) iconGridCols = 3;
  else iconGridCols = 2;

  const showIconLabels = density === 'roomy' || (isTall && cells >= 4);
  const listColumns = isWide && cols >= 3 ? 2 : 1;

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
