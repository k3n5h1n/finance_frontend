import { getAccountPathLabel } from "../accounts/accountTree";
import { formatEntryGroupType } from "./eventUtils";

export default function AccountCell({ account, accounts = [] }) {
  if (!account?.name && account?.id == null) {
    return "—";
  }

  const type =
    account.type ?? accounts.find((a) => a.id === account.id)?.type;
  const pathLabel =
    account.id != null ? getAccountPathLabel(account.id, accounts) : null;
  const title = pathLabel && pathLabel !== account.name ? pathLabel : undefined;

  return (
    <span className="event-line-account" title={title}>
      <span>{account.name ?? "—"}</span>
      {type ? (
        <span className="badge text-bg-light text-capitalize ms-2 event-line-account-type">
          {formatEntryGroupType(type)}
        </span>
      ) : null}
    </span>
  );
}
