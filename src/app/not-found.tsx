import Link from "next/link";
import { buttonClass } from "@/components/ui";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="mt-3 leading-relaxed text-muted">
          The address may be mistyped, or the link was deleted by the person who created it.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/" className={buttonClass("primary")}>
            Create a short link
          </Link>
          <Link href="/dashboard" className={buttonClass("secondary")}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
