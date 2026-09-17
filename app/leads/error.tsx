"use client";

import { useEffect } from "react";

interface LeadsErrorProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

export default function LeadsError({
  error,
  reset,
}: LeadsErrorProps): React.ReactElement {
  useEffect(() => {
    console.error("Lead workspace render failed", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12 sm:px-6">
      <section
        aria-labelledby="lead-error-title"
        aria-describedby="lead-error-description"
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10 ring-1 ring-slate-100"
      >
        <div className="border-b border-red-100 bg-red-50 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-xl font-bold text-red-700"
            >
              !
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">
                Data interruption
              </p>
              <h1
                id="lead-error-title"
                className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
              >
                We couldn&apos;t load the lead workspace
              </h1>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <p
            id="lead-error-description"
            className="text-sm leading-7 text-slate-600"
          >
            A data transaction was interrupted before the dashboard could be
            prepared. No changes were made. Try the request again to reconnect
            to the current pipeline.
          </p>

          {error.digest === undefined ? null : (
            <p className="mt-4 text-xs font-medium text-slate-400">
              Reference: {error.digest}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Try Again
            </button>
            <a
              href="/leads"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Reload workspace
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
