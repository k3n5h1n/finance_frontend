import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useOrganization } from "../../context/OrganizationContext";
import { listEvents, deleteEvent } from "./eventsApi";
import { listSuppliers } from "../suppliers/suppliersApi";
import EventModal from "./EventModal";
import ReplicateEventModal from "./ReplicateEventModal";
import { formatDate } from "./eventUtils";
import { useAppDialog } from "../../hooks/useAppDialog";
import ListPagination from "../../components/ListPagination";
import {
  getSearchParam,
  getPositiveIntParam,
  patchListSearchParams,
  clearListSearchParams,
} from "../../utils/listSearchParams";
import "./events.css";

const DESCRIPTION_DEBOUNCE_MS = 400;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_NUMBER = 1;

const LIST_PARAM_KEYS = [
  "description_contains",
  "entries_start_on_or_after",
  "entries_end_on_or_before",
  "supplier_id",
  "status",
  "page_number",
  "page_size",
];

const LIST_PARAM_DEFAULTS = {
  page_number: DEFAULT_PAGE_NUMBER,
  page_size: DEFAULT_PAGE_SIZE,
};

const EVENT_LIST_LOCATION_STATE = { fromEventsList: true };

function parseStatusParam(value) {
  return value === "draft" || value === "posted" ? value : "";
}

