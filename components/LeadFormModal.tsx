"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  createLeadAction,
  updateLeadAction,
  type LeadFormActionResult,
} from "@/app/leads/actions";
import type { Lead } from "@/lib/data";

export interface LeadFormSearchParams {
  readonly q?: string;
  readonly stage?: string;
}

interface LeadFormModalProps {
  readonly lead?: Lead | null;
  readonly searchParams?: LeadFormSearchParams;
}

interface IdleFormState {
  readonly status: "idle";
  readonly message: "";
  readonly fieldErrors: Partial<Record<"name" | "company" | "email", string>>;
}

type ModalFormState = LeadFormActionResult | IdleFormState;

const IDLE_FORM_STATE: IdleFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

function buildCloseHref(
  searchParams: LeadFormSearchParams | undefined,
): string {
  const params = new URLSearchParams();

  if (searchParams?.q !== undefined && searchParams.q.length > 0) {
    params.set("q", searchParams.q);
  }

  if (searchParams?.stage !== undefined && searchParams.stage.length > 0) {
    params.set("stage", searchParams.stage);
  }

  const query = params.toString();

  return query.length > 0 ? `/leads?${query}` : "/leads";
}

function getInputClasses(error: string | undefined): string {
  const stateClasses =
    error === undefined
      ? "border-slate-300 focus:border-slate-900 focus:ring-slate-900/10"
      : "border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-500/10";

  return `mt-2 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${stateClasses}`;
}

function getSubmissionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return "The request could not be completed. Your changes are still here—please try again.";
  }

  return "Something unexpected interrupted the request. Your changes are still here—please try again.";
}

export default function LeadFormModal({
  lead = null,
  searchParams,
}: LeadFormModalProps): React.ReactElement {
  const router = useRouter();
  const closeHref = buildCloseHref(searchParams);
  const isEditMode = lead !== null;
  const [name, setName] = useState(lead?.name ?? "");
  const [company, setCompany] = useState(lead?.company ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [formState, setFormState] =
    useState<ModalFormState>(IDLE_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();
  const isPending = isSubmitting || isTransitionPending;

  useEffect(() => {
    setName(lead?.name ?? "");
    setCompany(lead?.company ?? "");
    setEmail(lead?.email ?? "");
    setFormState(IDLE_FORM_STATE);
  }, [lead]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isPending) {
        router.replace(closeHref);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeHref, isPending, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    startTransition(() => {
      const actionPromise =
        lead === null
          ? createLeadAction(formData)
          : updateLeadAction(lead.id, formData);

      void actionPromise
        .then((result) => {
          setFormState(result);

          if (result.status === "success") {
            router.replace(closeHref);
            router.refresh();
          }
        })
        .catch((error: unknown) => {
          setFormState({
            status: "error",
            message: getSubmissionErrorMessage(error),
            fieldErrors: {},
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    });
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    setName(event.target.value);
  }

  function handleCompanyChange(event: ChangeEvent<HTMLInputElement>): void {
    setCompany(event.target.value);
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
  }

  const nameError = formState.fieldErrors.name;
  const companyError = formState.fieldErrors.company;
  const emailError = formState.fieldErrors.email;
  const formError =
    formState.status === "error" ? formState.message : undefined;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 sm:p-6">
      <Link
        href={closeHref}
        aria-label="Close lead form"
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
        aria-describedby="lead-form-description"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20"
      >
        <header className="border-b border-slate-200 px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {isEditMode ? "Edit opportunity" : "New opportunity"}
              </p>
              <h2
                id="lead-form-title"
                className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
              >
                {isEditMode ? `Update ${lead.name}` : "Add a lead"}
              </h2>
              <p
                id="lead-form-description"
                className="mt-2 text-sm leading-6 text-slate-600"
              >
                {isEditMode
                  ? "Keep the contact record accurate for the entire sales team."
                  : "Create a clean contact record for a new business opportunity."}
              </p>
            </div>
            <Link
              href={closeHref}
              aria-label="Close lead form"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">×</span>
            </Link>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          aria-busy={isPending}
          className="space-y-5 px-6 py-6 sm:px-7"
        >
          {formError === undefined ? null : (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-800"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="lead-name"
              className="text-sm font-semibold text-slate-800"
            >
              Contact name
              <span className="ml-1 text-red-600" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="lead-name"
              name="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              autoComplete="name"
              autoFocus
              required
              disabled={isPending}
              aria-invalid={nameError === undefined ? undefined : true}
              aria-describedby={
                nameError === undefined ? undefined : "lead-name-error"
              }
              className={getInputClasses(nameError)}
              placeholder="Sarah Jenkins"
            />
            {nameError === undefined ? null : (
              <p
                id="lead-name-error"
                role="alert"
                className="mt-2 text-sm font-medium text-red-700"
              >
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lead-company"
              className="text-sm font-semibold text-slate-800"
            >
              Company
              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>
            <input
              id="lead-company"
              name="company"
              type="text"
              value={company}
              onChange={handleCompanyChange}
              autoComplete="organization"
              disabled={isPending}
              aria-invalid={companyError === undefined ? undefined : true}
              aria-describedby={
                companyError === undefined ? undefined : "lead-company-error"
              }
              className={getInputClasses(companyError)}
              placeholder="Acme Corp"
            />
            {companyError === undefined ? null : (
              <p
                id="lead-company-error"
                role="alert"
                className="mt-2 text-sm font-medium text-red-700"
              >
                {companyError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lead-email"
              className="text-sm font-semibold text-slate-800"
            >
              Email address
              <span className="ml-1 text-red-600" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="lead-email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              inputMode="email"
              required
              disabled={isPending}
              aria-invalid={emailError === undefined ? undefined : true}
              aria-describedby={
                emailError === undefined ? "lead-email-hint" : "lead-email-error"
              }
              className={getInputClasses(emailError)}
              placeholder="sarah@acme.com"
            />
            {emailError === undefined ? (
              <p id="lead-email-hint" className="mt-2 text-xs text-slate-500">
                Each lead must have a unique email address.
              </p>
            ) : (
              <p
                id="lead-email-error"
                role="alert"
                className="mt-2 text-sm font-medium text-red-700"
              >
                {emailError}
              </p>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Link
              href={closeHref}
              aria-disabled={isPending}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
                isPending ? "pointer-events-none opacity-60" : ""
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            >
              {isPending
                ? isEditMode
                  ? "Saving changes…"
                  : "Adding lead…"
                : isEditMode
                  ? "Save changes"
                  : "Add lead"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
