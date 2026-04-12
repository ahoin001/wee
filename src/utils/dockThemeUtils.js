export const getDockThemeByPath = (themeGroups, themePath) => {
  if (!themePath) return null;
  const [groupKey, themeKey] = themePath.split('.');
  return themeGroups[groupKey]?.themes?.[themeKey] || null;
};

export const findDockThemePath = (themeGroups, dockColors) => {
  for (const [groupKey, group] of Object.entries(themeGroups)) {
    for (const [themeKey, theme] of Object.entries(group.themes)) {
      const themePath = `${groupKey}.${themeKey}`;
      const colors = theme.colors;
      if (
        colors.dockBaseGradientStart === dockColors.dockBaseGradientStart &&
        colors.dockBaseGradientEnd === dockColors.dockBaseGradientEnd &&
        colors.dockAccentColor === dockColors.dockAccentColor &&
        colors.sdCardBodyColor === dockColors.sdCardBodyColor &&
        colors.sdCardBorderColor === dockColors.sdCardBorderColor &&
        colors.sdCardLabelColor === dockColors.sdCardLabelColor &&
        colors.sdCardLabelBorderColor === dockColors.sdCardLabelBorderColor &&
        colors.sdCardBottomColor === dockColors.sdCardBottomColor &&
        colors.leftPodBaseColor === dockColors.leftPodBaseColor &&
        colors.leftPodAccentColor === dockColors.leftPodAccentColor &&
        colors.leftPodDetailColor === dockColors.leftPodDetailColor &&
        colors.rightPodBaseColor === dockColors.rightPodBaseColor &&
        colors.rightPodAccentColor === dockColors.rightPodAccentColor &&
        colors.rightPodDetailColor === dockColors.rightPodDetailColor &&
        colors.buttonBorderColor === dockColors.buttonBorderColor &&
        colors.buttonGradientStart === dockColors.buttonGradientStart &&
        colors.buttonGradientEnd === dockColors.buttonGradientEnd &&
        colors.buttonIconColor === dockColors.buttonIconColor &&
        colors.rightButtonIconColor === dockColors.rightButtonIconColor &&
        colors.buttonHighlightColor === dockColors.buttonHighlightColor
      ) {
        return themePath;
      }
    }
  }

  return null;
};
