import { Person } from "../types/person";
import { PEOPLE_DATA } from "../data/people";

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

export async function fetchPeople(
  params: FetchPeopleParams
): Promise<FetchPeopleResult> {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

  const { start, size, sorting, globalFilter } = params;

  let filtered: Person[] = PEOPLE_DATA;

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

        if (cmp !== 0) {
          return desc ? -cmp : cmp;
        }
      }
      return 0;
    });
  }

  const totalCount = filtered.length;
  const rows = filtered.slice(start, start + size);

  return { rows, totalCount };
}
