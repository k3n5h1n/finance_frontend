/** Sort siblings by display_order (page order); id breaks ties from legacy test data. */
export function compareDisplayOrder(a, b) {
  const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
  if (orderDiff !== 0) return orderDiff;
  return (a.id ?? 0) - (b.id ?? 0);
}

export function sortByDisplayOrder(items) {
  return [...(items ?? [])].sort(compareDisplayOrder);
}

/** Swap display_order between an item and its neighbor; returns updated pair or null. */
export function swapAdjacentDisplayOrder(items, id, direction) {
  const sorted = sortByDisplayOrder(items);
  const index = sorted.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return null;

  const current = sorted[index];
  const neighbor = sorted[swapIndex];
  const currentOrder = current.display_order ?? index + 1;
  const neighborOrder = neighbor.display_order ?? swapIndex + 1;

  return [
    { ...current, display_order: neighborOrder },
    { ...neighbor, display_order: currentOrder },
  ];
}

/** Update entry line order in local event tree after a successful reorder PATCH. */
export function applyEntryLineReorder(event, entryId, swappedLines) {
  if (!event || !swappedLines?.length) return event;

  const updates = new Map(swappedLines.map((line) => [line.id, line]));

  const entry_groups = (event.entry_groups ?? []).map((group) => ({
    ...group,
    entries: (group.entries ?? []).map((entry) => {
      if (entry.id !== entryId) return entry;

      const entry_lines = sortByDisplayOrder(
        (entry.entry_lines ?? []).map((line) =>
          updates.has(line.id) ? { ...line, ...updates.get(line.id) } : line
        )
      );

      return { ...entry, entry_lines };
    }),
  }));

  return { ...event, entry_groups };
}

/** Update line resource order in local event tree after a successful reorder PATCH. */
export function applyLineResourceReorder(event, entryLineId, swappedResources) {
  if (!event || !swappedResources?.length) return event;

  const updates = new Map(
    swappedResources.map((resource) => [resource.id, resource])
  );

  const entry_groups = (event.entry_groups ?? []).map((group) => ({
    ...group,
    entries: (group.entries ?? []).map((entry) => ({
      ...entry,
      entry_lines: (entry.entry_lines ?? []).map((line) => {
        if (line.id !== entryLineId) return line;

        const line_resources = sortByDisplayOrder(
          (line.line_resources ?? []).map((resource) =>
            updates.has(resource.id)
              ? { ...resource, ...updates.get(resource.id) }
              : resource
          )
        );

        return { ...line, line_resources };
      }),
    })),
  }));

  return { ...event, entry_groups };
}

/** Update entry order within a group after a successful reorder PATCH. */
export function applyEntryReorder(event, entryGroupId, swappedEntries) {
  if (!event || !swappedEntries?.length) return event;

  const updates = new Map(swappedEntries.map((entry) => [entry.id, entry]));

  const entry_groups = (event.entry_groups ?? []).map((group) => {
    if (group.id !== entryGroupId) return group;

    const entries = sortByDisplayOrder(
      (group.entries ?? []).map((entry) =>
        updates.has(entry.id) ? { ...entry, ...updates.get(entry.id) } : entry
      )
    );

    return { ...group, entries };
  });

  return { ...event, entry_groups };
}

/** Update entry group order after a successful reorder PATCH. */
export function applyEntryGroupReorder(event, swappedGroups) {
  if (!event || !swappedGroups?.length) return event;

  const updates = new Map(swappedGroups.map((group) => [group.id, group]));

  const entry_groups = sortByDisplayOrder(
    (event.entry_groups ?? []).map((group) =>
      updates.has(group.id) ? { ...group, ...updates.get(group.id) } : group
    )
  );

  return { ...event, entry_groups };
}

export function isEventEditable(event) {
  return event?.status?.toLowerCase() === "draft";
}

export function isEntryEditable(entry) {
  return !entry?.is_posted;
}

/** All entries across every group in display order. */
export function getAllEventEntries(event) {
  return (event?.entry_groups ?? []).flatMap((group) => group.entries ?? []);
}

/**
 * Event status rule: draft if any entry is draft (or there are no entries);
 * posted only when every entry is posted.
 */
export function deriveEventStatus(event) {
  const entries = getAllEventEntries(event);
  if (entries.length === 0) return "draft";
  if (entries.every((entry) => entry.is_posted)) return "posted";
  return "draft";
}

export function canPostEntry(entry) {
  return getPostEntryBlockReason(entry) == null;
}

export function getPostEntryBlockReason(entry) {
  if (entry?.is_posted) return "Entry is already posted.";
  if ((entry.entry_lines ?? []).length === 0) {
    return "Add at least one line before posting.";
  }
  if (!getEntryTotals(entry).balanced) {
    return "Debits and credits must balance before posting.";
  }
  return null;
}

