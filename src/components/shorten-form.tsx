"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { createLinkAction, type CreateLinkState } from "@/app/actions";
import { linkRules } from "@/lib/config";
import { ShortenResult } from "./shorten-result";
import { buttonClass } from "./ui";

const initialState: CreateLinkState = { status: "idle" };

export function ShortenForm({ displayHost, timeZone }: { displayHost: string; timeZone: string }) {
  const [state, formAction, pending] = useActionState(createLinkAction, initialState);
  const [aliasOpen, setAliasOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const aliasInputRef = useRef<HTMLInputElement>(null);
  const ids = { url: useId(), alias: useId(), urlError: useId(), aliasError: useId(), aliasHint: useId() };

  const error = state.status === "error" ? state : null;
  const values = error?.values;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setAliasOpen(false);
      toast.success("Short link created");
    } else if (state.status === "error") {
      if (state.field === "form") toast.error(state.message);
      if (state.field === "alias") {
        setAliasOpen(true);
        aliasInputRef.current?.focus();
      }
      if (state.field === "url") urlInputRef.current?.focus();
    }
  }, [state]);

  return (
    <div>
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="rounded-2xl bg-surface p-2 shadow-[inset_0_0_0_1px_var(--line),0_12px_32px_-18px_rgb(19_26_46/0.35)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={ids.url} className="sr-only">
            Long URL
          </label>
          <input
            ref={urlInputRef}
            id={ids.url}
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={linkRules.maxUrlLength}
            defaultValue={values?.url}
            key={`url-${state.status === "success" ? state.link.shortCode : "draft"}`}
            placeholder="Paste a long link, like https://example.com/a/very/long/path"
            aria-invalid={error?.field === "url" || undefined}
            aria-describedby={error?.field === "url" ? ids.urlError : undefined}
            className="min-h-13 w-full min-w-0 rounded-xl bg-transparent px-4 text-base outline-none placeholder:text-faint focus-visible:outline-none"
          />
          <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "sm:w-auto")}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {pending ? "Shortening" : "Shorten URL"}
          </button>
        </div>

        <div className="border-t border-line px-2 pt-1 mt-2">
          <button
            type="button"
            onClick={() => setAliasOpen((o) => !o)}
            aria-expanded={aliasOpen}
            aria-controls={ids.alias}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted hover:text-ink"
          >
            <ChevronDown
              className={clsx("size-4 transition-transform", aliasOpen && "rotate-180")}
              aria-hidden="true"
            />
            Custom alias
            <span className="font-normal text-faint">(optional)</span>
          </button>
          <div hidden={!aliasOpen} className="px-2 pb-3">
            <label htmlFor={ids.alias} className="mb-1.5 block text-sm text-muted">
              Choose the ending of your short link
            </label>
            <div
              className={clsx(
                "flex min-h-12 items-center overflow-hidden rounded-xl bg-bg shadow-[inset_0_0_0_1px_var(--line)] focus-within:shadow-[inset_0_0_0_2px_var(--route)]",
                error?.field === "alias" && "shadow-[inset_0_0_0_1px_var(--danger)]",
              )}
            >
              <span className="hidden pl-4 font-mono text-sm text-faint sm:inline">{displayHost}/</span>
              <span className="pl-4 font-mono text-sm text-faint sm:hidden">/</span>
              <input
                ref={aliasInputRef}
                id={ids.alias}
                name="alias"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={linkRules.aliasMaxLength}
                defaultValue={values?.alias}
                key={`alias-${state.status === "success" ? state.link.shortCode : "draft"}`}
                placeholder="myportfolio"
                aria-invalid={error?.field === "alias" || undefined}
                aria-describedby={error?.field === "alias" ? ids.aliasError : ids.aliasHint}
                className="min-h-12 w-full min-w-0 bg-transparent pr-4 pl-0.5 font-mono text-base outline-none placeholder:text-faint focus-visible:outline-none"
              />
            </div>
            {error?.field !== "alias" && (
              <p id={ids.aliasHint} className="mt-1.5 text-sm text-faint">
                {linkRules.aliasMinLength} to {linkRules.aliasMaxLength} characters: letters, numbers, hyphens and
                underscores.
              </p>
            )}
          </div>
        </div>
      </form>

      <div aria-live="polite">
        {error && error.field !== "form" && (
          <p
            id={error.field === "url" ? ids.urlError : ids.aliasError}
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {error.message}
          </p>
        )}
        {error?.field === "form" && (
          <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error.message}
          </p>
        )}
        {state.status === "success" && (
          <ShortenResult key={state.link.shortCode} link={state.link} shortUrl={state.shortUrl} timeZone={timeZone} />
        )}
      </div>
    </div>
  );
}
