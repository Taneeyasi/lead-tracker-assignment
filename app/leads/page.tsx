import type { Metadata } from "next";
import Link from "next/link";

import LeadFormModal from "@/components/LeadFormModal";
import LeadTable from "@/components/LeadTable";
import StaleScannerModal from "@/components/StaleScannerModal";
import SummaryBar from "@/components/SummaryBar";
import {
  findStaleLeads,
  getLead,
  getLeads,
  type Stage,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Pipeline",
  description:
    "Search, review, and advance business opportunities across the sales pipeline.",
};

type SearchParamValue = string | readonly string[] | undefined;

interface LeadsPageSearchParams {
  readonly q?: SearchParamValue;
  readonly stage?: SearchParamValue;
  readonly add?: SearchParamValue;
  readonly edit?: SearchParamValue;
}

interface LeadsPageProps {
  readonly searchParams: LeadsPageSearchParams;
}

const STAGE_OPTIONS: readonly {
  readonly label: Stage;
  readonly value: string;
}[] = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
];

const METRIC_ANCHOR_DATE = new Date("2026-09-17T23:59:59.999Z");

function readSearchParam(value: SearchParamValue): string | undefined {
  const firstValue = typeof value === "string" ? value : value?.[0];
  const normalizedValue = firstValue?.trim();

  return normalizedValue === undefined || normalizedValue.length === 0
    ? undefined
    : normalizedValue;
}

function parseStage(value: string | undefined): Stage | undefined {
  switch (value?.toLowerCase()) {
    case "new":
      return "New";
    case "contacted":
      return "Contacted";
    case "qualified":
      return "Qualified";
    case "won":
      return "Won";
    case "lost":
      return "Lost";
    default:
      return undefined;
  }
}

function buildWorkspaceParams(
  q: string | undefined,
  stage: Stage | undefined,
): URLSearchParams {
  const params = new URLSearchParams();

  if (q !== undefined) {
    params.set("q", q);
  }

  if (stage !== undefined) {
    params.set("stage", stage.toLowerCase());
  }

  return params;
}

function buildWorkspaceHref(
  q: string | undefined,
  stage: Stage | undefined,
): string {
  const params = buildWorkspaceParams(q, stage);
  const query = params.toString();

  return query.length > 0 ? `/leads?${query}` : "/leads";
}

function buildAddLeadHref(
  q: string | undefined,
  stage: Stage | undefined,
): string {
  const params = buildWorkspaceParams(q, stage);

  params.set("add", "1");

  return `/leads?${params.toString()}`;
}

export default async function LeadsPage({
  searchParams,
}: LeadsPageProps): Promise<React.ReactElement> {
  const q = readSearchParam(searchParams.q);
  const rawStage = readSearchParam(searchParams.stage);
  const stage = parseStage(rawStage);
  const addMode = readSearchParam(searchParams.add) === "1";
  const editId = readSearchParam(searchParams.edit);
  const childSearchParams = {
    q,
    stage: stage?.toLowerCase(),
  };

  const [filteredLeads, allLeads] = await Promise.all([
    getLeads({ q, stage }),
    getLeads(),
  ]);
  const staleLeads = findStaleLeads(allLeads, METRIC_ANCHOR_DATE);
  const leadToEdit = editId === undefined ? null : await getLead(editId);
  const hasActiveFilters = q !== undefined || rawStage !== undefined;
  const invalidEditTarget = editId !== undefined && leadToEdit === null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sales workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Lead pipeline
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Keep every opportunity visible, current, and moving toward a
              clear outcome.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
            <StaleScannerModal staleLeads={staleLeads} />
            <Link
              href={buildAddLeadHref(q, stage)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Add Lead
            </Link>
          </div>
        </header>

        <SummaryBar leads={allLeads} searchParams={childSearchParams} />

        <section
          aria-labelledby="lead-filters-heading"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="lead-filters-heading"
                className="font-semibold text-slate-950"
              >
                Find an opportunity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search by contact or company, then refine by stage.
              </p>
            </div>
            {hasActiveFilters ? (
              <Link
                href="/leads"
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Clear filters
              </Link>
            ) : null}
          </div>

          <form
            action="/leads"
            method="get"
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto]"
          >
            <div>
              <label htmlFor="lead-search" className="sr-only">
                Search contacts or companies
              </label>
              <input
                id="lead-search"
                name="q"
                type="search"
                defaultValue={q ?? ""}
                placeholder="Search by name or company"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label htmlFor="stage-filter" className="sr-only">
                Filter by pipeline stage
              </label>
              <select
                id="stage-filter"
                name="stage"
                defaultValue={stage?.toLowerCase() ?? ""}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
              >
                <option value="">All stages</option>
                {STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Apply filters
            </button>
          </form>
        </section>

        {invalidEditTarget ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-medium">
              That lead is no longer available. The current directory is still
              up to date.
            </p>
            <Link
              href={buildWorkspaceHref(q, stage)}
              className="shrink-0 font-semibold underline underline-offset-4"
            >
              Return to the directory
            </Link>
          </div>
        ) : null}

        {filteredLeads.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="mx-auto block h-3 w-3 rounded-full bg-slate-300"
            />
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
              No leads found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              {q === undefined
                ? "No opportunities match this pipeline stage."
                : `No contacts or companies match “${q}” with the selected stage.`}
            </p>
            <Link
              href="/leads"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Clear filters
            </Link>
          </section>
        ) : (
          <LeadTable
            leads={filteredLeads}
            searchParams={childSearchParams}
          />
        )}
      </div>

      {leadToEdit !== null ? (
        <LeadFormModal
          lead={leadToEdit}
          searchParams={childSearchParams}
        />
      ) : addMode ? (
        <LeadFormModal searchParams={childSearchParams} />
      ) : null}
    </main>
  );
}
