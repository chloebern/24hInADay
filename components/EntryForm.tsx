"use client";

import { useState } from "react";
import type { Category, Entry } from "@/lib/db";
import { createEntry, updateEntry, deleteEntry } from "@/lib/api-client";

type Props = {
  date: string;
  categories: Category[];
  entry?: Entry | null;
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function EntryForm({
  date,
  categories,
  entry,
  defaultStart,
  defaultEnd,
  onClose,
  onSaved,
}: Props) {
  const [startTime, setStartTime] = useState(entry?.start_time || defaultStart || "09:00");
  const [endTime, setEndTime] = useState(entry?.end_time || defaultEnd || "10:00");
  const [categoryId, setCategoryId] = useState(
    entry?.category_id || categories[0]?.id || ""
  );
  const [note, setNote] = useState(entry?.note || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input = {
      date,
      start_time: startTime,
      end_time: endTime,
      category_id: categoryId,
      note: note.trim() || null,
    };
    try {
      if (entry) {
        await updateEntry(entry.id, input);
      } else {
        await createEntry(input);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    setSaving(true);
    try {
      await deleteEntry(entry.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete entry");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <h2 className="mb-4 text-base font-semibold text-neutral-900">
          {entry ? "Edit entry" : "New entry"}
        </h2>

        <div className="flex gap-3">
          <label className="flex-1 text-sm text-neutral-600">
            Start
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex-1 text-sm text-neutral-600">
            End
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm text-neutral-600">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm text-neutral-600">
          Note (optional)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. mask alignment"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-2">
          <div>
            {entry && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
