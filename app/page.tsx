"use client";

import { useEffect, useState, useCallback } from "react";
import type { Category, Entry } from "@/lib/db";
import { getCategories, getEntries } from "@/lib/api-client";
import { toDateKey, addDays, formatNiceDate, minutesSinceMidnight, formatDuration } from "@/lib/dates";
import DayTimeline from "@/components/DayTimeline";
import EntryForm from "@/components/EntryForm";

export default function DayPage() {
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const refresh = useCallback(async () => {
    const [cats, ents] = await Promise.all([
      getCategories(),
      getEntries(dateKey, dateKey),
    ]);
    setCategories(cats);
    setEntries(ents);
    setLoading(false);
  }, [dateKey]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const totalMinutes = entries.reduce(
    (sum, e) => sum + (minutesSinceMidnight(e.end_time) - minutesSinceMidnight(e.start_time)),
    0
  );

  function openNewEntry() {
    setEditingEntry(null);
    setFormOpen(true);
  }

  function openEditEntry(entry: Entry) {
    setEditingEntry(entry);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingEntry(null);
  }

  function handleSaved() {
    closeForm();
    refresh();
  }

  const isToday = dateKey === toDateKey(new Date());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setDateKey(toDateKey(addDays(new Date(dateKey + "T00:00:00"), -1)))}
          className="rounded-md px-2 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Previous day"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-neutral-900">
            {formatNiceDate(dateKey)}
          </div>
          {!isToday && (
            <button
              onClick={() => setDateKey(toDateKey(new Date()))}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              Jump to today
            </button>
          )}
        </div>
        <button
          onClick={() => setDateKey(toDateKey(addDays(new Date(dateKey + "T00:00:00"), 1)))}
          className="rounded-md px-2 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Next day"
        >
          →
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Tracked: <span className="font-medium text-neutral-800">{formatDuration(totalMinutes)}</span>
        </p>
        <button
          onClick={openNewEntry}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add entry
        </button>
      </div>

      {loading ? (
        <div className="flex h-[65vh] items-center justify-center text-sm text-neutral-400">
          Loading…
        </div>
      ) : (
        <DayTimeline entries={entries} categories={categories} onEntryClick={openEditEntry} />
      )}

      {formOpen && (
        <EntryForm
          date={dateKey}
          categories={categories}
          entry={editingEntry}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
