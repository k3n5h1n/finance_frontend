import { useState, useCallback, useRef } from "react";
import AppDialog from "../components/AppDialog";

/**
 * Promise-based in-app dialogs replacing window.confirm / window.alert
 * for application messages. Reserve native dialogs for browser actions
 * (e.g. unsaved navigation).
 */
export function useAppDialog() {
  const [dialogState, setDialogState] = useState(null);
  const resolveRef = useRef(null);

  const settle = useCallback((value) => {
    setDialogState(null);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(value);
  }, []);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({
        mode: "confirm",
        confirmVariant: "danger",
        ...options,
      });
    });
  }, []);

  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({
        mode: "alert",
        confirmVariant: "primary",
        title: options.title ?? "Notice",
        ...options,
      });
    });
  }, []);

  const dialogProps = dialogState
    ? {
        isOpen: true,
        ...dialogState,
        onConfirm: () => settle(dialogState.mode === "confirm" ? true : undefined),
        onCancel: () => settle(dialogState.mode === "confirm" ? false : undefined),
      }
    : { isOpen: false };

  return { confirm, alert, dialogProps, Dialog: AppDialog };
}
