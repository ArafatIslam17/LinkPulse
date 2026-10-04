import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-route" />
      <path
        d="M8 21c2.5-9 13.5-9 16 0"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-route-ink"
      />
      <circle cx="8" cy="21.5" r="2.6" className="fill-route-ink" />
      <circle cx="24" cy="21.5" r="2.6" className="fill-route-ink" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-lg font-semibold tracking-tight">
      <LogoMark />
      <span className="text-[17px]">{siteConfig.name}</span>
    </Link>
  );
}
