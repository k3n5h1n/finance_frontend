import { ORG_API } from "./apiConfig";

export async function listOrganizations() {
  const res = await fetch(ORG_API.LIST);
  if (!res.ok) throw new Error("Failed to load organizations");
  return res.json();
}

export async function getOrganization(id) {
  const res = await fetch(ORG_API.DETAIL(id));
  if (!res.ok) throw new Error("Failed to load organization");
  return res.json();
}

export async function createOrganization(data) {
  const res = await fetch(ORG_API.LIST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create organization");
  return res.json();
}

export async function updateOrganization(id, data) {
  const res = await fetch(ORG_API.DETAIL(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update organization");
  return res.json();
}

export async function deleteOrganization(id) {
  if (!confirm("Delete this organization?")) return;

  const res = await fetch(ORG_API.DETAIL(id), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete organization");
}
