/**
 * Board mutation engine tests (fixed holes, widgets, spans, relayout).
 * Run: node scripts/test/board-mutation.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const modPath = path.join(__dirname, '../../src/utils/boardMutation.js');
  return import(`file:///${modPath.replace(/\\/g, '/')}`);
}

function emptyBoard(n) {
  return Array.from({ length: n }, () => ({
    kind: 'channel',
    hidden: false,
    colSpan: 1,
    rowSpan: 1,
    channel: null,
  }));
}

function filled(path) {
  return {
    kind: 'channel',
    hidden: false,
    colSpan: 1,
    rowSpan: 1,
    channel: { path, media: null },
  };
}

function hole() {
  return {
    kind: 'channel',
    hidden: true,
    colSpan: 1,
    rowSpan: 1,
    channel: null,
  };
}

function widget(kind = 'adminQuickAccess', colSpan = 1, rowSpan = 1) {
  return {
    kind,
    hidden: false,
    colSpan,
    rowSpan,
    channel: null,
    widget: { widgetId: kind },
  };
}

async function run() {
  const {
    reorderSlots,
    setSlotHidden,
    relayoutBoard,
    assertBoardInvariants,
    normalizeDropTarget,
  } = await load();

  const layout = { columns: 4, rows: 3, totalPages: 1 }; // 12 cells

  // 1) Drag across a punched hole — hole stays put
  {
    const slots = emptyBoard(12);
    slots[0] = filled('A');
    slots[1] = hole();
    slots[2] = filled('B');
    slots[3] = filled('C');
    const { slots: next, ok } = reorderSlots({
      slots,
      layout,
      fromIndex: 0,
      toIndex: 3,
    });
    assert.equal(ok, true);
    assert.equal(next[1].hidden, true, 'hole stays at index 1');
    assert.equal(next[0].channel?.path, 'B');
    assert.equal(next[2].channel?.path, 'C');
    assert.equal(next[3].channel?.path, 'A');
    const inv = assertBoardInvariants(next, layout);
    assert.equal(inv.ok, true, inv.errors.join('; '));
  }

  // 2) Widget moves with channels (first-class)
  {
    const slots = emptyBoard(12);
    slots[0] = filled('A');
    slots[1] = widget('nowPlaying');
    slots[2] = filled('B');
    const { slots: next, ok } = reorderSlots({
      slots,
      layout,
      fromIndex: 1,
      toIndex: 0,
    });
    assert.equal(ok, true);
    assert.equal(next[0].kind, 'nowPlaying');
    assert.equal(next[1].channel?.path, 'A');
    assert.equal(next[2].channel?.path, 'B');
  }

  // 3) Empty slot insert semantics
  {
    const slots = emptyBoard(12);
    slots[4] = filled('B');
    slots[2] = filled('C');
    const { slots: next } = reorderSlots({
      slots,
      layout,
      fromIndex: 4,
      toIndex: 0,
    });
    assert.equal(next[0].channel?.path, 'B');
    assert.equal(next[3].channel?.path, 'C');
  }

  // 4) normalizeDropTarget snaps off holes
  {
    const slots = emptyBoard(12);
    slots[0] = filled('A');
    slots[1] = hole();
    slots[2] = filled('B');
    const legal = normalizeDropTarget({
      slots,
      layout,
      hoverIndex: 1,
      movingIndex: 0,
    });
    assert.notEqual(legal, 1);
    assert.ok(legal === 0 || legal === 2);
  }

  // 5) Punch rejects covered cells under a 2×2 widget
  {
    const slots = emptyBoard(12);
    slots[0] = widget('adminQuickAccess', 2, 2);
    const { ok } = setSlotHidden({
      slots,
      index: 1,
      hidden: true,
      layout,
    });
    assert.equal(ok, false);
    const punched = setSlotHidden({
      slots,
      index: 0,
      hidden: true,
      layout,
    });
    assert.equal(punched.ok, true);
    assert.equal(punched.slots[0].hidden, true);
  }

  // 6) Relayout shrink preserves content + holes (grows pages if needed)
  {
    const slots = emptyBoard(36); // 4x3x3
    slots[0] = filled('A');
    slots[1] = hole();
    slots[5] = filled('B');
    slots[12] = widget('nowPlaying');
    const { slots: next, layout: nextLayout, overflow } = relayoutBoard({
      slots,
      fromLayout: { columns: 4, rows: 3, totalPages: 3 },
      toLayout: { columns: 3, rows: 2, totalPages: 2 },
    });
    assert.equal(overflow, false);
    const paths = next.filter((s) => s.channel?.path).map((s) => s.channel.path);
    assert.ok(paths.includes('A'));
    assert.ok(paths.includes('B'));
    assert.ok(next.some((s) => s.kind === 'nowPlaying'));
    assert.ok(next.some((s) => s.hidden));
    const inv = assertBoardInvariants(next, nextLayout);
    assert.equal(inv.ok, true, inv.errors.join('; '));
  }

  // 7) Grow pads empties; holes stay
  {
    const slots = emptyBoard(12);
    slots[2] = hole();
    slots[0] = filled('A');
    const { slots: next, layout: nextLayout } = relayoutBoard({
      slots,
      fromLayout: { columns: 4, rows: 3, totalPages: 1 },
      toLayout: { columns: 4, rows: 3, totalPages: 2 },
    });
    assert.equal(next.length, 24);
    assert.equal(next[0].channel?.path, 'A');
    assert.ok(next.some((s) => s.hidden));
    const inv = assertBoardInvariants(next, nextLayout);
    assert.equal(inv.ok, true, inv.errors.join('; '));
  }

  // 8) Page-only layout override stores layoutByPage; expand snapshots other pages
  {
    const {
      applyPageLayoutOverrideToSpaceData,
    } = await load();
    const space = {
      layout: { columns: 4, rows: 3, totalPages: 3, peekPercent: 8 },
      layoutByPage: {},
      slots: emptyBoard(36),
      navigation: { currentPage: 1, totalPages: 3 },
    };
    const shrunk = applyPageLayoutOverrideToSpaceData(space, 1, { columns: 3, rows: 3 });
    assert.equal(shrunk.layout.columns, 4, 'strip columns unchanged when shrinking a page');
    assert.equal(shrunk.layoutByPage['1'].columns, 3);

    const grown = applyPageLayoutOverrideToSpaceData(space, 1, { columns: 6, rows: 3 });
    assert.equal(grown.layout.columns, 6, 'strip expands when a page needs more columns');
    assert.equal(grown.layoutByPage['0'].columns, 4, 'other pages keep prior strip size');
    assert.equal(grown.layoutByPage['2'].columns, 4);
    assert.equal(grown.layoutByPage['1'], undefined, 'expanded page matches strip (no-op override)');
  }

  console.log('[board-mutation] OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
