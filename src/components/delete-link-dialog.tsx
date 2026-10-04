"use client";

import { useEffect, useRef, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLinkAction } from "@/app/actions";
import { Button } from "./ui";

export function DeleteLinkDialog({
  shortCode,
  displayUrl,
  open,
  onClose,
  onDeleted,
}: {
  shortCode: string;
  displayUrl: string;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function confirm() {
    startTransition(async () => {
      const result = await deleteLinkAction(shortCode);
      if (result.ok) {
        toast.success("Link deleted");
        onClose();
        onDeleted?.();
      } else {
        toast.error(result.message ?? "The link couldn't be deleted.");
      }
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current && !pending) onClose();
      }}
      aria-labelledby={`delete-${shortCode}-title`}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="p-6">
        <h2 id={`delete-${shortCode}-title`} className="text-lg font-semibold tracking-tight">
          Delete this link?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          <span className="font-mono break-all text-ink">{displayUrl}</span> will stop redirecting and its click
          history will be removed. This can&apos;t be undone.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end">
        <Button onClick={onClose} disabled={pending} autoFocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirm} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {pending ? "Deleting" : "Delete link"}
        </Button>
      </div>
    </dialog>
  );
}
