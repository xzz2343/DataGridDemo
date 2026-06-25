"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Person, PersonRole } from "../types/person";
import { fetchPeople } from "../lib/fetchPeople";

// ─── Role styling maps ────────────────────────────────────────────────────────

const ROLE_ROW: Record<PersonRole, string> = {
  VP:      "bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 dark:hover:bg-purple-900/70",
  Leader:  "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/35 dark:hover:bg-blue-800/45",
  Manager: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/25 dark:hover:bg-purple-800/40",
  IC:      "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-800/30",
};

const ROLE_ICON_COLOR: Record<PersonRole, string> = {
  VP:      "text-purple-700 dark:text-purple-300",
  Leader:  "text-blue-700 dark:text-blue-400",
  Manager: "text-purple-600 dark:text-purple-400",
  IC:      "text-emerald-700 dark:text-emerald-400",
};

// ─── Role icons ───────────────────────────────────────────────────────────────

function IcIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18"
         fill="currentColor" className={className}>
      <circle cx="8" cy="5" r="3.5" />
      <path d="M1.5 16c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    </svg>
  );
}

function ManagerIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 16" width="24" height="18"
         fill="currentColor" className={className}>
      <g opacity="0.45">
        <circle cx="17" cy="5" r="3" />
        <path d="M11 16c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </g>
      <circle cx="8" cy="5" r="3.5" />
      <path d="M1.5 16c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    </svg>
  );
}

function LeaderIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 16" width="28" height="18"
         fill="currentColor" className={className}>
      <g opacity="0.3">
        <circle cx="3.5" cy="5.5" r="2.5" />
        <path d="M0 16c0-2.8 1.6-5 3.5-5s3.5 2.2 3.5 5" />
      </g>
      <g opacity="0.3">
        <circle cx="24.5" cy="5.5" r="2.5" />
        <path d="M21 16c0-2.8 1.6-5 3.5-5s3.5 2.2 3.5 5" />
      </g>
      <circle cx="14" cy="5" r="3.5" />
      <path d="M7.5 16c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    </svg>
  );
}

function VpBuildingIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18"
         fill="currentColor" className={className}>
      {/* Building with roof + windows + door cut out via evenodd */}
      <path
        fillRule="evenodd"
        d="M8 1 L15 5.5 L15 15.5 L1 15.5 L1 5.5 Z
           M3 8 L5.5 8 L5.5 10.5 L3 10.5 Z
           M6.75 8 L9.25 8 L9.25 10.5 L6.75 10.5 Z
           M10.5 8 L13 8 L13 10.5 L10.5 10.5 Z
           M5.5 11.5 L10.5 11.5 L10.5 15.5 L5.5 15.5 Z"
      />
    </svg>
  );
}

function RoleIcon({ role }: { role: PersonRole }) {
  const cls = ROLE_ICON_COLOR[role];
  switch (role) {
    case "VP":      return <VpBuildingIcon className={cls} />;
    case "Leader":  return <LeaderIcon className={cls} />;
    case "Manager": return <ManagerIcon className={cls} />;
    case "IC":      return <IcIcon className={cls} />;
  }
}

// ─── Column configuration ─────────────────────────────────────────────────────

const COL_CONFIG = [
  { key: "role"      as const, header: "Level",      width: 60,  sortable: true  },
  { key: "id"        as const, header: "ID",         width: 60,  sortable: true  },
  { key: "firstName" as const, header: "First Name", width: 110, sortable: true  },
  { key: "lastName"  as const, header: "Last Name",  width: 110, sortable: true  },
  { key: "title"     as const, header: "Title",      width: 210, sortable: true  },
  { key: "email"     as const, header: "Email",      width: 210, sortable: true  },
  { key: "phone"     as const, header: "Phone",      width: 130, sortable: false },
  { key: "office"    as const, header: "Office",     width: 200, sortable: true  },
  { key: "city"      as const, header: "City",       width: 110, sortable: true  },
  { key: "state"     as const, header: "State",      width: 62,  sortable: true  },
] as const;

const columnHelper = createColumnHelper<Person>();
const columns = COL_CONFIG.map(({ key, header, width, sortable }) =>
  columnHelper.accessor(key, { header, size: width, enableSorting: sortable })
);

