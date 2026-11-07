export const DEFAULT_NAV_COLLAPSED_SIZE = 4;
export const DEFAULT_NAV_MIN_SIZE = 15;
export const DEFAULT_NAV_MAX_SIZE = 20;
export const COLLAPSED_COOKIE_NAME = "react-resizable-panels:collapsed";
export const LAYOUT_COOKIE_NAME = "react-resizable-panels:layout";

export type NavbarDisplayMode = "icon" | "text";

export interface NavbarResizeState {
  isCollapsed: boolean;
  mode: NavbarDisplayMode;
  size: number;
}

/**
 * Determines whether the resizable navbar should be in collapsed (icon-only account mode)
 * or expanded (full text + account label mode) for a given panel size percentage.
 */
export function shouldCollapseNavbar(
  size: number,
  collapsedSize: number = DEFAULT_NAV_COLLAPSED_SIZE,
  minExpandedSize: number = DEFAULT_NAV_MIN_SIZE,
): boolean {
  if (!Number.isFinite(size)) return false;
  const threshold = collapsedSize + (minExpandedSize - collapsedSize) / 2;
  return size <= threshold;
}

/**
 * Resolves the navbar display mode ("icon" when collapsed, "text" when expanded).
 */
export function getNavbarDisplayMode(isCollapsed: boolean): NavbarDisplayMode {
  return isCollapsed ? "icon" : "text";
}

/**
 * Computes the next navbar state from a panel resize event.
 */
export function resolveNavbarResizeState(
  size: number,
  collapsedSize: number = DEFAULT_NAV_COLLAPSED_SIZE,
  minExpandedSize: number = DEFAULT_NAV_MIN_SIZE,
): NavbarResizeState {
  const isCollapsed = shouldCollapseNavbar(
    size,
    collapsedSize,
    minExpandedSize,
  );
  return {
    isCollapsed,
    mode: getNavbarDisplayMode(isCollapsed),
    size,
  };
}

/**
 * Formats the cookie string for persisting the collapsed state.
 */
export function formatCollapsedCookie(isCollapsed: boolean): string {
  return `${COLLAPSED_COOKIE_NAME}=${JSON.stringify(Boolean(isCollapsed))}`;
}

/**
 * Formats the cookie string for persisting panel layout sizes.
 */
export function formatLayoutCookie(sizes: number[]): string {
  return `${LAYOUT_COOKIE_NAME}=${JSON.stringify(sizes)}`;
}
