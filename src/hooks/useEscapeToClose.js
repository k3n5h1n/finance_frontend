import { useEffect, useRef } from "react";

/** LIFO stack of Escape handlers; only the topmost overlay cancels. */
const escapeStack = [];
let listening = false;

function handleGlobalKeyDown(event) {
  if (event.key !== "Escape" && event.key !== "Esc") return;
  const top = escapeStack[escapeStack.length - 1];
  if (!top) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  top();
}

function pushEscapeHandler(handler) {
  escapeStack.push(handler);
  if (!listening) {
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    listening = true;
  }
  return () => {
    const index = escapeStack.lastIndexOf(handler);
    if (index >= 0) escapeStack.splice(index, 1);
    if (escapeStack.length === 0 && listening) {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
      listening = false;
    }
  };
}

/**
 * Close a modal/dialog when the user presses Escape (cancel, no save).
 * Nested overlays (e.g. AppDialog over a form modal) stack so Escape
 * dismisses the topmost open layer only.
 *
 * @param {boolean} isOpen
 * @param {() => void} onEscape  Typically () => onClose(false)
 */
export function useEscapeToClose(isOpen, onEscape) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isOpen) return;
    return pushEscapeHandler(() => onEscapeRef.current());
  }, [isOpen]);
}
