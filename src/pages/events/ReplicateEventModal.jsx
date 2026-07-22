import { useEffect, useState } from "react";
import { replicateEvent } from "./eventsApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function ReplicateEventModal({
  isOpen,
  onClose,
  event,
  onReplicated,
}) {
  const { selectedOrganizationId } = useOrganization();
  const { alert, dialogProps, Dialog } = useAppDialog();
  const [includeLineResources, setIncludeLineResources] = useState(true);
  const [entriesDate, setEntriesDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    if (isOpen) {
      setIncludeLineResources(true);
      setEntriesDate("");
      setIsSubmitting(false);
    }
  }, [isOpen, event?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event?.id) return;

    setIsSubmitting(true);
    try {
      const payload = { include_line_resources: includeLineResources };
      if (entriesDate) {
        payload.entries_date = entriesDate;
      }
      const created = await replicateEvent(
        selectedOrganizationId,
        event.id,
        payload
      );
      onClose(false);
      onReplicated?.(created);
    } catch (err) {
      console.error("Replicate failed", err);
      await alert({
        title: "Replicate failed",
        message: err.message ?? "Failed to replicate event.",
        confirmVariant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <div
          className="modal show d-block"
          tabIndex="-1"
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Replicate Event</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => onClose(false)}
                  />
                </div>

                <div className="modal-body">
                  <p className="text-muted mb-3">
                    Create a copy of &ldquo;{event?.description}&rdquo;. The
                    new event description will include &ldquo;(copy)&rdquo; and
                    all entries will be draft.
                  </p>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="replicate-include-line-resources"
                      checked={includeLineResources}
                      onChange={(e) =>
                        setIncludeLineResources(e.target.checked)
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="replicate-include-line-resources"
                    >
                      Include line resources
                    </label>
                  </div>

                  <div className="mb-0">
                    <label
                      className="form-label"
                      htmlFor="replicate-entries-date"
                    >
                      Entries date{" "}
                      <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <input
                      id="replicate-entries-date"
                      className="form-control"
                      type="date"
                      value={entriesDate}
                      onChange={(e) => setEntriesDate(e.target.value)}
                    />
                    <div className="form-text">
                      Leave blank to keep the original entry dates.
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onClose(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary bi-copy"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Replicating…" : "Replicate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog {...dialogProps} />
    </>
  );
}
