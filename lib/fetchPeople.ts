import { Person, PersonRole } from "../types/person";
import { PEOPLE_DATA } from "../data/people";
import { supabase, supabaseConfigured } from "./supabase";
import { getCachedPeople, setCachedPeople } from "./localCache";

export interface FetchPeopleParams {
  start: number;
  size: number;
  sorting?: { id: string; desc: boolean }[];
  globalFilter?: string;
}

export interface FetchPeopleResult {
  rows: Person[];
  totalCount: number;
}

// Module-level memory cache — populated once per session, reused for every subsequent call.
let memoryCache: Person[] | null = null;

function mapRow(row: Record<string, unknown>): Person {
  return {
    id: row.id as number,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    phone: row.phone as string,
    office: row.office as string,
    city: row.city as string,
    state: row.state as string,
    role: row.role as PersonRole,
    title: row.title as string,
  };
}

async function fetchAllFromSupabase(): Promise<Person[]> {
  const BATCH = 1000;
  const all: Person[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .order("id")
      .range(from, from + BATCH - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data.map(mapRow));
    if (data.length < BATCH) break;
    from += BATCH;
  }

  return all;
}

// Returns the full dataset, resolved in priority order:
//   1. In-memory cache (already loaded this session)
//   2. IndexedDB   (persisted from a previous session)
//   3. Supabase    (network fetch, then written to IndexedDB)
//   4. In-memory generation (fallback when Supabase is not configured)
async function getAllPeople(): Promise<Person[]> {
  if (memoryCache) return memoryCache;

  if (typeof window !== "undefined") {
    try {
      const idb = await getCachedPeople();
      if (idb) {
        memoryCache = idb;
        return memoryCache;
      }
    } catch {
      // IndexedDB unavailable (e.g. private browsing) — continue
    }
  }

  if (supabaseConfigured) {
    try {
      const people = await fetchAllFromSupabase();
      if (typeof window !== "undefined") {
        try {
          await setCachedPeople(people);
        } catch {
          // Write to IndexedDB failed — not critical
        }
      }
      memoryCache = people;
      return memoryCache;
    } catch {
      // Supabase unreachable — fall through to in-memory generation
    }
  }

  memoryCache = PEOPLE_DATA;
  return memoryCache;
}

export async function fetchPeople(
  params: FetchPeopleParams
): Promise<FetchPeopleResult> {
  const { start, size, sorting, globalFilter } = params;

  let filtered: Person[] = await getAllPeople();

  if (globalFilter && globalFilter.trim() !== "") {
    const needle = globalFilter.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.firstName.toLowerCase().includes(needle) ||
        p.lastName.toLowerCase().includes(needle) ||
        p.email.toLowerCase().includes(needle) ||
        p.city.toLowerCase().includes(needle) ||
        p.state.toLowerCase().includes(needle)
    );
  }

  if (sorting && sorting.length > 0) {
    filtered = [...filtered].sort((a, b) => {
      for (const { id, desc } of sorting) {
        const key = id as keyof Person;
        const aVal = a[key];
        const bVal = b[key];

        let cmp: number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }

        if (cmp !== 0) return desc ? -cmp : cmp;
      }
      return 0;
    });
  }

  const totalCount = filtered.length;
  const rows = filtered.slice(start, start + size);

  return { rows, totalCount };
}
