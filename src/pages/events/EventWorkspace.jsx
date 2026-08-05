import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useOrganization } from "../../context/OrganizationContext";
import {
  getEvent,
  createEntryGroup,
  deleteEvent,
  deleteEntry,
  deleteEntryGroup,
  deleteEntryLine,
  deleteLineResource,
  postEntry,
  postEntryGroup,
  postEvent,
  updateEntry,
  updateEntryGroup,
  updateEntryLine,
  updateLineResource,
} from "./eventsApi";
import { listAccounts } from "../accounts/accountsApi";
import { listSuppliers } from "../suppliers/suppliersApi";
import { flattenAccountTreeForSelect } from "../accounts/accountTree";
import EntryModal from "./EntryModal";
import EntryGroupModal from "./EntryGroupModal";
import EntryLineModal from "./EntryLineModal";
import LineResourceModal from "./LineResourceModal";
import EventModal from "./EventModal";
import ReplicateEventModal from "./ReplicateEventModal";
import AccountCell from "./AccountCell";
import {
  normalizeEventTree,
  isEventEditable,
  isEntryEditable,
  canPostEntry,
  canPostEntryGroup,
  canDeleteEntryGroup,
  canPostEvent,
  getPostEntryBlockReason,
  getPostEntryGroupBlockReason,
  getDeleteEntryGroupBlockReason,
  getPostEventBlockReason,
  getPrimaryEntryGroup,
  nextDisplayOrder,
  getBalancingLineDefaults,
  getLineResourceDefaults,
  getEntryTotals,
  getLineResourcesTotal,
  lineResourcesMatchAmount,
  swapAdjacentDisplayOrder,
  applyEntryReorder,
  applyEntryGroupReorder,
  applyEntryLineReorder,
  applyLineResourceReorder,
  formatAmount,
  formatUnitCost,
  formatDate,
  formatDateTime,
  formatEntryGroupType,
  formatEventType,
} from "./eventUtils";
import { useAppDialog } from "../../hooks/useAppDialog";
import ReorderButtons from "../../components/ReorderButtons";
import { entryLineToUpdatePayload } from "../../utils/validation/entryLineSchema";
import { lineResourceToUpdatePayload } from "../../utils/validation/lineResourceSchema";
import { entryToUpdatePayload } from "../../utils/validation/entrySchema";
import { entryGroupToUpdatePayload } from "../../utils/validation/entryGroupSchema";
import "./events.css";

