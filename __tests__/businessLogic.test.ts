import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLead,
  DuplicateEmailError,
  findStaleLeads,
  getLeads,
  updateLead,
  type Lead,
} from "../lib/data";

const ANCHOR_DATE = new Date("2026-09-17T23:59:59.999Z");

describe("lead tracker business rules", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows the same name with a unique email and rejects a duplicate email", async () => {
    const createdLead = await createLead({
      name: "Maya Chen",
      company: "Northstar Advisory",
      email: "maya.chen.advisory@northstar.example",
      stage: "New",
    });

    expect(createdLead.name).toBe("Maya Chen");
    expect(createdLead.email).toBe(
      "maya.chen.advisory@northstar.example",
    );

    const updatedLead = await updateLead(createdLead.id, {
      company: "Northstar Advisory Group",
    });

    expect(updatedLead.company).toBe("Northstar Advisory Group");

    await expect(
      createLead({
        name: "Another Maya Chen",
        company: "Northstar Analytics",
        email: "maya.chen@northstaranalytics.com",
        stage: "Contacted",
      }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it("selects an eight-day-old lead as stale and ignores a two-day-old lead", () => {
    const testLeads: readonly Lead[] = [
      {
        id: "ghosted-lead",
        name: "Jordan Ellis",
        company: "Dormant Systems",
        email: "jordan.ellis@dormant.example",
        stage: "Qualified",
        isStale: false,
        createdAt: new Date("2026-09-01T12:00:00.000Z"),
        updatedAt: new Date("2026-09-09T23:59:59.999Z"),
      },
      {
        id: "active-lead",
        name: "Rina Shah",
        company: "Current Labs",
        email: "rina.shah@current.example",
        stage: "Contacted",
        isStale: false,
        createdAt: new Date("2026-09-10T12:00:00.000Z"),
        updatedAt: new Date("2026-09-15T23:59:59.999Z"),
      },
    ];

    const staleLeads = findStaleLeads(testLeads, ANCHOR_DATE);

    expect(staleLeads.map((lead) => lead.id)).toEqual(["ghosted-lead"]);
    expect(staleLeads).not.toContainEqual(
      expect.objectContaining({ id: "active-lead" }),
    );
  });

  it("applies the URL search and stage constraints together", async () => {
    const filteredLeads = await getLeads({
      q: "acme",
      stage: "Contacted",
    });

    expect(filteredLeads.map((lead) => lead.id)).toEqual(["lead-006"]);

    for (const lead of filteredLeads) {
      const searchableText = `${lead.name} ${lead.company}`.toLowerCase();

      expect(searchableText).toContain("acme");
      expect(lead.stage).toBe("Contacted");
    }
  });
});
