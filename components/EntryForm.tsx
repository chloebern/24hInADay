"use client";

import { useState } from "react";
import type { Group, Tag, Entry } from "@/lib/db";
import { createEntry, updateEntry, deleteEntry } from "@/lib/api-client";

type Props = {
  date: string;
  groups: Group[];
  tags: Tag[];
  entry?: Entry | null;
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function EntryForm({
  date,
  groups,
  tags,
  entry,
  defaultStart,
  defaultEnd,
  onClose,
  onSaved,
}: Props) {
  const [startTime, setStartTime] = useState(entry?.start_time || defaultStart || "09:00");
  const [endTime, setEndTime] = useState(entry?.end_time || defaultEnd || "10:00");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(entry?.tag_ids || [])
  );
  const [note, setNote] = useState(entry?.note || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleTag(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const groupedTags = groups.map((group) => ({
    group,
    tags: tags.filter((t) => t.group_ids.includes(group.id)),
  }));
  const ungroupedTags = tags.filter((t) => t.group_ids.length === 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError("Pick at least one tag");
      return;
    }
    setSaving(true);
    setError(null);
    const input = {
      date,
      start_time: startTime,
      end_time: endTime,
      tag_ids: Array.from(selectedIds),
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
        className="flex max-h-[90vh] w-full max-w-sm flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="overflow-y-auto p-6">
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

          <div className="mt-4">
            <p className="mb-2 text-sm text-neutral-600">
              Tags {selectedIds.size > 0 && <span className="text-neutral-400">({selectedIds.size} selected)</span>}
            </p>
            <div className="space-y-3">
              {groupedTags
                .filter((g) => g.tags.length > 0)
                .map(({ group, tags: groupTags }) => (
                  <div key={group.id}>
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        {group.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupTags.map((tag) => {
                        const selected = selectedIds.has(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
                            style={
                              selected
                                ? { backgroundColor: tag.color, borderColor: tag.color, color: "white" }
                                : { borderColor: tag.color, color: tag.color, backgroundColor: "white" }
                            }
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

              {ungroupedTags.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Other
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ungroupedTags.map((tag) => {
                      const selected = selectedIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
                          style={
                            selected
                              ? { backgroundColor: tag.color, borderColor: tag.color, color: "white" }
                              : { borderColor: tag.color, color: tag.color, backgroundColor: "white" }
                          }
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <label className="mt-4 block text-sm text-neutral-600">
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
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-100 p-4">
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
