import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type Stage = "New" | "Contacted" | "Qualified" | "Won" | "Lost";

export interface Lead {
  readonly id: string;
  name: string;
  company: string;
  email: string;
  stage: Stage;
  isStale: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}

export type CreateLeadInput = Omit<
  Lead,
  "id" | "isStale" | "createdAt" | "updatedAt"
>;

export interface GetLeadsParams {
  readonly q?: string;
  readonly stage?: Stage;
}

export class DuplicateEmailError extends Error {
  readonly field = "email";

  constructor(email: string) {
    super(`A lead with the email "${email}" already exists.`);
    this.name = "DuplicateEmailError";
  }
}

export class LeadNotFoundError extends Error {
  constructor(id: string) {
    super(`No lead exists with the id "${id}".`);
    this.name = "LeadNotFoundError";
  }
}

const READ_LATENCY_MS = 300;
const WRITE_FAILURE_RATE = 0.1;
const WRITE_FAILURE_MESSAGE = "Database connection timeout";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1_000;

type SeedLead = Omit<Lead, "isStale">;

const seededLeads: SeedLead[] = [
  {
    id: "lead-001",
    name: "Maya Chen",
    company: "Northstar Analytics",
    email: "maya.chen@northstaranalytics.com",
    stage: "New",
    createdAt: new Date("2026-09-16T09:15:00.000Z"),
    updatedAt: new Date("2026-09-16T09:15:00.000Z"),
  },
  {
    id: "lead-002",
    name: "Daniel Okafor",
    company: "Meridian Freight",
    email: "daniel.okafor@meridianfreight.com",
    stage: "New",
    createdAt: new Date("2026-09-13T14:30:00.000Z"),
    updatedAt: new Date("2026-09-14T10:00:00.000Z"),
  },
  {
    id: "lead-003",
    name: "Elena Rossi",
    company: "Lumina Health",
    email: "elena.rossi@luminahealth.com",
    stage: "New",
    createdAt: new Date("2026-09-08T11:45:00.000Z"),
    updatedAt: new Date("2026-09-08T11:45:00.000Z"),
  },
  {
    id: "lead-004",
    name: "Marcus Thompson",
    company: "CedarWorks Manufacturing",
    email: "marcus.thompson@cedarworks.com",
    stage: "New",
    createdAt: new Date("2026-08-30T16:20:00.000Z"),
    updatedAt: new Date("2026-09-09T08:40:00.000Z"),
  },
  {
    id: "lead-005",
    name: "Priya Nair",
    company: "OrbitPay",
    email: "priya.nair@orbitpay.com",
    stage: "New",
    createdAt: new Date("2026-08-21T08:05:00.000Z"),
    updatedAt: new Date("2026-08-25T12:10:00.000Z"),
  },
  {
    id: "lead-006",
    name: "Noah Williams",
    company: "Acme Robotics",
    email: "noah.williams@acmerobotics.com",
    stage: "Contacted",
    createdAt: new Date("2026-09-15T13:10:00.000Z"),
    updatedAt: new Date("2026-09-16T15:35:00.000Z"),
  },
  {
    id: "lead-007",
    name: "Sofia Alvarez",
    company: "Harborline Capital",
    email: "sofia.alvarez@harborlinecapital.com",
    stage: "Contacted",
    createdAt: new Date("2026-09-11T10:25:00.000Z"),
    updatedAt: new Date("2026-09-15T09:50:00.000Z"),
  },
  {
    id: "lead-008",
    name: "Ethan Brooks",
    company: "Fieldstone Energy",
    email: "ethan.brooks@fieldstoneenergy.com",
    stage: "Contacted",
    createdAt: new Date("2026-09-05T17:40:00.000Z"),
    updatedAt: new Date("2026-09-08T09:20:00.000Z"),
  },
  {
    id: "lead-009",
    name: "Amara Mensah",
    company: "Koru Learning",
    email: "amara.mensah@korulearning.com",
    stage: "Contacted",
    createdAt: new Date("2026-08-28T12:00:00.000Z"),
    updatedAt: new Date("2026-09-12T14:15:00.000Z"),
  },
  {
    id: "lead-010",
    name: "Liam Patel",
    company: "Vertex Cloud",
    email: "liam.patel@vertexcloud.com",
    stage: "Contacted",
    createdAt: new Date("2026-08-19T09:35:00.000Z"),
    updatedAt: new Date("2026-08-30T11:25:00.000Z"),
  },
  {
    id: "lead-011",
    name: "Sarah Jenkins",
    company: "Acme Corp",
    email: "sarah.jenkins@acme.com",
    stage: "Qualified",
    createdAt: new Date("2026-09-12T08:50:00.000Z"),
    updatedAt: new Date("2026-09-16T12:45:00.000Z"),
  },
  {
    id: "lead-012",
    name: "Owen Murphy",
    company: "BluePeak Security",
    email: "owen.murphy@bluepeaksecurity.com",
    stage: "Qualified",
    createdAt: new Date("2026-09-07T15:30:00.000Z"),
    updatedAt: new Date("2026-09-13T10:10:00.000Z"),
  },
  {
    id: "lead-013",
    name: "Aisha Rahman",
    company: "Juniper Bio",
    email: "aisha.rahman@juniperbio.com",
    stage: "Qualified",
    createdAt: new Date("2026-09-02T07:55:00.000Z"),
    updatedAt: new Date("2026-09-10T16:05:00.000Z"),
  },
  {
    id: "lead-014",
    name: "Lucas Martin",
    company: "Atlas Construction",
    email: "lucas.martin@atlasconstruction.com",
    stage: "Qualified",
    createdAt: new Date("2026-08-26T13:45:00.000Z"),
    updatedAt: new Date("2026-09-14T08:30:00.000Z"),
  },
  {
    id: "lead-015",
    name: "Grace Kim",
    company: "SignalForge",
    email: "grace.kim@signalforge.com",
    stage: "Qualified",
    createdAt: new Date("2026-08-20T10:15:00.000Z"),
    updatedAt: new Date("2026-09-03T09:05:00.000Z"),
  },
  {
    id: "lead-016",
    name: "Henry Walker",
    company: "Acme Logistics",
    email: "henry.walker@acmelogistics.com",
    stage: "Won",
    createdAt: new Date("2026-09-10T11:20:00.000Z"),
    updatedAt: new Date("2026-09-15T14:55:00.000Z"),
  },
  {
    id: "lead-017",
    name: "Zara Ibrahim",
    company: "Nimbus Retail",
    email: "zara.ibrahim@nimbusretail.com",
    stage: "Won",
    createdAt: new Date("2026-09-04T09:40:00.000Z"),
    updatedAt: new Date("2026-09-12T13:35:00.000Z"),
  },
  {
    id: "lead-018",
    name: "Benjamin Lee",
    company: "Redwood Systems",
    email: "benjamin.lee@redwoodsystems.com",
    stage: "Won",
    createdAt: new Date("2026-08-31T14:05:00.000Z"),
    updatedAt: new Date("2026-09-11T10:45:00.000Z"),
  },
  {
    id: "lead-019",
    name: "Chloe Dubois",
    company: "Mosaic Foods",
    email: "chloe.dubois@mosaicfoods.com",
    stage: "Won",
    createdAt: new Date("2026-08-24T16:35:00.000Z"),
    updatedAt: new Date("2026-09-13T11:15:00.000Z"),
  },
  {
    id: "lead-020",
    name: "Samuel Adeyemi",
    company: "Pioneer Telecom",
    email: "samuel.adeyemi@pioneertelecom.com",
    stage: "Won",
    createdAt: new Date("2026-08-18T08:25:00.000Z"),
    updatedAt: new Date("2026-09-01T15:20:00.000Z"),
  },
  {
    id: "lead-021",
    name: "Isabella Costa",
    company: "Acme Ventures",
    email: "isabella.costa@acmeventures.com",
    stage: "Lost",
    createdAt: new Date("2026-09-09T12:15:00.000Z"),
    updatedAt: new Date("2026-09-14T16:30:00.000Z"),
  },
  {
    id: "lead-022",
    name: "Jack Wilson",
    company: "Stonebridge Legal",
    email: "jack.wilson@stonebridgelegal.com",
    stage: "Lost",
    createdAt: new Date("2026-09-03T10:50:00.000Z"),
    updatedAt: new Date("2026-09-09T13:25:00.000Z"),
  },
  {
    id: "lead-023",
    name: "Mei Tan",
    company: "Evergreen Mobility",
    email: "mei.tan@evergreenmobility.com",
    stage: "Lost",
    createdAt: new Date("2026-08-29T07:40:00.000Z"),
    updatedAt: new Date("2026-09-12T08:15:00.000Z"),
  },
  {
    id: "lead-024",
    name: "Theo Papadopoulos",
    company: "Aster Labs",
    email: "theo.papadopoulos@asterlabs.com",
    stage: "Lost",
    createdAt: new Date("2026-08-23T15:10:00.000Z"),
    updatedAt: new Date("2026-09-06T17:00:00.000Z"),
  },
  {
    id: "lead-025",
    name: "Fatima Zahra",
    company: "Solstice Media",
    email: "fatima.zahra@solsticemedia.com",
    stage: "Lost",
    createdAt: new Date("2026-08-17T11:30:00.000Z"),
    updatedAt: new Date("2026-08-27T09:45:00.000Z"),
  },
];

