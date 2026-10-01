"use client";

import { useEffect, useState } from "react";
import type { Group, Tag } from "@/lib/db";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/lib/api-client";

const DEFAULT_COLOR = "#2a78d6";

export default function TagsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [grps, tgs] = await Promise.all([getGroups(), getTags()]);
    setGroups(grps);
    setTags(tgs);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-neutral-900">Groups & Tags</h1>
      <p className="mb-6 text-sm text-neutral-500">
        A tag can belong to more than one group — it'll show up under each one when
        logging time.
      </p>

      <GroupsSection groups={groups} onChange={refresh} />
      <TagsSection groups={groups} tags={tags} onChange={refresh} />
    </div>
  );
}

function GroupsSection({ groups, onChange }: { groups: Group[]; onChange: () => void }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await createGroup(name, newColor);
      setNewName("");
      setNewColor(DEFAULT_COLOR);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add group");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this group? Tags in it stay, just lose this grouping.")) return;
    await deleteGroup(id);
    onChange();
  }

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Groups
      </h2>
      <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {groups.map((group) => (
          <GroupRow key={group.id} group={group} onUpdate={onChange} onDelete={handleDelete} />
        ))}
        {groups.length === 0 && <p className="p-4 text-sm text-neutral-400">No groups yet.</p>}
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white p-3"
      >
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-neutral-200"
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New group name"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function GroupRow({
  group,
  onUpdate,
  onDelete,
}: {
  group: Group;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(group.name);
      return;
    }
    if (trimmed !== group.name) {
      updateGroup(group.id, trimmed, color).then(onUpdate);
    }
  }

  function commitColor(value: string) {
    setColor(value);
    updateGroup(group.id, name.trim() || group.name, value).then(onUpdate);
  }

  return (
    <div className="flex items-center gap-3 p-3">
      <input
        type="color"
        value={color}
        onChange={(e) => commitColor(e.target.value)}
        className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-neutral-200"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        className="flex-1 rounded-lg border border-transparent px-2 py-1 text-sm hover:border-neutral-200 focus:border-neutral-300 focus:outline-none"
      />
      <button
        onClick={() => onDelete(group.id)}
        className="text-sm text-neutral-300 hover:text-red-600"
      >
        Delete
      </button>
    </div>
  );
}

function TagsSection({
  groups,
  tags,
  onChange,
}: {
  groups: Group[];
  tags: Tag[];
  onChange: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [newGroupIds, setNewGroupIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function toggleNewGroup(id: string) {
    setNewGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await createTag(name, newColor, Array.from(newGroupIds));
      setNewName("");
      setNewColor(DEFAULT_COLOR);
      setNewGroupIds(new Set());
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add tag");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tag? Entries using it will show as Unknown.")) return;
    await deleteTag(id);
    onChange();
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Tags
      </h2>
      <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {tags.map((tag) => (
          <TagRow key={tag.id} tag={tag} groups={groups} onUpdate={onChange} onDelete={handleDelete} />
        ))}
        {tags.length === 0 && <p className="p-4 text-sm text-neutral-400">No tags yet.</p>}
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-white p-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-neutral-200"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New tag name"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {groups.map((group) => {
            const selected = newGroupIds.has(group.id);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleNewGroup(group.id)}
                className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
                style={
                  selected
                    ? { backgroundColor: group.color, borderColor: group.color, color: "white" }
                    : { borderColor: group.color, color: group.color, backgroundColor: "white" }
                }
              >
                {group.name}
              </button>
            );
          })}
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function TagRow({
  tag,
  groups,
  onUpdate,
  onDelete,
}: {
  tag: Tag;
  groups: Group[];
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [groupIds, setGroupIds] = useState<Set<string>>(new Set(tag.group_ids));

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(tag.name);
      return;
    }
    if (trimmed !== tag.name) {
      updateTag(tag.id, trimmed, color, Array.from(groupIds)).then(onUpdate);
    }
  }

  function commitColor(value: string) {
    setColor(value);
    updateTag(tag.id, name.trim() || tag.name, value, Array.from(groupIds)).then(onUpdate);
  }

  function toggleGroup(id: string) {
    setGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      updateTag(tag.id, name.trim() || tag.name, color, Array.from(next)).then(onUpdate);
      return next;
    });
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => commitColor(e.target.value)}
          className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-neutral-200"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          className="flex-1 rounded-lg border border-transparent px-2 py-1 text-sm hover:border-neutral-200 focus:border-neutral-300 focus:outline-none"
        />
        <button
          onClick={() => onDelete(tag.id)}
          className="text-sm text-neutral-300 hover:text-red-600"
        >
          Delete
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 pl-10">
        {groups.map((group) => {
          const selected = groupIds.has(group.id);
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="rounded-full border px-2 py-0.5 text-xs font-medium transition-colors"
              style={
                selected
                  ? { backgroundColor: group.color, borderColor: group.color, color: "white" }
                  : { borderColor: "#e1e0d9", color: "#898781", backgroundColor: "white" }
              }
            >
              {group.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
