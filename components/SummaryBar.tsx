import Link from "next/link";

import type { Lead, Stage } from "@/lib/data";

export interface SummarySearchParams {
  readonly q?: string;
  readonly stage?: string;
}

interface SummaryBarProps {
  readonly leads: readonly Lead[];
  readonly searchParams: SummarySearchParams;
}

interface StagePresentation {
  readonly dot: string;
  readonly activeCard: string;
}

const STAGES: readonly Stage[] = [
  "New",
  "Contacted",
  "Qualified",
  "Won",
  "Lost",
];

const STAGE_PRESENTATION: Record<Stage, StagePresentation> = {
  New: {
    dot: "bg-sky-500",
    activeCard: "border-sky-300 bg-sky-50 ring-sky-100",
  },
  Contacted: {
    dot: "bg-violet-500",
    activeCard: "border-violet-300 bg-violet-50 ring-violet-100",
  },
  Qualified: {
    dot: "bg-amber-500",
    activeCard: "border-amber-300 bg-amber-50 ring-amber-100",
  },
  Won: {
    dot: "bg-emerald-500",
    activeCard: "border-emerald-300 bg-emerald-50 ring-emerald-100",
  },
  Lost: {
    dot: "bg-rose-500",
    activeCard: "border-rose-300 bg-rose-50 ring-rose-100",
  },
};

const SUMMARY_ANCHOR_MS = Date.parse("2026-09-17T23:59:59.999Z");
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1_000;
const RECENT_WINDOW_START_MS = SUMMARY_ANCHOR_MS - SEVEN_DAYS_MS;

function buildStageHref(q: string | undefined, stage?: Stage): string {
  const params = new URLSearchParams();

  if (q !== undefined && q.length > 0) {
    params.set("q", q);
  }

  if (stage !== undefined) {
    params.set("stage", stage.toLowerCase());
  }

  const query = params.toString();

  return query.length > 0 ? `/leads?${query}` : "/leads";
}

function isActiveStage(activeStage: string | undefined, stage: Stage): boolean {
  return activeStage?.toLowerCase() === stage.toLowerCase();
}

export default function SummaryBar({
  leads,
  searchParams,
}: SummaryBarProps): React.ReactElement {
  const stageCounts: Record<Stage, number> = {
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Won: 0,
    Lost: 0,
  };

  for (const lead of leads) {
    stageCounts[lead.stage] += 1;
  }

  const recentlyAddedCount = leads.filter((lead) => {
    const createdAtMs = lead.createdAt.getTime();

    return (
      createdAtMs >= RECENT_WINDOW_START_MS &&
      createdAtMs <= SUMMARY_ANCHOR_MS
    );
  }).length;

  return (
    <section aria-labelledby="pipeline-overview-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Pipeline health
          </p>
          <h2
            id="pipeline-overview-heading"
            className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
          >
            Sales overview
          </h2>
        </div>
        <p className="hidden text-sm text-slate-500 sm:block">
          Select a stage to filter the workspace
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const active = isActiveStage(searchParams.stage, stage);
          const presentation = STAGE_PRESENTATION[stage];
          const href = buildStageHref(
            searchParams.q,
            active ? undefined : stage,
          );

          return (
            <Link
              key={stage}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group min-w-0 rounded-2xl border p-4 shadow-sm ring-1 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
                active
                  ? presentation.activeCard
                  : "border-slate-200 bg-white ring-slate-100 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${presentation.dot}`}
                />
                <span className="truncate">{stage}</span>
              </span>
              <span className="mt-4 block text-3xl font-semibold tracking-tight text-slate-950">
                {stageCounts[stage]}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {active ? "Clear stage filter" : "View leads"}
              </span>
            </Link>
          );
        })}

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm ring-1 ring-slate-900/5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
            Added in 7 days
          </span>
          <span className="mt-4 block text-3xl font-semibold tracking-tight">
            {recentlyAddedCount}
          </span>
          <span className="mt-1 block text-xs text-slate-300">
            New opportunities
          </span>
        </article>
      </div>
    </section>
  );
}
