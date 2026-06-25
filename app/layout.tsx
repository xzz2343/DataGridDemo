import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "People Directory — DataGrid Demo",
  description: "A TanStack Table demo with virtualized rendering of 10,000 people records.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 h-screen overflow-hidden">
        {/* Runs before first paint to avoid flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none"
        >
          Skip to content
        </a>
        <main id="main-content" className="h-full">{children}</main>
      </body>
    </html>
  );
}
