const ACCOUNT_TYPE_SORT_ORDER = {
  revenue: 1,
  income: 1,
  expense: 2,
  asset: 3,
  liability: 4,
  equity: 5,
};

function getTypeSortOrder(type) {
  return ACCOUNT_TYPE_SORT_ORDER[type?.toLowerCase()] ?? 999;
}

function compareAccounts(a, b) {
  const typeDiff = getTypeSortOrder(a.type) - getTypeSortOrder(b.type);
  if (typeDiff !== 0) return typeDiff;
  return a.name.localeCompare(b.name);
}

function sortTreeNodes(nodes) {
  nodes.sort(compareAccounts);
  nodes.forEach((node) => {
    if (node.children.length > 0) {
      sortTreeNodes(node.children);
    }
  });
  return nodes;
}

/** Flat account list → nested tree by parent.id (or parent_id) */
export function getAccountParentId(account) {
  if (account.parent?.id != null) return account.parent.id;
  if (account.parent_id != null) return account.parent_id;
  return null;
}

export function buildAccountTree(accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return [];
  }

  const byId = new Map(
    accounts.map((account) => [account.id, { ...account, children: [] }])
  );
  const roots = [];

  for (const account of byId.values()) {
    const parentId = getAccountParentId(account);
    if (parentId == null) {
      roots.push(account);
      continue;
    }

    const parent = byId.get(parentId);
    if (parent) {
      parent.children.push(account);
    } else {
      roots.push(account);
    }
  }

  return sortTreeNodes(roots);
}

/** Collect ids of every account that has children */
export function getExpandableIds(accounts) {
  const byParent = new Map();

  for (const account of accounts) {
    const parentId = getAccountParentId(account);
    if (parentId != null) {
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId).push(account);
    }
  }

  return new Set(byParent.keys());
}

/** Prevent choosing self or a descendant as parent in the edit form */
export function getDescendantIds(accountId, accounts) {
  const byParent = new Map();

  for (const account of accounts) {
    const parentId = getAccountParentId(account);
    if (parentId != null) {
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId).push(account.id);
    }
  }

  const descendants = new Set();
  const stack = [...(byParent.get(accountId) ?? [])];

  while (stack.length > 0) {
    const id = stack.pop();
    descendants.add(id);
    stack.push(...(byParent.get(id) ?? []));
  }

  return descendants;
}

/** Flatten the sorted account tree for use in a parent select dropdown. */
export function flattenAccountTreeForSelect(accounts, excludedIds = new Set()) {
  const tree = buildAccountTree(accounts);
  const options = [];

  function walk(nodes, depth) {
    for (const node of nodes) {
      if (excludedIds.has(node.id)) {
        continue;
      }

      const indent = depth > 0 ? "\u00a0\u00a0".repeat(depth) : "";
      options.push({
        id: node.id,
        label: `${indent}${node.name}`,
      });

      if (node.children.length > 0) {
        walk(node.children, depth + 1);
      }
    }
  }

  walk(tree, 0);
  return options;
}

/** Ancestor names from root to account, e.g. ["Expense", "Renovation", "Materials"]. */
export function getAccountPathNames(accountId, accounts) {
  if (accountId == null || !accounts?.length) return [];

  const byId = new Map(accounts.map((account) => [account.id, account]));
  const path = [];
  let current = byId.get(accountId);
  let depth = 0;

  while (current && depth < 50) {
    path.unshift(current.name);
    const parentId = getAccountParentId(current);
    current = parentId != null ? byId.get(parentId) : null;
    depth += 1;
  }

  return path;
}

/** Breadcrumb label for tooltips, e.g. "Expense › Renovation › Materials". */
export function getAccountPathLabel(accountId, accounts) {
  const path = getAccountPathNames(accountId, accounts);
  return path.length > 0 ? path.join(" › ") : null;
}