export function isEntryBalanced(entry) {
  return getEntryTotals(entry).balanced;
}

function getDraftEntries(entries) {
  return (entries ?? []).filter((entry) => !entry.is_posted);
}

export function getPostEntryGroupBlockReason(entryGroup) {
  const entries = entryGroup?.entries ?? [];
  if (entries.length === 0) {
    return "Add at least one entry before posting this group.";
  }
  if (entries.some((entry) => !isEntryBalanced(entry))) {
    return "All entries in this group must be balanced before posting.";
  }

  const draftEntries = getDraftEntries(entries);
  if (draftEntries.length === 0) {
    return "All entries in this group are already posted.";
  }

  for (const entry of draftEntries) {
    const reason = getPostEntryBlockReason(entry);
    if (reason) return reason;
  }

  return null;
}

export function canPostEntryGroup(entryGroup) {
  return getPostEntryGroupBlockReason(entryGroup) == null;
}

export function getDeleteEntryGroupBlockReason(entryGroup) {
  const entries = entryGroup?.entries ?? [];
  if (entries.some((entry) => entry.is_posted)) {
    return "This group contains posted entries and cannot be deleted.";
  }
  return null;
}

export function canDeleteEntryGroup(entryGroup) {
  return getDeleteEntryGroupBlockReason(entryGroup) == null;
}

export function getPostEventBlockReason(event) {
  const entries = getAllEventEntries(event);
  if (entries.length === 0) {
    return "Add entries before posting this event.";
  }
  if (entries.some((entry) => !isEntryBalanced(entry))) {
    return "All entries must be balanced before posting this event.";
  }

  const draftEntries = getDraftEntries(entries);
  if (draftEntries.length === 0) {
    return "All entries are already posted.";
  }

  for (const entry of draftEntries) {
    const reason = getPostEntryBlockReason(entry);
    if (reason) return reason;
  }

  return null;
}

export function canPostEvent(event) {
  return getPostEventBlockReason(event) == null;
}

export function getPrimaryEntryGroup(event) {
  if (!event?.entry_groups?.length) return null;
  return (
    event.entry_groups.find((g) => g.type?.toLowerCase() === "primary") ??
    event.entry_groups[0]
  );
}

export function nextDisplayOrder(items) {
  if (!items?.length) return 1;
  return Math.max(...items.map((item) => item.display_order ?? 0)) + 1;
}

export function normalizeEventTree(event) {
  if (!event) return null;

  const entry_groups = sortByDisplayOrder(event.entry_groups).map((group) => ({
    ...group,
    entries: sortByDisplayOrder(group.entries).map((entry) => ({
      ...entry,
      entry_lines: sortByDisplayOrder(entry.entry_lines).map((line) => ({
        ...line,
        line_resources: sortByDisplayOrder(line.line_resources),
      })),
    })),
  }));

  return { ...event, entry_groups, status: deriveEventStatus({ ...event, entry_groups }) };
}

export function getEntryTotals(entry) {
  const lines = entry.entry_lines ?? [];
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit ?? 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit ?? 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005;

  return { totalDebit, totalCredit, balanced };
}

/** Defaults for a new line: balancing amount/side, or debit with empty amount if even. */
export function getBalancingLineDefaults(entry) {
  const { totalDebit, totalCredit, balanced } = getEntryTotals(entry);

  if (balanced) {
    return { side: "debit", amount: "" };
  }

  const diff = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;

  if (totalDebit > totalCredit) {
    return { side: "credit", amount: diff };
  }

  return { side: "debit", amount: diff };
}

export function getLineAmount(line) {
  if ((line.debit ?? 0) > 0) return line.debit;
  return line.credit ?? 0;
}

export function getLineResourceDefaults(line) {
  const lineAmount = getLineAmount(line);
  const resourcesTotal = getLineResourcesTotal(line);
  const remaining = Math.round((lineAmount - resourcesTotal) * 100) / 100;

  return {
    description: "",
    quantity: 1,
    unit_measure: "",
    unit_amount: remaining !== 0 ? remaining : "",
  };
}

export function getLineResourcesTotal(line) {
  return (line.line_resources ?? []).reduce(
    (sum, resource) => sum + (resource.extended_amount ?? 0),
    0
  );
}

export function lineResourcesMatchAmount(line) {
  const resources = line.line_resources ?? [];
  if (resources.length === 0) return true;

  const lineAmount = getLineAmount(line);
  const resourcesTotal = getLineResourcesTotal(line);
  return Math.abs(lineAmount - resourcesTotal) < 0.005;
}

export function formatAmount(amount) {
  return new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

export function formatUnitCost(amount) {
  return new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(Number(amount) ?? 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEntryGroupType(type) {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Display label for event type (e.g. year_end_close → "Year End Close"). */
export function formatEventType(type) {
  if (!type) return "";
  return String(type)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
