"use client";

import PeopleTable from "@/components/PeopleTable";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex flex-col h-full p-4 gap-2">
      <nav aria-label="Breadcrumb" className="shrink-0">
        <ol className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <a
              href="https://www.buckshot-consulting.com/portfolio/"
              className="hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2"
            >
              Portfolio
            </a>
          </li>
          <li aria-hidden="true" className="select-none">›</li>
          <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">
            People Directory
          </li>
        </ol>
      </nav>
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
