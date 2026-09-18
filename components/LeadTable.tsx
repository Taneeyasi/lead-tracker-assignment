"use client";

import Link from "next/link";
import {
  useEffect,
  useReducer,
  useTransition,
  type ChangeEvent,
} from "react";

import { updateLeadStageAction } from "@/app/leads/actions";
import type { Lead, Stage } from "@/lib/data";

export interface LeadTableSearchParams {
  readonly q?: string;
  readonly stage?: string;
}

interface LeadTableProps {
  readonly leads: readonly Lead[];
  readonly searchParams?: LeadTableSearchParams;
}

interface LeadRowState {
  readonly confirmedStage: Stage;
  readonly displayedStage: Stage;
  readonly isPending: boolean;
  readonly error: string | null;
}

type LeadRowStates = Record<string, LeadRowState>;

type LeadTableAction =
  | {
      readonly type: "sync";
      readonly leads: readonly Lead[];
    }
  | {
      readonly type: "optimistic";
      readonly id: string;
      readonly nextStage: Stage;
    }
  | {
      readonly type: "confirmed";
      readonly id: string;
      readonly stage: Stage;
    }
  | {
      readonly type: "failed";
      readonly id: string;
      readonly message: string;
    };

interface StagePresentation {
  readonly select: string;
  readonly dot: string;
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
    select: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  Contacted: {
    select: "border-violet-200 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
  },
  Qualified: {
    select: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  Won: {
    select: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  Lost: {
    select: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
};

const CREATED_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function createLeadRowStates(leads: readonly Lead[]): LeadRowStates {
  const rowStates: LeadRowStates = {};

  for (const lead of leads) {
    rowStates[lead.id] = {
      confirmedStage: lead.stage,
      displayedStage: lead.stage,
      isPending: false,
      error: null,
    };
  }

  return rowStates;
}

function leadTableReducer(
  state: LeadRowStates,
  action: LeadTableAction,
): LeadRowStates {
  switch (action.type) {
    case "sync": {
      const synchronizedState: LeadRowStates = {};

      for (const lead of action.leads) {
        const currentState = state[lead.id];

        synchronizedState[lead.id] =
          currentState?.isPending === true
            ? currentState
            : {
                confirmedStage: lead.stage,
                displayedStage: lead.stage,
                isPending: false,
                error: currentState?.error ?? null,
              };
      }

      return synchronizedState;
    }

    case "optimistic": {
      const currentState = state[action.id];

      if (currentState === undefined) {
        return state;
      }

      return {
        ...state,
        [action.id]: {
          ...currentState,
          displayedStage: action.nextStage,
          isPending: true,
          error: null,
        },
      };
    }

    case "confirmed": {
      const currentState = state[action.id];

      if (currentState === undefined) {
        return state;
      }

      return {
        ...state,
        [action.id]: {
          confirmedStage: action.stage,
          displayedStage: action.stage,
          isPending: false,
          error: null,
        },
      };
    }

    case "failed": {
      const currentState = state[action.id];

      if (currentState === undefined) {
        return state;
      }

      return {
        ...state,
        [action.id]: {
          ...currentState,
          displayedStage: currentState.confirmedStage,
          isPending: false,
          error: action.message,
        },
      };
    }
  }
}

function parseStage(value: string): Stage | null {
  switch (value) {
    case "New":
    case "Contacted":
    case "Qualified":
    case "Won":
    case "Lost":
      return value;
    default:
      return null;
  }
}

function buildEditHref(
  id: string,
  searchParams: LeadTableSearchParams | undefined,
): string {
  const params = new URLSearchParams();

  if (searchParams?.q !== undefined && searchParams.q.length > 0) {
    params.set("q", searchParams.q);
  }

  if (searchParams?.stage !== undefined && searchParams.stage.length > 0) {
    params.set("stage", searchParams.stage);
  }

  params.set("edit", id);

  return `/leads?${params.toString()}`;
}

function getUpdateErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return "Update failed. The list shows the original saved stage.";
  }

  return "Update failed. The list shows the original saved stage.";
}

export default function LeadTable({
  leads,
  searchParams,
}: LeadTableProps): React.ReactElement {
  const [rowStates, dispatch] = useReducer(
    leadTableReducer,
    leads,
    createLeadRowStates,
  );
  const [isTransitionPending, startTransition] = useTransition();

  useEffect(() => {
    dispatch({ type: "sync", leads });
  }, [leads]);

  function handleStageChange(
    leadId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const nextStage = parseStage(event.target.value);
    const currentState = rowStates[leadId];

    if (
      nextStage === null ||
      currentState === undefined ||
      currentState.isPending ||
      nextStage === currentState.displayedStage
    ) {
      return;
    }

    dispatch({ type: "optimistic", id: leadId, nextStage });

    startTransition(() => {
      void updateLeadStageAction(leadId, nextStage)
        .then((result) => {
          dispatch({
            type: "confirmed",
            id: result.id,
            stage: result.stage,
          });
        })
        .catch((error: unknown) => {
          dispatch({
            type: "failed",
            id: leadId,
            message: getUpdateErrorMessage(error),
          });
        });
    });
  }

  return (
    <section
      aria-labelledby="lead-directory-heading"
      aria-busy={isTransitionPending}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2
            id="lead-directory-heading"
            className="text-lg font-semibold tracking-tight text-slate-950"
          >
            Lead directory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {leads.length} {leads.length === 1 ? "opportunity" : "opportunities"}
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Stage changes save automatically
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th
                scope="col"
                className="whitespace-nowrap border-b border-slate-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                Contact
              </th>
              <th
                scope="col"
                className="whitespace-nowrap border-b border-slate-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                Company
              </th>
              <th
                scope="col"
                className="whitespace-nowrap border-b border-slate-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                Email
              </th>
              <th
                scope="col"
                className="whitespace-nowrap border-b border-slate-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                Pipeline stage
              </th>
              <th
                scope="col"
                className="whitespace-nowrap border-b border-slate-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                Created
              </th>
              <th
                scope="col"
                className="border-b border-slate-200 px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const rowState = rowStates[lead.id] ?? {
                confirmedStage: lead.stage,
                displayedStage: lead.stage,
                isPending: false,
                error: null,
              };
              const presentation =
                STAGE_PRESENTATION[rowState.displayedStage];
              const errorId = `stage-error-${lead.id}`;

              return (
                <tr
                  key={lead.id}
                  className="group transition-colors hover:bg-slate-50/80"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${presentation.dot}`}
                      />
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {lead.name}
                        </span>
                        {lead.isStale ? (
                          <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-amber-900">
                            Stale
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {lead.company.length > 0 ? lead.company : "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                      {lead.email}
                    </a>
                  </td>
                  <td className="min-w-56 px-6 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <select
                        value={rowState.displayedStage}
                        onChange={(event) =>
                          handleStageChange(lead.id, event)
                        }
                        disabled={rowState.isPending}
                        aria-label={`Change ${lead.name}'s pipeline stage`}
                        aria-describedby={
                          rowState.error === null ? undefined : errorId
                        }
                        className={`w-full max-w-40 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm outline-none transition focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${presentation.select}`}
                      >
                        {STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                      {rowState.isPending ? (
                        <span
                          role="status"
                          className="text-xs font-medium text-slate-500"
                        >
                          Saving stage…
                        </span>
                      ) : null}
                      {rowState.error === null ? null : (
                        <p
                          id={errorId}
                          role="alert"
                          className="max-w-64 text-xs font-medium leading-5 text-rose-700"
                        >
                          <span aria-hidden="true">× </span>
                          {rowState.error}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <time dateTime={lead.createdAt.toISOString()}>
                      {CREATED_DATE_FORMATTER.format(lead.createdAt)}
                    </time>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={buildEditHref(lead.id, searchParams)}
                      className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                      Edit
                      <span className="sr-only"> {lead.name}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
