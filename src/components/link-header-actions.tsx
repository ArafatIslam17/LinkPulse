"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { displayShortUrl } from "@/lib/format";
import { CopyButton } from "./copy-button";
import { DeleteLinkDialog } from "./delete-link-dialog";
import { buttonClass } from "./ui";

export function LinkHeaderActions({ shortCode, shortUrl }: { shortCode: string; shortUrl: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton value={shortUrl} label="Copy link" variant="primary" />
      <a href={shortUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
        <ExternalLink className="size-4" aria-hidden="true" />
        Open
      </a>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={buttonClass("ghost", "md", "hover:bg-danger-soft hover:text-danger")}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </button>
      {confirming && (
        <DeleteLinkDialog
          shortCode={shortCode}
          displayUrl={displayShortUrl(shortUrl)}
          open
          onClose={() => setConfirming(false)}
          onDeleted={() => router.replace("/dashboard")}
        />
      )}
    </div>
  );
}