export default function EventWorkspace() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrganizationId } = useOrganization();
  const { confirm, alert, dialogProps, Dialog } = useAppDialog();

  const navigateBack = useCallback(() => {
    if (location.state?.fromAccountHistory || location.state?.fromEventsList) {
      navigate(-1);
      return;
    }
    navigate("/accounting/events");
  }, [location.state, navigate]);

  const backLinkLabel = location.state?.fromAccountHistory
    ? "Back to account history"
    : "Back to transactions";
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLineIds, setExpandedLineIds] = useState(new Set());
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [entryModal, setEntryModal] = useState({
    open: false,
    mode: "add",
    entry: null,
    entryGroupId: null,
    displayOrder: 1,
  });
  const [lineModal, setLineModal] = useState({
    open: false,
    mode: "add",
    line: null,
    entryId: null,
    displayOrder: 1,
    balancingDefaults: null,
  });
  const [lineResourceModal, setLineResourceModal] = useState({
    open: false,
    mode: "add",
    resource: null,
    entryLineId: null,
    displayOrder: 1,
    defaults: null,
  });
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [replicateModalOpen, setReplicateModalOpen] = useState(false);
  const [entryGroupModal, setEntryGroupModal] = useState({
    open: false,
    mode: "edit",
    entryGroup: null,
  });
  const [reordering, setReordering] = useState(false);

  const reloadEvent = useCallback(
    async ({ silent = false } = {}) => {
      if (selectedOrganizationId == null || !eventId) return;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await getEvent(selectedOrganizationId, eventId);
        setEvent(normalizeEventTree(data));
      } catch (err) {
        console.error("Failed to fetch event:", err);
        if (silent) {
          await alert({
            title: "Refresh failed",
            message: err.message ?? "Failed to refresh event.",
            confirmVariant: "danger",
          });
        } else {
          setEvent(null);
          setError(err.message ?? "Failed to load event.");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [selectedOrganizationId, eventId, alert]
  );

  /** Refetch event tree without unmounting the workspace (preserves scroll). */
  const refreshEvent = useCallback(
    () => reloadEvent({ silent: true }),
    [reloadEvent]
  );

  useEffect(() => {
    reloadEvent();
  }, [reloadEvent]);

  const isEditable = useMemo(() => isEventEditable(event), [event]);

  useEffect(() => {
    if (selectedOrganizationId == null) return;

    let cancelled = false;

    async function loadLookups() {
      try {
        const [accountsData, suppliersData] = await Promise.all([
          listAccounts(selectedOrganizationId),
          listSuppliers(selectedOrganizationId),
        ]);
        if (!cancelled) {
          setAccounts(accountsData);
          setSuppliers(suppliersData);
        }
      } catch (err) {
        console.error("Failed to load lookup data:", err);
      }
    }

    loadLookups();

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId]);

  const accountOptions = useMemo(
    () =>
      flattenAccountTreeForSelect(
        accounts.filter((account) => account.active !== false)
      ),
    [accounts]
  );

  const supplierOptions = useMemo(
    () =>
      [...suppliers]
        .filter((supplier) => supplier.active !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  const entriesToRender = useMemo(() => {
    if (!event?.entry_groups?.length) return [];

    return event.entry_groups.map((group) => ({
      group,
      entries: group.entries ?? [],
    }));
  }, [event]);

  const hasPrimaryEntryGroup = useMemo(
    () =>
      (event?.entry_groups ?? []).some(
        (group) => group.type?.toLowerCase() === "primary"
      ),
    [event]
  );

  const toggleLineResources = (lineId) => {
    setExpandedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const closeEntryModal = (saved) => {
    setEntryModal((prev) => ({ ...prev, open: false }));
    if (saved) refreshEvent();
  };

  const closeLineModal = (saved) => {
    setLineModal((prev) => ({ ...prev, open: false }));
    if (saved) refreshEvent();
  };

  const closeLineResourceModal = (saved) => {
    setLineResourceModal((prev) => ({ ...prev, open: false }));
    if (saved) refreshEvent();
  };

  const expandLine = (lineId) => {
    setExpandedLineIds((prev) => new Set(prev).add(lineId));
  };

  const resolveEntryGroupId = async (group) => {
    if (group?.id != null) return group.id;

    const existing = getPrimaryEntryGroup(event);
    if (existing?.id != null) return existing.id;

    const created = await createEntryGroup(selectedOrganizationId, event.id, {
      description: event.description,
      type: "primary",
      display_order: 1,
    });

    return created.id;
  };

  const openEditEntryGroup = (entryGroup) => {
    setEntryGroupModal({ open: true, mode: "edit", entryGroup });
  };

  const handleDeleteEntryGroup = async (group) => {
    const blockReason = getDeleteEntryGroupBlockReason(group);
    if (blockReason) {
      await alert({
        title: "Cannot delete entry group",
        message: blockReason,
      });
      return;
    }

    const entryCount = group.entries?.length ?? 0;
    const confirmed = await confirm({
      title: "Delete entry group",
      message:
        entryCount > 0
          ? `Delete entry group "${group.description}"? All ${entryCount} entr${entryCount === 1 ? "y" : "ies"} and their lines will be removed.`
          : `Delete entry group "${group.description}"?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteEntryGroup(selectedOrganizationId, group.id);
      refreshEvent();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete entry group.",
        confirmVariant: "danger",
      });
    }
  };

  const openAddEntryGroup = () => {
    setEntryGroupModal({ open: true, mode: "add", entryGroup: null });
  };

  const closeEntryGroupModal = (saved) => {
    setEntryGroupModal({ open: false, mode: "edit", entryGroup: null });
    if (saved) refreshEvent();
  };

  const openAddEntry = async (group, entries) => {
    try {
      const entryGroupId = await resolveEntryGroupId(group);
      setEntryModal({
        open: true,
        mode: "add",
        entry: null,
        entryGroupId,
        displayOrder: nextDisplayOrder(entries),
      });
    } catch (err) {
      await alert({
        title: "Could not add entry",
        message: err.message ?? "Could not prepare entry group.",
        confirmVariant: "primary",
      });
    }
  };

  const openEditEntry = (entry) => {
    setEntryModal({
      open: true,
      mode: "edit",
      entry,
      entryGroupId: entry.entry_group_id,
      displayOrder: entry.display_order,
    });
  };

  const handleDeleteEntry = async (entry) => {
    const confirmed = await confirm({
      title: "Delete entry",
      message: `Delete entry "${entry.description}"?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteEntry(selectedOrganizationId, entry.id);
      refreshEvent();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete entry.",
        confirmVariant: "danger",
      });
    }
  };

  const handlePostEntry = async (entry) => {
    const blockReason = getPostEntryBlockReason(entry);
    if (blockReason) {
      await alert({
        title: "Cannot post entry",
        message: blockReason,
      });
      return;
    }

    const confirmed = await confirm({
      title: "Post entry",
      message: `Post entry "${entry.description}"? Posted entries cannot be edited or deleted.`,
      confirmLabel: "Post",
      confirmVariant: "success",
    });
    if (!confirmed) return;

    try {
      await postEntry(selectedOrganizationId, entry.id);
      refreshEvent();
    } catch (err) {
      await alert({
        title: "Post failed",
        message: err.message ?? "Failed to post entry.",
        confirmVariant: "danger",
      });
    }
  };

  const handlePostEntryGroup = async (group) => {
    const blockReason = getPostEntryGroupBlockReason(group);
    if (blockReason) {
      await alert({
        title: "Cannot post entry group",
        message: blockReason,
      });
      return;
    }

    const confirmed = await confirm({
      title: "Post entry group",
      message: `Post all draft entries in "${group.description}"? Posted entries cannot be edited or deleted.`,
      confirmLabel: "Post",
      confirmVariant: "success",
    });
    if (!confirmed) return;

    try {
      await postEntryGroup(selectedOrganizationId, group.id);
      refreshEvent();
    } catch (err) {
      await alert({
        title: "Post failed",
        message: err.message ?? "Failed to post entry group.",
        confirmVariant: "danger",
      });
    }
  };

  const handlePostEvent = async () => {
    const blockReason = getPostEventBlockReason(event);
    if (blockReason) {
      await alert({
        title: "Cannot post event",
        message: blockReason,
      });
      return;
    }

    const confirmed = await confirm({
      title: "Post event",
      message: `Post all draft entries in "${event.description}"? Posted entries cannot be edited or deleted.`,
      confirmLabel: "Post",
      confirmVariant: "success",
    });
    if (!confirmed) return;

    try {
      await postEvent(selectedOrganizationId, event.id);
      refreshEvent();
    } catch (err) {
      await alert({
        title: "Post failed",
        message: err.message ?? "Failed to post event.",
        confirmVariant: "danger",
      });
    }
  };

  const handleMoveEntryGroup = async (group, direction) => {
    const swapped = swapAdjacentDisplayOrder(event.entry_groups, group.id, direction);
    if (!swapped) return;

    setReordering(true);
    try {
      await Promise.all(
        swapped.map((updatedGroup) =>
          updateEntryGroup(
            selectedOrganizationId,
            updatedGroup.id,
            entryGroupToUpdatePayload(updatedGroup)
          )
        )
      );
      setEvent((prev) => applyEntryGroupReorder(prev, swapped));
    } catch (err) {
      await alert({
        title: "Reorder failed",
        message: err.message ?? "Failed to reorder entry group.",
        confirmVariant: "danger",
      });
    } finally {
      setReordering(false);
    }
  };

  const handleMoveEntry = async (group, entry, direction) => {
    const swapped = swapAdjacentDisplayOrder(group.entries, entry.id, direction);
    if (!swapped) return;

    setReordering(true);
    try {
      await Promise.all(
        swapped.map((updatedEntry) =>
          updateEntry(
            selectedOrganizationId,
            updatedEntry.id,
            entryToUpdatePayload(updatedEntry)
          )
        )
      );
      setEvent((prev) => applyEntryReorder(prev, group.id, swapped));
    } catch (err) {
      await alert({
        title: "Reorder failed",
        message: err.message ?? "Failed to reorder entry.",
        confirmVariant: "danger",
      });
    } finally {
      setReordering(false);
    }
  };

  const handleMoveEntryLine = async (entry, line, direction) => {
    const swapped = swapAdjacentDisplayOrder(entry.entry_lines, line.id, direction);
    if (!swapped) return;

    setReordering(true);
    try {
      await Promise.all(
        swapped.map((updatedLine) =>
          updateEntryLine(
            selectedOrganizationId,
            updatedLine.id,
            entryLineToUpdatePayload(updatedLine)
          )
        )
      );
      setEvent((prev) => applyEntryLineReorder(prev, entry.id, swapped));
    } catch (err) {
      await alert({
        title: "Reorder failed",
        message: err.message ?? "Failed to reorder entry line.",
        confirmVariant: "danger",
      });
    } finally {
      setReordering(false);
    }
  };

  const handleMoveLineResource = async (line, resource, direction) => {
    const swapped = swapAdjacentDisplayOrder(
      line.line_resources,
      resource.id,
      direction
    );
    if (!swapped) return;

    setReordering(true);
    try {
      await Promise.all(
        swapped.map((updatedResource) =>
          updateLineResource(
            selectedOrganizationId,
            updatedResource.id,
            lineResourceToUpdatePayload(updatedResource)
          )
        )
      );
      setEvent((prev) => applyLineResourceReorder(prev, line.id, swapped));
    } catch (err) {
      await alert({
        title: "Reorder failed",
        message: err.message ?? "Failed to reorder line resource.",
        confirmVariant: "danger",
      });
    } finally {
      setReordering(false);
    }
  };

  const openAddLine = (entry) => {
    setLineModal({
      open: true,
      mode: "add",
      line: null,
      entryId: entry.id,
      displayOrder: nextDisplayOrder(entry.entry_lines),
      balancingDefaults: getBalancingLineDefaults(entry),
    });
  };

  const openEditLine = (entry, line) => {
    setLineModal({
      open: true,
      mode: "edit",
      line,
      entryId: entry.id,
      displayOrder: line.display_order,
      balancingDefaults: null,
    });
  };

  const handleDeleteLine = async (line) => {
    const confirmed = await confirm({
      title: "Delete line",
      message: "Delete this line?",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteEntryLine(selectedOrganizationId, line.id);
      refreshEvent();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete line.",
        confirmVariant: "danger",
      });
    }
  };

  const openAddLineResource = (line) => {
    expandLine(line.id);
    setLineResourceModal({
      open: true,
      mode: "add",
      resource: null,
      entryLineId: line.id,
      displayOrder: nextDisplayOrder(line.line_resources),
      defaults: getLineResourceDefaults(line),
    });
  };

  const openEditLineResource = (line, resource) => {
    expandLine(line.id);
    setLineResourceModal({
      open: true,
      mode: "edit",
      resource,
      entryLineId: line.id,
      displayOrder: resource.display_order,
      defaults: null,
    });
  };

  const handleDeleteLineResource = async (resource) => {
    const confirmed = await confirm({
      title: "Delete line resource",
      message: `Delete "${resource.description}"?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteLineResource(selectedOrganizationId, resource.id);
      refreshEvent();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete line resource.",
        confirmVariant: "danger",
      });
    }
  };

  const handleDeleteEvent = async () => {
    const confirmed = await confirm({
      title: "Delete event",
      message: `Delete event "${event.description}"? All entries and lines will be removed.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteEvent(selectedOrganizationId, event.id);
      navigateBack();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete event.",
        confirmVariant: "danger",
      });
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  if (error) {
    return (
      <>
        <BackLink onBack={navigateBack} label={backLinkLabel} />
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
        <Dialog {...dialogProps} />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <BackLink onBack={navigateBack} label={backLinkLabel} />
        <div className="alert alert-warning mt-3" role="alert">
          Event not found.
        </div>
        <Dialog {...dialogProps} />
      </>
    );
  }

  const canPostWholeEvent = isEditable && canPostEvent(event);
  const postEventBlockReason = getPostEventBlockReason(event);

  return (
    <div className="event-workspace">
      <BackLink onBack={navigateBack} label={backLinkLabel} />

      <header className="event-workspace-header card mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h3 className="mb-2">{event.description}</h3>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <StatusBadge status={event.status} />
                <span className="badge text-bg-light">
                  {formatEventType(event.type) || "—"}
                </span>
                <span className="badge text-bg-light">
                  {event.is_external ? "External" : "Internal"}
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="d-flex flex-wrap justify-content-end gap-1 mb-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary bi-pencil"
                  title="Edit event"
                  onClick={() => setEventModalOpen(true)}
                ></button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary bi-copy"
                  title="Replicate event"
                  onClick={() => setReplicateModalOpen(true)}
                ></button>
                {isEditable && (
                  <>
                    <PostActionButton
                      canPost={canPostWholeEvent}
                      blockReason={postEventBlockReason}
                      onClick={handlePostEvent}
                      label="Post event"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={openAddEntryGroup}
                    >
                      Add Group
                    </button>
                    {entriesToRender.length === 0 && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => openAddEntry(null, [])}
                      >
                        Add Entry
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger bi-trash"
                      title="Delete event"
                      onClick={handleDeleteEvent}
                    ></button>
                  </>
                )}
              </div>
              <div className="text-muted small">
                <div>Created {formatDateTime(event.created_dt)}</div>
                <div>Updated {formatDateTime(event.updated_dt)}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {entriesToRender.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <p className="mb-3">
              This event has no entry groups yet.
              {isEditable
                ? " Add a group or an entry to start building the transaction."
                : ""}
            </p>
            {isEditable && (
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={openAddEntryGroup}
                >
                  Add Group
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openAddEntry(null, [])}
                >
                  Add Entry
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {entriesToRender.map(({ group, entries }, groupIndex) => {
        const canPostGroup = isEditable && canPostEntryGroup(group);
        const postGroupBlockReason = getPostEntryGroupBlockReason(group);
        const canDeleteGroup = isEditable && canDeleteEntryGroup(group);
        const deleteGroupBlockReason = getDeleteEntryGroupBlockReason(group);
        const entryGroupCount = entriesToRender.length;

        return (
        <section key={group.id} className="mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div className="event-group-header d-flex align-items-center gap-2">
              <h5 className="mb-0">{group.description}</h5>
              <span className="badge text-bg-light">
                {formatEntryGroupType(group.type)}
              </span>
            </div>

            {isEditable && (
              <div className="d-flex flex-nowrap gap-1 align-items-center">
                <ReorderButtons
                  className="me-1"
                  canMoveUp={groupIndex > 0}
                  canMoveDown={groupIndex < entryGroupCount - 1}
                  disabled={reordering}
                  onMoveUp={() => handleMoveEntryGroup(group, "up")}
                  onMoveDown={() => handleMoveEntryGroup(group, "down")}
                />
                <PostActionButton
                  canPost={canPostGroup}
                  blockReason={postGroupBlockReason}
                  onClick={() => handlePostEntryGroup(group)}
                  label="Post entry group"
                />
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => openAddEntry(group, entries)}
                >
                  Add Entry
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary bi-pencil"
                  title="Edit entry group"
                  onClick={() => openEditEntryGroup(group)}
                ></button>
                <span
                  className={
                    !canDeleteGroup ? "event-post-btn-wrap d-inline-block" : "d-inline-block"
                  }
                  title={!canDeleteGroup ? deleteGroupBlockReason : undefined}
                >
                  <button
                    type="button"
                    className="btn btn-sm btn-danger bi-trash"
                    title={canDeleteGroup ? "Delete entry group" : undefined}
                    disabled={!canDeleteGroup}
                    style={!canDeleteGroup ? { pointerEvents: "none" } : undefined}
                    onClick={() => handleDeleteEntryGroup(group)}
                  ></button>
                </span>
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <p className="text-muted">No entries in this group.</p>
          ) : (
            entries.map((entry, entryIndex) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                entryIndex={entryIndex}
                entryCount={entries.length}
                accounts={accounts}
                isEditable={isEditable && isEntryEditable(entry)}
                canReorder={isEditable}
                expandedLineIds={expandedLineIds}
                onToggleLineResources={toggleLineResources}
                onEditEntry={() => openEditEntry(entry)}
                onDeleteEntry={() => handleDeleteEntry(entry)}
                onPostEntry={() => handlePostEntry(entry)}
                onMoveEntry={(direction) => handleMoveEntry(group, entry, direction)}
                onMoveEntryLine={(line, direction) =>
                  handleMoveEntryLine(entry, line, direction)
                }
                onMoveLineResource={handleMoveLineResource}
                reordering={reordering}
                onAddLine={() => openAddLine(entry)}
                onEditLine={(line) => openEditLine(entry, line)}
                onDeleteLine={handleDeleteLine}
                onAddLineResource={openAddLineResource}
                onEditLineResource={openEditLineResource}
                onDeleteLineResource={handleDeleteLineResource}
              />
            ))
          )}
        </section>
        );
      })}

      <EntryModal
        isOpen={entryModal.open}
        mode={entryModal.mode}
        entry={entryModal.entry}
        entryGroupId={entryModal.entryGroupId}
        displayOrder={entryModal.displayOrder}
        onClose={closeEntryModal}
      />

      <EntryGroupModal
        isOpen={entryGroupModal.open}
        mode={entryGroupModal.mode}
        entryGroup={entryGroupModal.entryGroup}
        eventId={event.id}
        displayOrder={nextDisplayOrder(event.entry_groups)}
        hasPrimaryGroup={hasPrimaryEntryGroup}
        onClose={closeEntryGroupModal}
      />

      <EventModal
        isOpen={eventModalOpen}
        mode="edit"
        event={event}
        onClose={(saved) => {
          setEventModalOpen(false);
          if (saved) refreshEvent();
        }}
      />

      <ReplicateEventModal
        isOpen={replicateModalOpen}
        event={event}
        onClose={() => setReplicateModalOpen(false)}
        onReplicated={(created) =>
          navigate(`/accounting/events/${created.id}`, {
            state: location.state,
          })
        }
      />

      <EntryLineModal
        isOpen={lineModal.open}
        mode={lineModal.mode}
        line={lineModal.line}
        entryId={lineModal.entryId}
        displayOrder={lineModal.displayOrder}
        balancingDefaults={lineModal.balancingDefaults}
        accountOptions={accountOptions}
        supplierOptions={supplierOptions}
        onClose={closeLineModal}
      />

      <LineResourceModal
        key={
          lineResourceModal.open
            ? `${lineResourceModal.mode}-${lineResourceModal.resource?.id ?? lineResourceModal.entryLineId}-${lineResourceModal.displayOrder}`
            : "line-resource-closed"
        }
        isOpen={lineResourceModal.open}
        mode={lineResourceModal.mode}
        resource={lineResourceModal.resource}
        entryLineId={lineResourceModal.entryLineId}
        displayOrder={lineResourceModal.displayOrder}
        defaults={lineResourceModal.defaults}
        onClose={closeLineResourceModal}
      />

      <Dialog {...dialogProps} />
    </div>
  );
}

function BackLink({ onBack, label }) {
  return (
    <button
      type="button"
      className="btn btn-link ps-0 mb-2 event-back-link"
      onClick={onBack}
    >
      <i className="bi bi-arrow-left me-1"></i>
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const normalized = status?.toLowerCase();
  const className =
    normalized === "posted"
      ? "text-bg-success"
      : normalized === "draft"
        ? "text-bg-secondary"
        : "text-bg-light";

  return (
    <span className={`badge ${className} text-capitalize`}>
      {status ?? "—"}
    </span>
  );
}

function PostActionButton({ canPost, blockReason, onClick, label }) {
  return (
    <span
      className={!canPost ? "event-post-btn-wrap d-inline-block" : "d-inline-block"}
      title={!canPost ? blockReason : undefined}
    >
      <button
        type="button"
        className="btn btn-sm btn-success bi-check-circle"
        title={canPost ? label : undefined}
        disabled={!canPost}
        style={!canPost ? { pointerEvents: "none" } : undefined}
        onClick={onClick}
      ></button>
    </span>
  );
}

function EntryCard({
  entry,
  entryIndex,
  entryCount,
  accounts,
  isEditable,
  canReorder,
  expandedLineIds,
  onToggleLineResources,
  onEditEntry,
  onDeleteEntry,
  onPostEntry,
  onMoveEntry,
  onMoveEntryLine,
  onMoveLineResource,
  reordering,
  onAddLine,
  onEditLine,
  onDeleteLine,
  onAddLineResource,
  onEditLineResource,
  onDeleteLineResource,
}) {
  const { totalDebit, totalCredit, balanced } = getEntryTotals(entry);
  const postBlockReason = getPostEntryBlockReason(entry);
  const canPost = isEditable && canPostEntry(entry);
  const entryLines = entry.entry_lines ?? [];

  return (
    <article className="card mb-3 event-entry-card">
      <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <strong>{entry.description}</strong>
          <span className="text-muted ms-2">{formatDate(entry.date)}</span>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-1">
          <PostedBadge isPosted={entry.is_posted} />
          {canReorder && (
            <ReorderButtons
              canMoveUp={entryIndex > 0}
              canMoveDown={entryIndex < entryCount - 1}
              disabled={reordering}
              onMoveUp={() => onMoveEntry("up")}
              onMoveDown={() => onMoveEntry("down")}
            />
          )}
          {isEditable && (
            <>
              <PostActionButton
                canPost={canPost}
                blockReason={postBlockReason}
                onClick={onPostEntry}
                label="Post entry"
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                title="Add line"
                onClick={onAddLine}
              >
                Add Line
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary bi-pencil"
                title="Edit entry"
                onClick={onEditEntry}
              ></button>
              <button
                type="button"
                className="btn btn-sm btn-danger bi-trash"
                title="Delete entry"
                onClick={onDeleteEntry}
              ></button>
            </>
          )}
        </div>
      </div>

      <div className="card-body p-0">
        {(entry.entry_lines ?? []).length === 0 ? (
          <p className="text-muted mb-0 p-3">
            No lines yet.
            {isEditable ? " Use Add Line to record debits and credits." : ""}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm mb-0 event-lines-table">
              <thead>
                <tr>
                  <th style={{ width: "1%" }}></th>
                  <th>Account</th>
                  <th>Supplier</th>
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  {isEditable && (
                    <th className="text-end" style={{ width: "1%" }}></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {entryLines.map((line, lineIndex) => (
                  <EntryLineRows
                    key={line.id}
                    line={line}
                    lineIndex={lineIndex}
                    lineCount={entryLines.length}
                    accounts={accounts}
                    isEditable={isEditable}
                    reordering={reordering}
                    isExpanded={expandedLineIds.has(line.id)}
                    onToggle={() => onToggleLineResources(line.id)}
                    onEdit={() => onEditLine(line)}
                    onDelete={() => onDeleteLine(line)}
                    onMoveLine={(direction) => onMoveEntryLine(line, direction)}
                    onAddLineResource={() => onAddLineResource(line)}
                    onEditLineResource={(item) => onEditLineResource(line, item)}
                    onDeleteLineResource={onDeleteLineResource}
                    onMoveLineResource={(item, direction) =>
                      onMoveLineResource(line, item, direction)
                    }
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="table-light fw-semibold">
                  <td colSpan={3} className="text-end">
                    Totals
                    {!balanced && (
                      <span className="badge text-bg-danger ms-2">Out of balance</span>
                    )}
                    {balanced && (
                      <span className="badge text-bg-success ms-2">Balanced</span>
                    )}
                  </td>
                  <td className="text-end">{formatAmount(totalDebit)}</td>
                  <td className="text-end">{formatAmount(totalCredit)}</td>
                  {isEditable && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </article>
  );
}

function PostedBadge({ isPosted }) {
  return isPosted ? (
    <span className="badge text-bg-success">Posted</span>
  ) : (
    <span className="badge text-bg-warning text-dark">Draft</span>
  );
}

function EntryLineRows({
  line,
  lineIndex,
  lineCount,
  accounts,
  isEditable,
  reordering,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onMoveLine,
  onAddLineResource,
  onEditLineResource,
  onDeleteLineResource,
  onMoveLineResource,
}) {
  const lineResources = line.line_resources ?? [];
  const hasLineResources = lineResources.length > 0;
  const showLineResourcesPanel = isExpanded && (hasLineResources || isEditable);
  const itemsMatch = lineResourcesMatchAmount(line);
  const lineAmount = (line.debit ?? 0) > 0 ? line.debit : line.credit;
  const colSpan = isEditable ? 6 : 5;
  const canExpand = hasLineResources || isEditable;

  return (
    <>
      <tr>
        <td className="text-center">
          {canExpand ? (
            <button
              type="button"
              className="btn btn-sm btn-link p-0 event-line-toggle"
              aria-expanded={isExpanded}
              title={
                isExpanded
                  ? "Hide line resources"
                  : hasLineResources
                    ? "Show line resources"
                    : "Line resources"
              }
              onClick={onToggle}
            >
              <i
                className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}
              ></i>
            </button>
          ) : (
            <span className="event-line-spacer" aria-hidden="true"></span>
          )}
        </td>
        <td>
          <AccountCell account={line.account} accounts={accounts} />
        </td>
        <td>{line.supplier?.name ?? "—"}</td>
        <td className="text-end">
          {(line.debit ?? 0) > 0 ? formatAmount(line.debit) : "—"}
        </td>
        <td className="text-end">
          {(line.credit ?? 0) > 0 ? formatAmount(line.credit) : "—"}
        </td>
        {isEditable && (
          <td className="text-end text-nowrap">
            <ReorderButtons
              className="me-1"
              canMoveUp={lineIndex > 0}
              canMoveDown={lineIndex < lineCount - 1}
              disabled={reordering}
              onMoveUp={() => onMoveLine("up")}
              onMoveDown={() => onMoveLine("down")}
            />
            <button
              type="button"
              className="btn btn-sm btn-secondary bi-pencil me-1"
              title="Edit line"
              onClick={onEdit}
            ></button>
            <button
              type="button"
              className="btn btn-sm btn-danger bi-trash"
              title="Delete line"
              onClick={onDelete}
            ></button>
          </td>
        )}
      </tr>

      {showLineResourcesPanel && (
        <tr className="event-line-resources-row">
          <td colSpan={colSpan} className="p-0">
            <div className="event-line-resources-panel">
              {!itemsMatch && hasLineResources && (
                <div className="alert alert-warning py-2 px-3 mb-2 small">
                  Line resources total {formatAmount(getLineResourcesTotal(line))} does not
                  match line amount {formatAmount(lineAmount)}.
                </div>
              )}

              {isEditable && (
                <div className="d-flex justify-content-end mb-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={onAddLineResource}
                  >
                    Add Line Resource
                  </button>
                </div>
              )}

              {hasLineResources ? (
                <table className="table table-sm table-borderless mb-0 event-line-resources-table">
                  <thead>
                    <tr className="text-muted small">
                      <th>Description</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Unit</th>
                      <th className="text-end">Unit Cost</th>
                      <th className="text-end">Extended</th>
                      {isEditable && (
                        <th className="text-end" style={{ width: "1%" }}></th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lineResources.map((item, itemIndex) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td className="text-end">{item.quantity}</td>
                        <td className="text-end">{item.unit_measure ?? "—"}</td>
                        <td className="text-end">{formatUnitCost(item.unit_amount)}</td>
                        <td className="text-end">{formatAmount(item.extended_amount)}</td>
                        {isEditable && (
                          <td className="text-end text-nowrap">
                            <ReorderButtons
                              className="me-1"
                              canMoveUp={itemIndex > 0}
                              canMoveDown={itemIndex < lineResources.length - 1}
                              disabled={reordering}
                              onMoveUp={() => onMoveLineResource(item, "up")}
                              onMoveDown={() => onMoveLineResource(item, "down")}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary bi-pencil me-1"
                              title="Edit line resource"
                              onClick={() => onEditLineResource(item)}
                            ></button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger bi-trash"
                              title="Delete line resource"
                              onClick={() => onDeleteLineResource(item)}
                            ></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted small mb-0">
                  No line resources yet.
                  {isEditable ? " Add items to break down this line amount." : ""}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
