import { useEscapeToClose } from "../hooks/useEscapeToClose";
import "./app-dialog.css";

/**
 * In-app confirm / alert dialog. Use via useAppDialog() — not window.confirm/alert.
 */
export default function AppDialog({
  isOpen,
  mode = "confirm",
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}) {
  useEscapeToClose(isOpen, () => onCancel?.());

  if (!isOpen) return null;

  const isConfirm = mode === "confirm";
  const okLabel = confirmLabel ?? (isConfirm ? "Confirm" : "OK");

  return (
    <>
      <div className="modal-backdrop fade show app-dialog-backdrop" />
      <div
        className="modal fade show d-block app-dialog"
        tabIndex="-1"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="app-dialog-title">
                {title}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onCancel}
              />
            </div>
            <div className="modal-body" id="app-dialog-message">
              {message}
            </div>
            <div className="modal-footer">
              {isConfirm && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCancel}
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
              >
                {okLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
