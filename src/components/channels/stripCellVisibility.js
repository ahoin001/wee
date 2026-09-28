import { createContext, useContext } from 'react';

/**
 * Whether the enclosing Home strip cell sits on the current page.
 * Defaults to true so tiles outside the strip (previews, hubs) behave as before.
 */
export const StripCellOnCurrentPageContext = createContext(true);

export function useStripCellOnCurrentPage() {
  return useContext(StripCellOnCurrentPageContext);
}