type LeadChangeAction = "create" | "update" | "mark-stale";

interface LeadChangeLogEntry {
  readonly at: string;
  readonly action: LeadChangeAction;
  readonly ids: readonly string[];
}

interface SerializedLead {
  readonly id: string;
  readonly name: string;
  readonly company: string;
  readonly email: string;
  readonly stage: Stage;
  readonly isStale: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface LeadStore {
  leads: Lead[];
  changeLog: LeadChangeLogEntry[];
}

interface GlobalLeadTrackerState {
  __leadTrackerStore?: LeadStore;
}

const globalLeadState = globalThis as typeof globalThis &
  GlobalLeadTrackerState;

function createSeededLeads(): Lead[] {
  return seededLeads.map((lead) => ({
    ...lead,
    createdAt: new Date(lead.createdAt.getTime()),
    updatedAt: new Date(lead.updatedAt.getTime()),
    isStale: false,
  }));
}

function isTestRuntime(): boolean {
  return process.env.VITEST === "true" || process.env.NODE_ENV === "test";
}

function getPersistFilePath(): string | null {
  if (isTestRuntime() || process.env.VERCEL === "1") {
    return null;
  }

  return join(process.cwd(), ".data", "leads-store.json");
}

function parseStoredStage(value: unknown): Stage | null {
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

function reviveStoredLead(value: SerializedLead): Lead | null {
  const stage = parseStoredStage(value.stage);
  const createdAt = new Date(value.createdAt);
  const updatedAt = new Date(value.updatedAt);

  if (
    stage === null ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    typeof value.name !== "string" ||
    typeof value.company !== "string" ||
    typeof value.email !== "string" ||
    typeof value.isStale !== "boolean" ||
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(updatedAt.getTime()) ||
    updatedAt.getTime() < createdAt.getTime()
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    company: value.company,
    email: value.email,
    stage,
    isStale: value.isStale,
    createdAt,
    updatedAt,
  };
}

function readPersistedLeads(): Lead[] | null {
  const persistPath = getPersistFilePath();

  if (persistPath === null || !existsSync(persistPath)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(persistPath, "utf8"));

    if (!Array.isArray(parsed)) {
      return null;
    }

    const revivedLeads: Lead[] = [];

    for (const entry of parsed) {
      const lead = reviveStoredLead(entry as SerializedLead);

      if (lead === null) {
        return null;
      }

      revivedLeads.push(lead);
    }

    return revivedLeads.length > 0 ? revivedLeads : null;
  } catch {
    return null;
  }
}

function persistLeads(leads: readonly Lead[]): void {
  const persistPath = getPersistFilePath();

  if (persistPath === null) {
    return;
  }

  try {
    mkdirSync(dirname(persistPath), { recursive: true });
    writeFileSync(
      persistPath,
      JSON.stringify(
        leads.map(
          (lead): SerializedLead => ({
            id: lead.id,
            name: lead.name,
            company: lead.company,
            email: lead.email,
            stage: lead.stage,
            isStale: lead.isStale,
            createdAt: lead.createdAt.toISOString(),
            updatedAt: lead.updatedAt.toISOString(),
          }),
        ),
      ),
      "utf8",
    );
  } catch {
    // Local persistence is best-effort. A failed disk write must not
    // undo an in-memory save the UI already accepted.
  }
}

function getLeadStore(): LeadStore {
  const existingStore = globalLeadState.__leadTrackerStore;

  if (existingStore !== undefined) {
    return existingStore;
  }

  const store: LeadStore = {
    leads: readPersistedLeads() ?? createSeededLeads(),
    changeLog: [],
  };

  globalLeadState.__leadTrackerStore = store;

  return store;
}

function getMutableLeads(): Lead[] {
  return getLeadStore().leads;
}

function recordLeadChange(
  action: LeadChangeAction,
  ids: readonly string[],
): void {
  const store = getLeadStore();

  store.changeLog.unshift({
    at: new Date().toISOString(),
    action,
    ids: [...ids],
  });
  store.changeLog = store.changeLog.slice(0, 50);
  persistLeads(store.leads);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function cloneLead(lead: Lead): Lead {
  return {
    ...lead,
    createdAt: new Date(lead.createdAt.getTime()),
    updatedAt: new Date(lead.updatedAt.getTime()),
  };
}

function emailBelongsToAnotherLead(
  email: string,
  excludedLeadId?: string,
): boolean {
  const normalizedEmail = normalizeEmail(email);

  return getMutableLeads().some(
    (lead) =>
      lead.id !== excludedLeadId &&
      normalizeEmail(lead.email) === normalizedEmail,
  );
}

function simulateWriteFailure(): void {
  if (Math.random() < WRITE_FAILURE_RATE) {
    throw new Error(WRITE_FAILURE_MESSAGE);
  }
}

export async function getLeads({
  q,
  stage,
}: GetLeadsParams = {}): Promise<Lead[]> {
  await wait(READ_LATENCY_MS);

  const normalizedQuery = q?.trim().toLowerCase();

  return getMutableLeads()
    .filter((lead) => {
      const matchesQuery =
        normalizedQuery === undefined ||
        normalizedQuery.length === 0 ||
        lead.name.toLowerCase().includes(normalizedQuery) ||
        lead.company.toLowerCase().includes(normalizedQuery);
      const matchesStage = stage === undefined || lead.stage === stage;

      return matchesQuery && matchesStage;
    })
    .map(cloneLead);
}

export async function getLead(id: string): Promise<Lead | null> {
  const lead = getMutableLeads().find((candidate) => candidate.id === id);

  return lead === undefined ? null : cloneLead(lead);
}

export function findStaleLeads(
  leads: readonly Lead[],
  anchorDate: Date,
): Lead[] {
  const staleCutoffMs = anchorDate.getTime() - SEVEN_DAYS_MS;

  return leads
    .filter(
      (lead) =>
        !lead.isStale && lead.updatedAt.getTime() < staleCutoffMs,
    )
    .toSorted(
      (firstLead, secondLead) =>
        firstLead.updatedAt.getTime() - secondLead.updatedAt.getTime(),
    );
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const normalizedEmail = normalizeEmail(input.email);

  if (emailBelongsToAnotherLead(normalizedEmail)) {
    throw new DuplicateEmailError(normalizedEmail);
  }

  simulateWriteFailure();

  const timestamp = new Date();
  const lead: Lead = {
    id: randomUUID(),
    name: input.name.trim(),
    company: input.company.trim(),
    email: normalizedEmail,
    stage: input.stage,
    isStale: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  getMutableLeads().push(lead);
  recordLeadChange("create", [lead.id]);

  return cloneLead(lead);
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>,
): Promise<Lead> {
  const leadIndex = getMutableLeads().findIndex((lead) => lead.id === id);
  const currentLead = getMutableLeads()[leadIndex];

  if (leadIndex < 0 || currentLead === undefined) {
    throw new LeadNotFoundError(id);
  }

  const normalizedEmail =
    patch.email === undefined
      ? currentLead.email
      : normalizeEmail(patch.email);

  if (emailBelongsToAnotherLead(normalizedEmail, id)) {
    throw new DuplicateEmailError(normalizedEmail);
  }

  simulateWriteFailure();

  const updatedLead: Lead = {
    ...currentLead,
    ...patch,
    id: currentLead.id,
    name: patch.name?.trim() ?? currentLead.name,
    company: patch.company?.trim() ?? currentLead.company,
    email: normalizedEmail,
    createdAt: new Date(currentLead.createdAt.getTime()),
    updatedAt: new Date(),
  };

  getMutableLeads()[leadIndex] = updatedLead;
  recordLeadChange("update", [id]);

  return cloneLead(updatedLead);
}

export async function markLeadsStale(
  ids: readonly string[],
): Promise<Lead[]> {
  const uniqueIds = [...new Set(ids)];
  const targetIndexes: number[] = [];

  for (const id of uniqueIds) {
    const targetIndex = getMutableLeads().findIndex((lead) => lead.id === id);

    if (targetIndex < 0) {
      throw new LeadNotFoundError(id);
    }

    targetIndexes.push(targetIndex);
  }

  if (targetIndexes.length === 0) {
    return [];
  }

  simulateWriteFailure();

  const updatedAt = new Date();
  const pendingUpdates: { readonly index: number; readonly lead: Lead }[] = [];

  for (const targetIndex of targetIndexes) {
    const currentLead = getMutableLeads()[targetIndex];

    if (currentLead === undefined) {
      throw new Error("Stale batch target changed before it could be updated");
    }

    const updatedLead: Lead = {
      ...currentLead,
      isStale: true,
      updatedAt,
    };

    pendingUpdates.push({ index: targetIndex, lead: updatedLead });
  }

  for (const update of pendingUpdates) {
    getMutableLeads()[update.index] = update.lead;
  }

  recordLeadChange("mark-stale", uniqueIds);

  return pendingUpdates.map((update) => cloneLead(update.lead));
}
