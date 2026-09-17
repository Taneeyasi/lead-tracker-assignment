"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { markLeadsStaleAction } from "@/app/leads/actions";
import type { Lead } from "@/lib/data";

interface StaleScannerModalProps {
  readonly staleLeads: readonly Lead[];
}

const UPDATED_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function getBatchErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message === "Database connection timeout"
  ) {
    return "The data service timed out before making any changes. Review the list and try again.";
  }

  return "The stale batch could not be completed. No accounts were changed.";
}

export default function StaleScannerModal({
  staleLeads,
}: StaleScannerModalProps): React.ReactElement {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );
  const isPending = isSubmitting || isTransitionPending;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isPending) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, isPending]);

  function openScanner(): void {
    setError(null);
    setCompletionMessage(null);
    setIsOpen(true);
  }

  function closeScanner(): void {
    if (!isPending) {
      setIsOpen(false);
      setError(null);
    }
  }

  function confirmStaleBatch(): void {
    if (staleLeads.length === 0 || isPending) {
      return;
    }

    const targetIds = staleLeads.map((lead) => lead.id);
    setError(null);
    setIsSubmitting(true);

    startTransition(() => {
      void markLeadsStaleAction(targetIds)
        .then((result) => {
          setCompletionMessage(
            `${result.count} ${
              result.count === 1 ? "account was" : "accounts were"
            } marked stale.`,
          );
          setIsOpen(false);
          router.refresh();
        })
        .catch((caughtError: unknown) => {
          setError(getBatchErrorMessage(caughtError));
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    });
  }

  return (
    <>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <button
          type="button"
          onClick={openScanner}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-amber-500"
          />
          Scan for Stale Accounts
        </button>
        {completionMessage === null ? null : (
          <p role="status" className="text-sm font-medium text-emerald-700">
            {completionMessage}
          </p>
        )}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 sm:p-6">
          <button
            type="button"
            onClick={closeScanner}
            disabled={isPending}
            aria-label="Close stale account scanner"
            className="fixed inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm disabled:cursor-wait"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stale-scanner-title"
            aria-describedby="stale-scanner-description"
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20"
          >
            <header className="border-b border-slate-200 px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Follow-up health
                  </p>
                  <h2
                    id="stale-scanner-title"
                    className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
                  >
                    Stale account review
                  </h2>
                  <p
                    id="stale-scanner-description"
                    className="mt-2 max-w-xl text-sm leading-6 text-slate-600"
                  >
                    {staleLeads.length === 0
                      ? "Every account has been updated within the last seven days."
                      : `${staleLeads.length} ${
                          staleLeads.length === 1 ? "account has" : "accounts have"
                        } gone seven or more days without an update. Confirm the exact list before applying the stale tag.`}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeScanner}
                  disabled={isPending}
                  aria-label="Close stale account scanner"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            </header>

            <div className="px-6 py-6 sm:px-7">
              {error === null ? null : (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-800"
                >
                  {error}
                </div>
              )}

              {staleLeads.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center">
                  <span
                    aria-hidden="true"
                    className="mx-auto block h-3 w-3 rounded-full bg-emerald-500"
                  />
                  <p className="mt-3 font-semibold text-emerald-950">
                    The pipeline is current
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    No account requires a stale marker.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200">
                  <ul className="divide-y divide-slate-100">
                    {staleLeads.map((lead) => (
                      <li
                        key={lead.id}
                        className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {lead.name}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {lead.company.length > 0
                              ? lead.company
                              : "No company supplied"}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs font-medium text-slate-500">
                          Last updated{" "}
                          <time dateTime={lead.updatedAt.toISOString()}>
                            {UPDATED_DATE_FORMATTER.format(lead.updatedAt)}
                          </time>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={closeScanner}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStaleBatch}
                disabled={staleLeads.length === 0 || isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-sm transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Marking accounts…" : "Confirm stale batch"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
