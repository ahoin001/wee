/**
 * Colors settings tab — archived. Color match + dynamic chrome live in the Quick menu;
 * ribbon accents live under Dock. Kept as a no-op so old imports do not break
 * (`normalizeSettingsTabId('colors')` → dock).
 */
import React from 'react';

const ColorsSettingsTab = React.memo(() => null);

ColorsSettingsTab.displayName = 'ColorsSettingsTab';

export default ColorsSettingsTab;
