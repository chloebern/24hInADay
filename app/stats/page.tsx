"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Tag, Entry } from "@/lib/db";
import { getTags, getEntries } from "@/lib/api-client";
import {
  toDateKey,
  addDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatRange,
  formatNiceDate,
  minutesSinceMidnight,
  formatDuration,
} from "@/lib/dates";
import StatsChart from "@/components/StatsChart";

type Period = "day" | "week" | "month";

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>("day");
  const [refDate, setRefDate] = useState(() => new Date());
  const [tags, setTags] = useState<Tag[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const { startKey, endKey, label } = useMemo(() => {
    if (period === "day") {
      const key = toDateKey(refDate);
      return { startKey: key, endKey: key, label: formatNiceDate(key) };
    }
    if (period === "week") {
      const start = toDateKey(startOfWeek(refDate));
      const end = toDateKey(endOfWeek(refDate));
      return { startKey: start, endKey: end, label: formatRange(start, end) };
    }
    const start = toDateKey(startOfMonth(refDate));
    const end = toDateKey(endOfMonth(refDate));
    const label = startOfMonth(refDate).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    return { startKey: start, endKey: end, label };
  }, [period, refDate]);

  const refresh = useCallback(async () => {
    const [tgs, ents] = await Promise.all([getTags(), getEntries(startKey, endKey)]);
    setTags(tgs);
    setEntries(ents);
    setLoading(false);
  }, [startKey, endKey]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  function step(delta: number) {
    if (period === "day") setRefDate((d) => addDays(d, delta));
    else if (period === "week") setRefDate((d) => addDays(d, delta * 7));
    else setRefDate((d) => addMonths(d, delta));
  }

  const entryDuration = (e: Entry) =>
    minutesSinceMidnight(e.end_time) - minutesSinceMidnight(e.start_time);

  const tagMinutes = new Map<string, number>();
  let unknownMinutes = 0;
  const tagById = new Map(tags.map((t) => [t.id, t]));
  for (const entry of entries) {
    const duration = entryDuration(entry);
    if (entry.tag_ids.length === 0) {
      unknownMinutes += duration;
      continue;
    }
    for (const tagId of entry.tag_ids) {
      if (!tagById.has(tagId)) {
        unknownMinutes += duration;
        continue;
      }
      tagMinutes.set(tagId, (tagMinutes.get(tagId) || 0) + duration);
    }
  }

  const rows = tags
    .map((tag) => ({ id: tag.id, name: tag.name, color: tag.color, minutes: tagMinutes.get(tag.id) || 0 }))
    .concat(
      unknownMinutes > 0
        ? [{ id: "unknown", name: "Unknown", color: "#898781", minutes: unknownMinutes }]
        : []
    );

  // Total tracked is based on entries directly, not summed tag buckets,
  // since a multi-tag entry's duration is credited in full to each of its tags.
  const totalMinutes = entries.reduce((sum, e) => sum + entryDuration(e), 0);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Stats</h1>

      <div className="mb-4 flex gap-1 rounded-lg bg-neutral-100 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => step(-1)}
          className="rounded-md px-2 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          ←
        </button>
        <span className="text-sm font-medium text-neutral-800">{label}</span>
        <button
          onClick={() => step(1)}
          className="rounded-md px-2 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
          Loading…
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Total tracked</p>
            <p className="text-2xl font-semibold text-neutral-900">
              {formatDuration(totalMinutes)}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Entries with multiple tags count fully toward each tag below, so the bars can add up to more than the total.
            </p>
          </div>
          <StatsChart rows={rows} />
        </>
      )}
    </div>
  );
}
