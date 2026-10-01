"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/db";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api-client";

const DEFAULT_COLOR = "#2a78d6";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const cats = await getCategories();
    setCategories(cats);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await createCategory(name, newColor);
      setNewName("");
      setNewColor(DEFAULT_COLOR);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    }
  }

  async function handleUpdate(id: string, name: string, color: string) {
    await updateCategory(id, name, color);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Entries using it will show as Unknown.")) return;
    await deleteCategory(id);
    refresh();
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Categories</h1>

      <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
        {categories.length === 0 && (
          <p className="p-4 text-sm text-neutral-400">No categories yet.</p>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white p-4"
      >
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-neutral-200"
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CategoryRow({
  category,
  onUpdate,
  onDelete,
}: {
  category: Category;
  onUpdate: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(category.name);
      return;
    }
    if (trimmed !== category.name || color !== category.color) {
      onUpdate(category.id, trimmed, color);
    }
  }

  return (
    <div className="flex items-center gap-3 p-3">
      <input
        type="color"
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
          onUpdate(category.id, name.trim() || category.name, e.target.value);
        }}
        className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-neutral-200"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        className="flex-1 rounded-lg border border-transparent px-2 py-1 text-sm hover:border-neutral-200 focus:border-neutral-300 focus:outline-none"
      />
      <button
        onClick={() => onDelete(category.id)}
        className="text-sm text-neutral-300 hover:text-red-600"
      >
        Delete
      </button>
    </div>
  );
}
