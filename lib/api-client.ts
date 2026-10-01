import type { Group, Tag, Entry } from "@/lib/db";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getGroups(): Promise<Group[]> {
  return request("/api/groups");
}

export function createGroup(name: string, color: string): Promise<Group> {
  return request("/api/groups", { method: "POST", body: JSON.stringify({ name, color }) });
}

export function updateGroup(id: string, name: string, color: string): Promise<void> {
  return request(`/api/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, color }),
  });
}

export function deleteGroup(id: string): Promise<void> {
  return request(`/api/groups/${id}`, { method: "DELETE" });
}

export function getTags(): Promise<Tag[]> {
  return request("/api/tags");
}

export function createTag(name: string, color: string, groupIds: string[]): Promise<Tag> {
  return request("/api/tags", {
    method: "POST",
    body: JSON.stringify({ name, color, group_ids: groupIds }),
  });
}

export function updateTag(
  id: string,
  name: string,
  color: string,
  groupIds: string[]
): Promise<void> {
  return request(`/api/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, color, group_ids: groupIds }),
  });
}

export function deleteTag(id: string): Promise<void> {
  return request(`/api/tags/${id}`, { method: "DELETE" });
}

export function getEntries(start: string, end: string): Promise<Entry[]> {
  return request(`/api/entries?start=${start}&end=${end}`);
}

export type EntryInput = {
  date: string;
  start_time: string;
  end_time: string;
  tag_ids: string[];
  note: string | null;
};

export function createEntry(input: EntryInput): Promise<{ id: string }> {
  return request("/api/entries", { method: "POST", body: JSON.stringify(input) });
}

export function updateEntry(id: string, input: EntryInput): Promise<void> {
  return request(`/api/entries/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteEntry(id: string): Promise<void> {
  return request(`/api/entries/${id}`, { method: "DELETE" });
}
