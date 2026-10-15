import { useState, useEffect, useMemo } from "react";
import AccountModal from "./AccountModal";
import { listAccounts, deleteAccount } from "./accountsApi";
import { buildAccountTree, getExpandableIds } from "./accountTree";
import { useOrganization } from "../../context/OrganizationContext";
import "./accounts.css";

function AccountTreeRows({
  nodes,
  depth,
  expandedIds,
  onToggle,
  onView,
  onEdit,
  onCopy,
  onDelete,
}) {
  return nodes.flatMap((account) => {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedIds.has(account.id);

    const rows = [
      <tr key={account.id}>
        <td>
          <div
            className="account-tree-name"
            style={{ paddingLeft: `${depth * 1.25}rem` }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="btn btn-sm btn-link account-tree-toggle p-0 me-1"
                aria-expanded={isExpanded}
                title={isExpanded ? "Collapse" : "Expand"}
                onClick={() => onToggle(account.id)}
              >
                <i
                  className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}
                ></i>
              </button>
            ) : (
              <span className="account-tree-spacer" aria-hidden="true"></span>
            )}
            <span>{account.name}</span>
          </div>
        </td>
        <td className="text-capitalize">{account.type}</td>
        <td>{account.currency}</td>
        <td>{account.owner?.name ?? "—"}</td>
        <td>{account.organization?.name ?? "—"}</td>
        <td>
          {account.active ? (
            <span className="badge text-bg-success">Active</span>
          ) : (
            <span className="badge text-bg-secondary">Inactive</span>
          )}
        </td>
        <td className="text-end">
          <div className="d-flex flex-nowrap justify-content-end gap-1">
            <button
              className="btn btn-sm btn-secondary bi-eye"
              data-bs-toggle="tooltip"
              title="View Account"
              onClick={() => onView(account)}
            ></button>
            <button
              className="btn btn-sm btn-secondary bi-pencil"
              data-bs-toggle="tooltip"
              title="Edit Account"
              onClick={() => onEdit(account)}
            ></button>
            <button
              className="btn btn-sm btn-secondary bi-copy"
              data-bs-toggle="tooltip"
              title="Copy Account"
              onClick={() => onCopy(account)}
            ></button>
            <button
              className="btn btn-sm btn-danger bi-trash"
              data-bs-toggle="tooltip"
              title="Delete Account"
              onClick={() => onDelete(account.id)}
            ></button>
          </div>
        </td>
      </tr>,
    ];

    if (hasChildren && isExpanded) {
      rows.push(
        ...AccountTreeRows({
          nodes: account.children,
          depth: depth + 1,
          expandedIds,
          onToggle,
          onView,
          onEdit,
          onCopy,
          onDelete,
        })
      );
    }

    return rows;
  });
}

export default function AccountsList() {
  const { organizations, selectedOrganizationId } = useOrganization();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const accountTree = useMemo(() => buildAccountTree(accounts), [accounts]);

  const fetchAccounts = async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listAccounts(selectedOrganizationId);
      setAccounts(data);
      setExpandedIds(new Set());
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setAccounts([]);
      setError(err.message ?? "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [selectedOrganizationId]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(getExpandableIds(accounts));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const openViewModal = (account) => {
    setSelectedAccount(account);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openNewModal = (parentAccount = null) => {
    setSelectedAccount(
      parentAccount ? { parent: { id: parentAccount.id, name: parentAccount.name } } : null
    );
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setSelectedAccount(account);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openCopyModal = (account) => {
    const copy = {
      ...account,
      id: undefined,
      name: `${account.name} (copy)`,
    };
    setModalMode("add");
    setSelectedAccount(copy);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteAccount(selectedOrganizationId, id);
    fetchAccounts();
  };

  const closeModal = (refresh) => {
    setIsModalOpen(false);
    if (refresh) fetchAccounts();
  };

  if (loading) return <p>Loading...</p>;

  if (error) {
    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Accounts</h3>
        </div>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Accounts</h3>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={expandAll}
          >
            Expand All
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={collapseAll}
          >
            Collapse All
          </button>
          <button className="btn btn-primary" onClick={() => openNewModal()}>
            Add Account
          </button>
        </div>
      </div>

      <table className="table table-striped account-tree-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Currency</th>
            <th>Owner</th>
            <th>Organization</th>
            <th>Status</th>
            <th className="text-end" style={{ width: "1%" }}></th>
          </tr>
        </thead>
        <tbody>
          {accountTree.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted py-4">
                No accounts found
              </td>
            </tr>
          ) : (
            AccountTreeRows({
              nodes: accountTree,
              depth: 0,
              expandedIds,
              onToggle: toggleExpanded,
              onView: openViewModal,
              onEdit: openEditModal,
              onCopy: openCopyModal,
              onDelete: handleDelete,
            })
          )}
        </tbody>
      </table>

      <AccountModal
        isOpen={isModalOpen}
        onClose={closeModal}
        account={selectedAccount}
        mode={modalMode}
        accounts={accounts}
        organizations={organizations}
      />
    </>
  );
}
