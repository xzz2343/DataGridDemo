"use client";

import PeopleTable from "@/components/PeopleTable";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex flex-col h-full p-4 gap-2">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">People Directory</h1>
        <ThemeToggle />
      </div>
      <div className="flex-1 min-h-0">
        <PeopleTable />
      </div>
    </div>
  );
}
