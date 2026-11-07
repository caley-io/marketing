import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COLLAPSED_COOKIE_NAME,
  DEFAULT_NAV_COLLAPSED_SIZE,
  DEFAULT_NAV_MIN_SIZE,
  LAYOUT_COOKIE_NAME,
  formatCollapsedCookie,
  formatLayoutCookie,
  getNavbarDisplayMode,
  resolveNavbarResizeState,
  shouldCollapseNavbar,
} from "../utils/resizableNavbar.ts";

describe("Resizable Navbar Mode Switching (Issue #8)", () => {
  it("switches to collapsed icon-only mode when panel size is at or below threshold", () => {
    assert.equal(
      shouldCollapseNavbar(
        DEFAULT_NAV_COLLAPSED_SIZE,
        DEFAULT_NAV_COLLAPSED_SIZE,
        DEFAULT_NAV_MIN_SIZE,
      ),
      true,
    );
    assert.equal(shouldCollapseNavbar(8, 4, 15), true);

    const collapsedState = resolveNavbarResizeState(4, 4, 15);
    assert.equal(collapsedState.isCollapsed, true);
    assert.equal(collapsedState.mode, "icon");
  });

  it("switches to expanded text/account mode when panel size exceeds threshold", () => {
    assert.equal(
      shouldCollapseNavbar(
        DEFAULT_NAV_MIN_SIZE,
        DEFAULT_NAV_COLLAPSED_SIZE,
        DEFAULT_NAV_MIN_SIZE,
      ),
      false,
    );
    assert.equal(shouldCollapseNavbar(18, 4, 15), false);

    const expandedState = resolveNavbarResizeState(16, 4, 15);
    assert.equal(expandedState.isCollapsed, false);
    assert.equal(expandedState.mode, "text");
  });

  it("maps collapsed state to display mode deterministically", () => {
    assert.equal(getNavbarDisplayMode(true), "icon");
    assert.equal(getNavbarDisplayMode(false), "text");
  });

  it("formats collapsed and layout cookies accurately", () => {
    assert.equal(
      formatCollapsedCookie(true),
      `${COLLAPSED_COOKIE_NAME}=true`,
    );
    assert.equal(
      formatCollapsedCookie(false),
      `${COLLAPSED_COOKIE_NAME}=false`,
    );
    assert.equal(
      formatLayoutCookie([20, 40, 40]),
      `${LAYOUT_COOKIE_NAME}=[20,40,40]`,
    );
  });
});
