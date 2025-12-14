"use client";

import { createElement } from "react";
import { action } from "storybook/actions";

const navigate = action("navigate");

/**
 * Mock Link component for Storybook.
 * Prevents actual browser navigation and logs to Actions panel.
 *
 * @see https://github.com/storybookjs/storybook/issues/30390
 */
export default function Link({ href, children, onClick, replace, ...props }) {
  const handleClick = (e) => {
    e.preventDefault();
    onClick?.(e);
    navigate({ href, replace: replace ?? false });
  };

  return createElement("a", { href, onClick: handleClick, ...props }, children);
}
