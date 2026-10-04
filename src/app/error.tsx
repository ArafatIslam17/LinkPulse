"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button, buttonClass } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">This page couldn&apos;t load</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Something went wrong while loading your data. Your links are safe. Try again, and if it keeps happening,
          check that the database is reachable.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-faint">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap gap-2">
          <Button variant="primary" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Link href="/" className={buttonClass("secondary")}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
