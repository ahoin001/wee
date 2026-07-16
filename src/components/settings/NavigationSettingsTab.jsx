/**
 * Page arrows settings — removed; Home peeks always use Wee Pill Morph Reveal.
 * Module kept so old imports do not break. Deep links redirect via
 * `normalizeSettingsTabId('navigation')` → channels.
 */
import React from 'react';

const NavigationSettingsTab = React.memo(() => null);

NavigationSettingsTab.displayName = 'NavigationSettingsTab';

export default NavigationSettingsTab;
