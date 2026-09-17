"use server";

import { revalidatePath } from "next/cache";

import {
  createLead,
  DuplicateEmailError,
  markLeadsStale,
  updateLead,
  type Stage,
} from "@/lib/data";

type LeadFormField = "name" | "company" | "email";

export interface LeadFormActionResult {
  readonly status: "success" | "validation-error" | "error";
  readonly message: string;
  readonly fieldErrors: Partial<Record<LeadFormField, string>>;
  readonly leadId?: string;
}

export interface StageActionResult {
  readonly id: string;
  readonly stage: Stage;
  readonly updatedAt: string;
}

export interface StaleBatchActionResult {
  readonly count: number;
  readonly updatedIds: readonly string[];
}

const STAGES = new Set<Stage>([
  "New",
  "Contacted",
  "Qualified",
  "Won",
  "Lost",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readTextField(formData: FormData, field: LeadFormField): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function validateLeadFields(
  name: string,
  email: string,
): Partial<Record<LeadFormField, string>> {
  const fieldErrors: Partial<Record<LeadFormField, string>> = {};

  if (name.length === 0) {
    fieldErrors.name = "Enter the contact's name.";
  }

  if (email.length === 0) {
    fieldErrors.email = "Enter the contact's email address.";
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  return fieldErrors;
}

export async function createLeadAction(
  formData: FormData,
): Promise<LeadFormActionResult> {
  const name = readTextField(formData, "name");
  const company = readTextField(formData, "company");
  const email = readTextField(formData, "email").toLowerCase();
  const fieldErrors = validateLeadFields(name, email);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "validation-error",
      message: "Review the highlighted fields and try again.",
      fieldErrors,
    };
  }

  try {
    const lead = await createLead({
      name,
      company,
      email,
      stage: "New",
    });

    revalidatePath("/leads");

    return {
      status: "success",
      message: `${lead.name} was added to the pipeline.`,
      fieldErrors: {},
      leadId: lead.id,
    };
  } catch (error: unknown) {
    if (error instanceof DuplicateEmailError) {
      return {
        status: "validation-error",
        message: "This lead could not be added.",
        fieldErrors: {
          email: "A lead with this email address already exists",
        },
      };
    }

    return {
      status: "error",
      message:
        "We couldn't add this lead right now. Your information is still here—please try again.",
      fieldErrors: {},
    };
  }
}

export async function updateLeadAction(
  id: string,
  formData: FormData,
): Promise<LeadFormActionResult> {
  const name = readTextField(formData, "name");
  const company = readTextField(formData, "company");
  const email = readTextField(formData, "email").toLowerCase();
  const fieldErrors = validateLeadFields(name, email);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "validation-error",
      message: "Review the highlighted fields and try again.",
      fieldErrors,
    };
  }

  try {
    const lead = await updateLead(id, {
      name,
      company,
      email,
    });

    revalidatePath("/leads");

    return {
      status: "success",
      message: `${lead.name}'s details were updated.`,
      fieldErrors: {},
      leadId: lead.id,
    };
  } catch (error: unknown) {
    if (error instanceof DuplicateEmailError) {
      return {
        status: "validation-error",
        message: "This lead could not be updated.",
        fieldErrors: {
          email: "A lead with this email address already exists",
        },
      };
    }

    return {
      status: "error",
      message:
        "We couldn't update this lead right now. Your changes are still here—please try again.",
      fieldErrors: {},
    };
  }
}

export async function updateLeadStageAction(
  id: string,
  nextStage: Stage,
): Promise<StageActionResult> {
  if (!STAGES.has(nextStage)) {
    throw new Error("Invalid pipeline stage");
  }

  try {
    const updatedLead = await updateLead(id, { stage: nextStage });

    revalidatePath("/leads");

    return {
      id: updatedLead.id,
      stage: updatedLead.stage,
      updatedAt: updatedLead.updatedAt.toISOString(),
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unexpected stage update failure", { cause: error });
  }
}

export async function markLeadsStaleAction(
  ids: readonly string[],
): Promise<StaleBatchActionResult> {
  if (
    ids.some(
      (id) => typeof id !== "string" || id.trim().length === 0,
    )
  ) {
    throw new Error("Invalid stale batch");
  }

  try {
    const updatedLeads = await markLeadsStale(ids);

    revalidatePath("/leads");

    return {
      count: updatedLeads.length,
      updatedIds: updatedLeads.map((lead) => lead.id),
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unexpected stale batch failure", { cause: error });
  }
}
