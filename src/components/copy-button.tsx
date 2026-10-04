"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { buttonClass } from "./ui";

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for browsers without the async clipboard API (or non-secure contexts).
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand("copy");
  el.remove();
  if (!ok) throw new Error("copy failed");
}

export function CopyButton({
  value,
  label = "Copy",
  variant = "secondary",
  iconOnly = false,
  className,
}: {
  value: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await writeClipboard(value);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={iconOnly ? `${label} ${value}` : undefined}
      title={iconOnly ? label : undefined}
      className={buttonClass(variant, iconOnly ? "icon" : "md", className)}
    >
      <Icon className={copied ? "size-4 text-success" : "size-4"} aria-hidden="true" />
      {!iconOnly && <span>{copied ? "Copied" : label}</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
