import type { Category, Entry } from "@/lib/db";

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

export function getCategories(): Promise<Category[]> {
  return request("/api/categories");
}

export function createCategory(name: string, color: string): Promise<Category> {
  return request("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

export function updateCategory(id: string, name: string, color: string): Promise<void> {
  return request(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, color }),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return request(`/api/categories/${id}`, { method: "DELETE" });
}

export function getEntries(start: string, end: string): Promise<Entry[]> {
  return request(`/api/entries?start=${start}&end=${end}`);
}

export type EntryInput = {
  date: string;
  start_time: string;
  end_time: string;
  category_id: string;
  note: string | null;
};

export function createEntry(input: EntryInput): Promise<{ id: string }> {
  return request("/api/entries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEntry(id: string, input: EntryInput): Promise<void> {
  return request(`/api/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteEntry(id: string): Promise<void> {
  return request(`/api/entries/${id}`, { method: "DELETE" });
}