export default function EventsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedOrganizationId } = useOrganization();
  const { confirm, alert, dialogProps, Dialog } = useAppDialog();
  const [events, setEvents] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [eventModal, setEventModal] = useState({
    open: false,
    mode: "add",
    event: null,
  });
  const [replicateModal, setReplicateModal] = useState({
    open: false,
    event: null,
  });

  const descriptionFilter = getSearchParam(searchParams, "description_contains");
  const entriesStartOnOrAfter = getSearchParam(
    searchParams,
    "entries_start_on_or_after"
  );
  const entriesEndOnOrBefore = getSearchParam(
    searchParams,
    "entries_end_on_or_before"
  );
  const supplierId = getSearchParam(searchParams, "supplier_id");
  const statusFilter = parseStatusParam(getSearchParam(searchParams, "status"));
  const pageNumber = getPositiveIntParam(
    searchParams,
    "page_number",
    DEFAULT_PAGE_NUMBER
  );
  const pageSize = getPositiveIntParam(
    searchParams,
    "page_size",
    DEFAULT_PAGE_SIZE
  );

  const [descriptionInput, setDescriptionInput] = useState(descriptionFilter);
  const prevOrgIdRef = useRef(selectedOrganizationId);

  const patchParams = useCallback(
    (updates) => {
      patchListSearchParams(setSearchParams, updates, {
        defaults: LIST_PARAM_DEFAULTS,
        replace: true,
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    setDescriptionInput(descriptionFilter);
  }, [descriptionFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = descriptionInput.trim();
      if (next === descriptionFilter) return;
      patchParams({
        description_contains: next || null,
        page_number: DEFAULT_PAGE_NUMBER,
      });
    }, DESCRIPTION_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [descriptionInput, descriptionFilter, patchParams]);

  useEffect(() => {
    const prevOrgId = prevOrgIdRef.current;
    if (prevOrgId != null && prevOrgId !== selectedOrganizationId) {
      clearListSearchParams(setSearchParams, LIST_PARAM_KEYS);
    }
    prevOrgIdRef.current = selectedOrganizationId;
  }, [selectedOrganizationId, setSearchParams]);

  const supplierOptions = useMemo(
    () => [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  const hasActiveFilters = Boolean(
    descriptionInput.trim() ||
      descriptionFilter.trim() ||
      entriesStartOnOrAfter ||
      entriesEndOnOrBefore ||
      supplierId ||
      statusFilter
  );

  const listFilters = useMemo(
    () => ({
      description_contains: descriptionFilter,
      entries_start_on_or_after: entriesStartOnOrAfter || undefined,
      entries_end_on_or_before: entriesEndOnOrBefore || undefined,
      supplier_id: supplierId || undefined,
      status: statusFilter || undefined,
      page_number: pageNumber,
      page_size: pageSize,
    }),
    [
      descriptionFilter,
      entriesStartOnOrAfter,
      entriesEndOnOrBefore,
      supplierId,
      statusFilter,
      pageNumber,
      pageSize,
    ]
  );

  useEffect(() => {
    if (selectedOrganizationId == null) return;

    let cancelled = false;

    async function loadSuppliers() {
      try {
        const data = await listSuppliers(selectedOrganizationId);
        if (!cancelled) setSuppliers(data);
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
        if (!cancelled) setSuppliers([]);
      }
    }

    loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId]);

  const fetchEvents = useCallback(async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listEvents(selectedOrganizationId, listFilters);
      setEvents(data.results);
      setTotalCount(data.total_count);
      setTotalPages(data.total_pages);
      if (
        data.page_number !== pageNumber ||
        data.page_size !== pageSize
      ) {
        patchParams({
          page_number: data.page_number,
          page_size: data.page_size,
        });
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
      setTotalCount(0);
      setTotalPages(1);
      setError(err.message ?? "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedOrganizationId,
    listFilters,
    pageNumber,
    pageSize,
    patchParams,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const clearFilters = () => {
    setDescriptionInput("");
    clearListSearchParams(setSearchParams, LIST_PARAM_KEYS);
  };

  const handlePageChange = (nextPage) => {
    patchParams({ page_number: nextPage });
  };

  const handlePageSizeChange = (nextPageSize) => {
    patchParams({
      page_size: nextPageSize,
      page_number: DEFAULT_PAGE_NUMBER,
    });
  };

  const handleDeleteEvent = async (event) => {
    const confirmed = await confirm({
      title: "Delete event",
      message: `Delete event "${event.description}"? All entries and lines will be removed.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteEvent(selectedOrganizationId, event.id);
      fetchEvents();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete event.",
        confirmVariant: "danger",
      });
    }
  };

  const isDraft = (event) => event.status?.toLowerCase() === "draft";

  const openAddModal = () => {
    setEventModal({ open: true, mode: "add", event: null });
  };

  const openEditModal = (event) => {
    setEventModal({ open: true, mode: "edit", event });
  };

  const openReplicateModal = (event) => {
    setReplicateModal({ open: true, event });
  };

  const closeEventModal = (saved) => {
    setEventModal((prev) => ({ ...prev, open: false }));
    if (saved) fetchEvents();
  };

  const openEventDetail = (eventId) => {
    navigate(`/accounting/events/${eventId}`, {
      state: EVENT_LIST_LOCATION_STATE,
    });
  };

  const emptyMessage = hasActiveFilters
    ? "No events match these filters."
    : "No events found";

  const eventsPagination = (idPrefix, marginClass) => (
    <div className={marginClass}>
      <ListPagination
        idPrefix={idPrefix}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        disabled={loading}
      />
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Transactions</h3>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddModal}
        >
          Add Event
        </button>
      </div>

      <div className="card mb-4 events-list-filters">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label" htmlFor="events-filter-description">
                Description
              </label>
              <input
                id="events-filter-description"
                type="search"
                className="form-control"
                placeholder="Contains…"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="events-filter-status">
                Status
              </label>
              <select
                id="events-filter-status"
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  patchParams({
                    status: e.target.value || null,
                    page_number: DEFAULT_PAGE_NUMBER,
                  });
                }}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
              </select>
            </div>
            <div className="col-md-2">
              <label
                className="form-label"
                htmlFor="events-filter-entries-start"
              >
                Starts on or after
              </label>
              <input
                id="events-filter-entries-start"
                type="date"
                className="form-control"
                value={entriesStartOnOrAfter}
                onChange={(e) => {
                  patchParams({
                    entries_start_on_or_after: e.target.value || null,
                    page_number: DEFAULT_PAGE_NUMBER,
                  });
                }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="events-filter-entries-end">
                Ends on or before
              </label>
              <input
                id="events-filter-entries-end"
                type="date"
                className="form-control"
                value={entriesEndOnOrBefore}
                onChange={(e) => {
                  patchParams({
                    entries_end_on_or_before: e.target.value || null,
                    page_number: DEFAULT_PAGE_NUMBER,
                  });
                }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="events-filter-supplier">
                Supplier
              </label>
              <select
                id="events-filter-supplier"
                className="form-select"
                value={supplierId}
                onChange={(e) => {
                  patchParams({
                    supplier_id: e.target.value || null,
                    page_number: DEFAULT_PAGE_NUMBER,
                  });
                }}
              >
                <option value="">All suppliers</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.active === false ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : loading ? (
        <p className="text-muted">Loading events…</p>
      ) : (
        <>
          {eventsPagination("events-list-top", "mb-3")}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-striped events-list-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Status</th>
                  <th>External</th>
                  <th>Starts</th>
                  <th className="text-end" style={{ width: "1%" }}></th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.description}</td>
                      <td>
                        <StatusBadge status={event.status} />
                      </td>
                      <td>{event.is_external ? "Yes" : "No"}</td>
                      <td>{formatDate(event.entries_start)}</td>
                      <td className="text-end">
                        <div className="d-flex flex-nowrap justify-content-end gap-1">
                          <Link
                            className="btn btn-sm btn-secondary bi-eye"
                            to={`/accounting/events/${event.id}`}
                            state={EVENT_LIST_LOCATION_STATE}
                            title="View event"
                          ></Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary bi-pencil"
                            title="Edit event"
                            onClick={() => openEditModal(event)}
                          ></button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary bi-copy"
                            title="Replicate event"
                            onClick={() => openReplicateModal(event)}
                          ></button>
                          {isDraft(event) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger bi-trash"
                              title="Delete event"
                              onClick={() => handleDeleteEvent(event)}
                            ></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-md-none events-card-list">
            {events.length === 0 ? (
              <p className="text-center text-muted py-4">{emptyMessage}</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="card mb-3 events-card">
                  <div className="card-body">
                    <Link
                      to={`/accounting/events/${event.id}`}
                      state={EVENT_LIST_LOCATION_STATE}
                      className="text-decoration-none text-body d-block"
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <h6 className="card-title mb-0">{event.description}</h6>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className="small text-muted">
                        {event.is_external ? "External" : "Internal"} · Starts{" "}
                        {formatDate(event.entries_start)}
                      </div>
                    </Link>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary bi-pencil"
                        title="Edit event"
                        onClick={() => openEditModal(event)}
                      ></button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary bi-copy"
                        title="Replicate event"
                        onClick={() => openReplicateModal(event)}
                      ></button>
                      {isDraft(event) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger bi-trash"
                          title="Delete event"
                          onClick={() => handleDeleteEvent(event)}
                        ></button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {eventsPagination("events-list-bottom", "mt-3")}
        </>
      )}

      <EventModal
        isOpen={eventModal.open}
        mode={eventModal.mode}
        event={eventModal.event}
        onClose={closeEventModal}
        onCreated={(event) => openEventDetail(event.id)}
      />

      <ReplicateEventModal
        isOpen={replicateModal.open}
        event={replicateModal.event}
        onClose={() => setReplicateModal({ open: false, event: null })}
        onReplicated={(created) => openEventDetail(created.id)}
      />

      <Dialog {...dialogProps} />
    </>
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