const TOTAL_COL_WIDTH = COL_CONFIG.reduce((s, c) => s + c.width, 0);
const EMPTY_DATA: Person[] = [];

const ROW_HEIGHT = 40;
const CHUNK_SIZE = 100;
const LOOK_AHEAD = 20;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PeopleTable() {
  const [rowCache, setRowCache]               = useState<Map<number, Person>>(new Map());
  const [totalCount, setTotalCount]           = useState(0);
  const [isInitialLoading, setInitialLoad]    = useState(true);
  const [pendingCount, setPendingCount]       = useState(0); // in-flight chunk requests
  const [sorting, setSorting]                 = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter]       = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");

  const generationRef  = useRef(0);
  const loadedChunks   = useRef(new Set<number>());
  const pendingChunks  = useRef(new Set<number>());
  const sortingRef     = useRef<SortingState>([]);
  const filterRef      = useRef("");
  const parentRef      = useRef<HTMLDivElement>(null);

  // ── Debounce filter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => setDebouncedFilter(globalFilter), 300);
    return () => clearTimeout(id);
  }, [globalFilter]);

  // ── Reset + fetch chunk 0 on sort / filter change ───────────────────────────
  useEffect(() => {
    sortingRef.current = sorting;
    filterRef.current  = debouncedFilter;

    const gen = ++generationRef.current;
    loadedChunks.current  = new Set();
    pendingChunks.current = new Set([0]);

    setRowCache(new Map());
    setTotalCount(0);
    setPendingCount(1);
    setInitialLoad(true);
    if (parentRef.current) parentRef.current.scrollTop = 0;

    fetchPeople({ start: 0, size: CHUNK_SIZE, sorting, globalFilter: debouncedFilter })
      .then(({ rows, totalCount: total }) => {
        if (gen !== generationRef.current) return;
        setTotalCount(total);
        setRowCache(new Map(rows.map((r, i) => [i, r] as [number, Person])));
        loadedChunks.current.add(0);
        pendingChunks.current.delete(0);
        setPendingCount(0);
        setInitialLoad(false);
      })
      .catch(() => {
        if (gen !== generationRef.current) return;
        pendingChunks.current.delete(0);
        setPendingCount(0);
        setInitialLoad(false);
      });
  }, [sorting, debouncedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load a single chunk ─────────────────────────────────────────────────────
  const loadChunk = useCallback((chunk: number) => {
    if (loadedChunks.current.has(chunk) || pendingChunks.current.has(chunk)) return;

    pendingChunks.current.add(chunk);
    setPendingCount(c => c + 1);
    const gen   = generationRef.current;
    const start = chunk * CHUNK_SIZE;

    fetchPeople({
      start,
      size: CHUNK_SIZE,
      sorting: sortingRef.current,
      globalFilter: filterRef.current,
    })
      .then(({ rows }) => {
        if (gen !== generationRef.current) return;
        setRowCache(prev => {
          const next = new Map(prev);
          rows.forEach((row, i) => next.set(start + i, row));
          return next;
        });
        loadedChunks.current.add(chunk);
        pendingChunks.current.delete(chunk);
        setPendingCount(c => Math.max(0, c - 1));
      })
      .catch(() => {
        pendingChunks.current.delete(chunk);
        setPendingCount(c => Math.max(0, c - 1));
      });
  }, []);

  // ── Keyboard scroll for the table container (arrow / page / ctrl+home/end) ───
  const handleScrollKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = parentRef.current;
    if (!el) return;
    const rowPx  = ROW_HEIGHT;
    const pagePx = Math.floor(el.clientHeight / rowPx) * rowPx;
    switch (e.key) {
      case "ArrowDown":  el.scrollBy({ top:  rowPx,  behavior: "instant" }); e.preventDefault(); break;
      case "ArrowUp":    el.scrollBy({ top: -rowPx,  behavior: "instant" }); e.preventDefault(); break;
      case "PageDown":   el.scrollBy({ top:  pagePx, behavior: "instant" }); e.preventDefault(); break;
      case "PageUp":     el.scrollBy({ top: -pagePx, behavior: "instant" }); e.preventDefault(); break;
      case "Home":
        if (e.ctrlKey) { el.scrollTo({ top: 0, behavior: "instant" }); e.preventDefault(); }
        break;
      case "End":
        if (e.ctrlKey) { el.scrollTo({ top: el.scrollHeight, behavior: "instant" }); e.preventDefault(); }
        break;
    }
  }, []);

  // ── Virtualizer ─────────────────────────────────────────────────────────────
  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  // ── Look-ahead fetching ──────────────────────────────────────────────────────
  const range = virtualizer.range;
  useEffect(() => {
    if (!range || totalCount === 0 || isInitialLoading) return;
    const lo = Math.max(0, range.startIndex - LOOK_AHEAD);
    const hi = Math.min(totalCount - 1, range.endIndex + LOOK_AHEAD);
    for (
      let chunk = Math.floor(lo / CHUNK_SIZE);
      chunk <= Math.floor(hi / CHUNK_SIZE);
      chunk++
    ) loadChunk(chunk);
  }, [range?.startIndex, range?.endIndex, totalCount, isInitialLoading, loadChunk]);

  // ── Table instance (header + sort state only) ────────────────────────────────
  const table = useReactTable({
    data: EMPTY_DATA,
    columns,
    manualSorting: true,
    manualFiltering: true,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    rowCount: totalCount,
  });

  const virtualItems       = virtualizer.getVirtualItems();
  const totalVirtualHeight = virtualizer.getTotalSize();

  const loadingRecords = pendingCount * CHUNK_SIZE;
  const loadedRecords  = rowCache.size;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-lg h-full">

      {/* ── Loading stats bar ───────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 text-xs font-mono px-1"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="flex items-center gap-1.5">
          <span
            className={pendingCount > 0 ? "text-yellow-600 dark:text-yellow-400 animate-spin inline-block" : "text-gray-300 dark:text-gray-600"}
            aria-hidden="true"
            style={{ display: "inline-block" }}
          >
            ◌
          </span>
          <span className={pendingCount > 0 ? "text-yellow-700 dark:text-yellow-300" : "text-gray-400 dark:text-gray-500"}>
            {loadingRecords.toLocaleString()} loading
          </span>
        </span>

        <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>

        <span className="flex items-center gap-1.5">
          <span className="text-emerald-600 dark:text-emerald-500" aria-hidden="true">✓</span>
          <span className="text-emerald-700 dark:text-emerald-400">
            {loadedRecords.toLocaleString()} loaded
          </span>
        </span>

        <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>

        <span className="text-gray-500 dark:text-gray-400">
          of {isInitialLoading ? "…" : totalCount.toLocaleString()} records
        </span>
      </div>

      {/* ── Initial data-fetch banner ───────────────────────────────────────── */}
      {isInitialLoading && (
        <div
          role="status"
          aria-label="Loading people directory"
          className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300
                     bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700
                     rounded-md px-3 py-2"
        >
          <svg
            aria-hidden="true"
            className="animate-spin h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Fetching from database — may take a moment on first visit…</span>
        </div>
      )}

      {/* ── Filter + total count ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="people-filter"
          className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
        >
          Search:
        </label>
        <input
          id="people-filter"
          type="search"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Filter by name, email, city, state…"
          className="flex-1 rounded-md bg-white border border-gray-300 text-gray-900 placeholder-gray-400
                     dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500
                     px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="Filter people by name, email, city or state"
        />
      </div>

      {/* Announced to screen readers when the container is focused */}
      <p id="table-kb-hint" className="sr-only">
        Use arrow keys to scroll rows. Ctrl+Home goes to the first row, Ctrl+End to the last.
        Column headers are sortable with Enter or Space.
      </p>

      {/* ── Scrollable table container ──────────────────────────────────────── */}
      <div
        ref={parentRef}
        tabIndex={0}
        aria-describedby="table-kb-hint"
        onKeyDown={handleScrollKeyDown}
        className="flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-md overflow-auto
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <table
          role="grid"
          aria-label="People directory"
          aria-rowcount={totalCount}
          aria-colcount={COL_CONFIG.length}
          aria-busy={isInitialLoading}
          style={{ borderCollapse: "collapse", minWidth: TOTAL_COL_WIDTH, width: "100%" }}
        >
          {/* ── Sticky header ─────────────────────────────────────────────── */}
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-md">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} role="row" style={{ display: "flex" }}>
                {hg.headers.map((header, colIdx) => {
                  const colId   = header.column.id;
                  const canSort = header.column.getCanSort();
                  const sort    = sorting.find(s => s.id === colId);
                  const w       = header.getSize();
                  const isIcon  = colId === "role";
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      role="columnheader"
                      aria-colindex={colIdx + 1}
                      aria-label={isIcon ? "Employee level" : undefined}
                      aria-sort={
                        canSort
                          ? sort ? (sort.desc ? "descending" : "ascending") : "none"
                          : undefined
                      }
                      style={{ width: w, minWidth: w, flexShrink: 0 }}
                      className={`px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 select-none
                                  border-b border-gray-200 dark:border-gray-600 overflow-hidden
                                  ${isIcon ? "flex items-center justify-center" : "text-left"}`}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 w-full text-left hover:text-indigo-600 dark:hover:text-indigo-300
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-indigo-500 rounded transition-colors"
                          aria-label={`Sort by ${isIcon ? "level" : header.column.columnDef.header}${
                            sort ? (sort.desc ? ", currently descending" : ", currently ascending") : ""
                          }`}
                        >
                          {!isIcon && (
                            <span className="truncate text-sm">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                          )}
                          <span aria-hidden="true" className="ml-auto text-indigo-500 dark:text-indigo-400 text-xs shrink-0">
                            {sort ? (sort.desc ? "▼" : "▲") : "⇅"}
                          </span>
                        </button>
                      ) : (
                        <span className="truncate text-sm block">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* ── Virtualized body ───────────────────────────────────────────── */}
          <tbody
            role="rowgroup"
            style={{
              display: "block",
              position: "relative",
              height: isInitialLoading ? ROW_HEIGHT * 15 : totalVirtualHeight,
            }}
          >
            {isInitialLoading
              ? Array.from({ length: 15 }).map((_, i) => (
                  <tr
                    key={i}
                    role="row"
                    aria-hidden="true"
                    style={{
                      display: "flex",
                      position: "absolute",
                      top: 0, left: 0,
                      width: "100%",
                      height: ROW_HEIGHT,
                      transform: `translateY(${i * ROW_HEIGHT}px)`,
                    }}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    {COL_CONFIG.map((col, colIdx) => (
                      <td
                        key={col.key}
                        role="gridcell"
                        aria-colindex={colIdx + 1}
                        style={{ width: col.width, minWidth: col.width, flexShrink: 0 }}
                        className="px-3 flex items-center"
                      >
                        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : virtualItems.map(vr => {
                  const row = rowCache.get(vr.index);
                  const roleCls = row ? ROLE_ROW[row.role] : "hover:bg-gray-50 dark:hover:bg-gray-800";
                  return (
                    <tr
                      key={vr.index}
                      role="row"
                      aria-rowindex={vr.index + 2}
                      style={{
                        display: "flex",
                        position: "absolute",
                        top: 0, left: 0,
                        width: "100%",
                        height: vr.size,
                        transform: `translateY(${vr.start}px)`,
                      }}
                      className={`border-b border-gray-200 dark:border-gray-700/50 transition-colors ${roleCls}`}
                    >
                      {COL_CONFIG.map((col, colIdx) => {
                        const isIcon = col.key === "role";
                        const value  = row?.[col.key];
                        return (
                          <td
                            key={col.key}
                            role="gridcell"
                            aria-colindex={colIdx + 1}
                            style={{ width: col.width, minWidth: col.width, flexShrink: 0 }}
                            className={`flex items-center overflow-hidden text-gray-700 dark:text-gray-200
                                        ${isIcon ? "justify-center px-1" : "px-3"}
                                        ${row
                                          ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 cursor-default"
                                          : ""}`}
                            tabIndex={row ? -1 : undefined}
                            aria-label={
                              row
                                ? isIcon
                                  ? `Level: ${row.role}`
                                  : `${col.header}: ${value}`
                                : undefined
                            }
                            title={row && !isIcon ? String(value) : undefined}
                          >
                            {row ? (
                              isIcon
                                ? <RoleIcon role={row.role} />
                                : <span className="truncate text-sm">{value}</span>
                            ) : (
                              <div
                                className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700/60 animate-pulse"
                                aria-hidden="true"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
