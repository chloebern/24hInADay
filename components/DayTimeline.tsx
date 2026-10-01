"use client";

import { useEffect, useRef } from "react";
import type { Tag, Entry } from "@/lib/db";
import { minutesSinceMidnight, formatDuration } from "@/lib/dates";

const HOUR_HEIGHT = 56; // px per hour
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;

type Props = {
  entries: Entry[];
  tags: Tag[];
  onEntryClick: (entry: Entry) => void;
};

export default function DayTimeline({ entries, tags, onEntryClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 6 * HOUR_HEIGHT - 24;
    }
  }, []);

  const tagById = new Map(tags.map((t) => [t.id, t]));

  return (
    <div
      ref={containerRef}
      className="relative h-[65vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white"
    >
      <div className="relative" style={{ height: TOTAL_HEIGHT }}>
        {Array.from({ length: 24 }, (_, hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-neutral-100"
            style={{ top: hour * HOUR_HEIGHT }}
          >
            <span className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-neutral-400">
              {hour.toString().padStart(2, "0")}:00
            </span>
          </div>
        ))}

        <div className="absolute inset-y-0 left-14 right-2">
          {entries.map((entry) => {
            const entryTags = entry.tag_ids.map((id) => tagById.get(id)).filter(Boolean) as Tag[];
            const primary = entryTags[0];
            const startMin = minutesSinceMidnight(entry.start_time);
            const endMin = minutesSinceMidnight(entry.end_time);
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 18);
            const label = entryTags.length > 0
              ? entryTags.map((t) => t.name).join(" + ")
              : "Unknown";
            return (
              <button
                key={entry.id}
                onClick={() => onEntryClick(entry)}
                className="absolute left-0 right-0 overflow-hidden rounded-md px-2 py-1 text-left text-xs text-white shadow-sm transition-opacity hover:opacity-90"
                style={{
                  top,
                  height,
                  backgroundColor: primary?.color || "#898781",
                }}
              >
                <div className="font-medium">
                  {label} · {entry.start_time}–{entry.end_time}
                </div>
                {height > 32 && (
                  <div className="opacity-80">
                    {formatDuration(endMin - startMin)}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
