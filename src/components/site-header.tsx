"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Scissors } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Shorten", icon: Scissors, match: (p: string) => p === "/" },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, match: (p: string) => p.startsWith("/dashboard") },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]" : "text-muted hover:text-ink",
                )}
              >
                <Icon className="hidden size-4 sm:block" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
