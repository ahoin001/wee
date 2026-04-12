export const isRendererActive = () => {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible';
};
