# Lead Tracker

Lead Tracker is a deliberately narrow CRM workspace for managing the smallest
useful unit of a sales system: one contact, one company, and one current
commercial outcome. I built it as a complete vertical slice rather than a
collection of disconnected demonstrations. Search, pipeline movement,
validation, summary intelligence, failure recovery, and stale-account review
all operate against the same server-owned source of truth.

The application uses Next.js 14 App Router, React 18, strict TypeScript, and
Tailwind CSS. Its data layer is intentionally in-process, as required by the
assignment: 25 realistic leads are distributed evenly across New, Contacted,
Qualified, Won, and Lost, with deterministic date states, visible artificial
latency, and deliberately unreliable writes.

## System intent

I optimized the architecture around three invariants:

1. **The URL is the filter receipt.** Search and stage state survive refresh,
   sharing, and a new browser tab.
2. **The server is authoritative.** Initial lead content is rendered into HTML,
   validation executes again beyond the browser, and failed mutations never
   become accepted visual truth.
3. **Failure is part of the product.** Loading, empty, validation, write, and
   route-level error states are designed surfaces rather than afterthoughts.

There is no authentication layer, external database, background worker, or
record deletion. Those omissions are intentional scope boundaries.

## Technology

- **Next.js 14 App Router** — server components, URL orchestration, server
  actions, route loading, and error boundaries
- **React 18** — interactive form state, transitions, and a typed optimistic
  reducer compatible with the pinned runtime
- **TypeScript** — strict domain contracts with no `any` or `@ts-ignore`
- **Tailwind CSS** — all layout, spacing, state, focus, and responsive styling
- **Vitest** — deterministic verification of the three protected business rules

## Setup

### Prerequisites

- Node.js 20 or a current compatible LTS release
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the [Live Lead Tracker Workspace](https://lead-tracker-assignment.vercel.app/). The root route redirects to `/leads`.

### Quality gates

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Development Workflow & Repository Architecture

### Atomic Commit Strategy

To demonstrate engineering progression and maintain strict code rollback points, the repository explicitly rejects giant, single-end-state commits. The workspace follows an intentional, multi-phase atomic version control roadmap, logging distinct structural saves as each backend and layout boundary is completed.

I separated framework initialization, the typed data engine, server actions,
global routing, metrics, interactive records, forms, stale-account handling,
dashboard composition, failure surfaces, tests, and documentation into
independently reviewable phases. The purpose is not to maximize commit count;
it is to make each structural decision inspectable and reversible.

### Why I used a direct folder workspace

I began from a clean folder and introduced only the files the application
actually needed. This avoided optional template assets, duplicate abstractions,
sample components, and dead generated styles that often survive large default
scaffolds.

I did not remove legitimate framework infrastructure in the name of
minimalism. Next.js type declarations, strict compiler settings, Tailwind's CSS
entry, PostCSS configuration, package metadata, and ignore rules remain because
they each have a concrete build responsibility. The result is a lean project,
not an artificially incomplete one.

### Operator Review Discipline

I treated emotional neutrality as part of the engineering workflow. When an AI
response became verbose, repetitive, or personally framed, I did not spend
time arguing with the model or reacting to its tone. I extracted any useful
technical signal, ignored the surrounding blabber, and issued the next precise
command. This was a deliberate psychological discipline: it protected the
deadline, reduced conversational noise, and kept decisions anchored to the
specification rather than to the temperament of a generated response.

I also used trigger-based adaptation. Once I observed a recurring failure
signal—such as invented scope, a version-inaccurate API, or movement toward a
default scaffold—I did not repeat the same prompt conditions and expect a
different result. I identified the trigger, changed the structure of my next
instruction, and added an explicit boundary that prevented recurrence. In
practice, each AI mistake became a durable improvement to my prompting method,
not an invitation to retry the same approach.

## App Structure & System Mapping

```text
Lead Tracker/
├── app/
│   ├── globals.css                  # Tailwind's directive-only CSS entry
│   ├── layout.tsx                   # Server-rendered HTML shell and metadata
│   ├── page.tsx                     # Server redirect from / to /leads
│   └── leads/
│       ├── actions.ts               # Create, edit, stage, and stale server actions
│       ├── error.tsx                # Route-level data/render recovery boundary
│       ├── loading.tsx              # Dashboard-shaped loading skeleton
│       └── page.tsx                 # Server orchestration and URL filtering
├── components/
│   ├── LeadFormModal.tsx            # Adaptive Add/Edit form and field errors
│   ├── LeadTable.tsx                # Interactive rows and honest stage rollback
│   ├── StaleScannerModal.tsx        # Exact-list bulk confirmation workflow
│   └── SummaryBar.tsx               # Server metrics and URL stage shortcuts
├── lib/
│   └── data.ts                      # Typed in-process store and mock API
├── __tests__/
│   └── businessLogic.test.ts        # Three protected business signals
├── .eslintrc.json                   # Next.js Core Web Vitals lint policy
├── .gitignore                       # Build, environment, and private-note exclusions
├── next-env.d.ts                    # Generated Next.js TypeScript declarations
├── next.config.mjs                  # Minimal strict runtime configuration
├── package.json                     # Scripts and pinned dependencies
├── postcss.config.js                # Tailwind/PostCSS processing
├── tailwind.config.js               # App and component content scanning
├── tsconfig.json                    # Strict TypeScript policy
└── README.md                        # Public hand-in and engineering narrative

Local only:
└── INTERVIEW_PREP_NOTES.md          # Ignored walkthrough and code-defense manual
```

### Boundary map

```text
Browser HTML + Tailwind interface
        │
        ├── URL q/stage receipt
        └── FormData / stage / ID payload
        ▼
Next.js server components and server actions
        │
        ├── Runtime validation
        └── Strict TypeScript contracts
        ▼
lib/data.ts in-process source of truth
        │
        ├── 300 ms read latency
        └── 10% intentional write failure
        ▼
Server-rendered HTML or structured action result
        ▼
Confirmed UI state or explicit local rollback
```

`app/leads/page.tsx` performs filtered and global reads concurrently. Filtered
records feed the directory, while the complete collection feeds stable
pipeline metrics and the global stale scanner. This prevents a selected stage
from making every other metric appear to be zero.

## Product & UX Decisions

| Decision | System rationale |
| --- | --- |
| GET-based `q` and `stage` filters | A pasted `/leads?q=acme&stage=contacted` URL reproduces the same server-rendered view. |
| Summary cards implemented as Links | Stage shortcuts preserve an existing search query instead of creating local state. |
| Native stage dropdown | Five non-linear outcomes remain compact, keyboard-accessible, and reliable inside a dense table. |
| Confirmed and displayed stage states | Optimistic interaction remains fast without allowing a rejected write to become a visual lie. |
| One adaptive Add/Edit modal | Form behavior, validation rendering, and visual language cannot drift between two duplicated interfaces. |
| Field-specific server errors | Duplicate email is explained under Email instead of being reduced to a generic failure. |
| Dedicated stale-review modal | A bulk mutation exposes every affected person and company before the write. |
| Stale as an independent tag | Follow-up health does not corrupt the commercial pipeline stage. |
| UTC date presentation | Server and hydrated client output remain deterministic across reviewer machines. |

## Data Integrity & Edge-Case Analysis (Discovered Gaps)

### Normalized email uniqueness

The specification correctly states that no two leads may share an email
address, but ordinary string equality leaves a subtle production vulnerability.
`sarah@acme.com` and `Sarah@acme.com ` contain different raw characters despite
representing the same destination. A straightforward array lookup would admit
both and create duplicate ownership, duplicated outreach, and unreliable CRM
identity.

I therefore normalize email on the server before comparison and persistence:

```ts
email.trim().toLowerCase()
```

The form still displays a precise field-level error, while the data layer
enforces the actual invariant during both create and edit. In a permanent
corporate datastore, I would additionally place a unique index on the
normalized email column. Application validation provides humane feedback; the
database constraint protects integrity under concurrency.

### The chronological rule

Every lead obeys `updatedAt >= createdAt`. This is a small but fundamental audit
invariant: a record cannot be updated before it exists. I applied it across the
seed matrix so the seven-day metrics remain mathematically credible under
review.

### Two clocks, two business questions

- `createdAt` asks when an opportunity entered the system. It drives the
  “Added in Last 7 Days” acquisition metric and never changes.
- `updatedAt` asks when the record last changed. It drives stale-account
  detection and advances after a successful edit, stage change, or stale
  acknowledgement.

Conflating these timestamps would make routine sales activity look like new
lead acquisition or make active records appear neglected.

### Atomic stale batches

The stale operation validates every target ID and performs the simulated
failure check before mutating the first record. It prepares the complete batch,
then commits it synchronously. This avoids the partial-success state produced
by naively calling a fragile single-record update in a loop.

## Resilience model

### Honest optimistic updates

React 18 does not expose the stable React 19 `useOptimistic` API. I used a typed
reducer with equivalent semantics:

- `confirmedStage` stores the last server-approved value;
- `displayedStage` advances immediately;
- one row is locked while its write is pending;
- success advances both values;
- rejection restores the confirmed value and renders an inline alert.

The 10% timeout is evaluated before data mutation, so rollback always has a
coherent server truth.

### Deliberate error ownership

- Form validation and create/edit failures remain in the modal.
- Stage failures remain in the row that must roll back.
- Stale-batch failures retain the exact confirmation list.
- `app/leads/error.tsx` handles route render or data-read failures and retries
  the segment through Next.js `reset()`.

This avoids the common mistake of sending every error to one generic page and
discarding the context required for recovery.

## Tests

`__tests__/businessLogic.test.ts` protects exactly three high-signal rules:

1. Two people may share a name, while a duplicate email throws
   `DuplicateEmailError`.
2. An eight-day inactive lead is selected as stale, while a two-day lead is
   ignored.
3. `{ q: "acme", stage: "Contacted" }` returns only records satisfying both
   constraints.

The suite fixes `Math.random()` above the failure threshold during deterministic
business tests. This does not weaken production behavior; it prevents the
intentional infrastructure simulation from making unrelated integrity tests
flaky.

## AI Notes & Multi-Chat Steering Matrix

### Tools and operational separation

- **Cursor Pro — primary command studio.** I used Cursor to maintain the live
  design brief, edit the physical workspace, inspect cross-file contracts, and
  keep implementation decisions synchronized with the assignment.
- **Claude Opus 5 High — architectural reasoning lane.** I used this model for
  deep framework-boundary analysis, strict TypeScript review, validation flows,
  and specification decomposition.
- **GPT-5.6 Sol Medium — focused execution lane.** I used this model for
  high-speed implementation, multi-file synchronization, and static review
  while preserving the same locked constraints.
- **Google Gemini — secondary conceptual sandbox.** I separated exploratory
  learning from implementation. Gemini helped me reason through unfamiliar
  Next.js concepts before I translated that understanding into concise,
  testable commands in Cursor.

This was not model-switching for novelty. I decoupled conceptual exploration
from the primary execution thread so conversational experimentation did not
dilute the command history used for implementation and review.

### Pattern A — High-Density Direct Commands

> Map this assignment screenshot line by line. Preserve my wording, separate
> your counters, update the living design brief, and do not create project
> files until I explicitly authorize the build.

I removed conversational filler and consistently supplied four things: source
requirement, expected behavior, prohibited shortcut, and authorization scope.
The resulting exchanges were shorter, easier to audit, and less likely to let
the model substitute generic scaffolding for the actual specification.

### Pattern B — Proactive Structural Boxing

> Analyze the `/leads` URL-routing flow before generating files. Treat
> client-only `useState` or `useEffect` filtering as a designated evaluation
> trap. Use server-side `searchParams` as the canonical source of truth, make
> copied URLs reproduce the same filtered HTML, and explain how server
> validation protects required fields and normalized email uniqueness. Do not
> build until you have identified what breaks if either rule changes.

I moved architectural review ahead of generation. Rather than waiting for
client-only filtering, browser-only validation, or silent failure handling to
appear and then patching it, I constrained those failure modes before files
existed. I repeatedly asked the AI to produce counters separately, reviewed
them, accepted the valid ones, and folded them back into the design.

That process uncovered details easy to miss in a working demo:

- stage Links must preserve `q`;
- the five pipeline stages are selectable non-linearly;
- Stale is a tag rather than a sixth stage;
- `createdAt` and `updatedAt` serve different metrics;
- `updatedAt` cannot precede `createdAt`;
- normalized email comparison belongs in the server data boundary;
- expected write failures need local recovery rather than a generic error page.

### Concrete AI correction

The early generated design retained “move to the next stage” as a locked
sequential transition. Once I reconciled that interpretation with the detailed
R3 control requirement, I directed the AI to replace it with an unlocked
five-stage dropdown. I retained the correction in the decision history rather
than silently presenting the final interpretation as inevitable.

I also rejected version-inaccurate guidance that described `searchParams` as an
asynchronous prop under Next.js 14. The page itself is asynchronous because it
awaits data; its Next.js 14 `searchParams` prop is synchronous. Separating those
facts prevented a fashionable newer-version pattern from weakening type
accuracy.

### Generated output I deleted or rewrote

I did not preserve generated output merely because it compiled. I reviewed each
piece against the locked runtime, data invariants, and ownership boundaries,
then made the following corrections:

1. **I deleted a redundant styling layer.** The initial output placed custom
   base rules in `app/globals.css`, creating a second source of visual behavior
   beside Tailwind. I reduced that file to Tailwind's three directives and
   moved visible defaults into `app/layout.tsx`. This made styling ownership
   explicit and removed hidden CSS drift.
2. **I rewrote version-inaccurate React state logic.** Early instructions
   assumed React 19-only `useOptimistic` and `useActionState` APIs despite the
   project being pinned to React 18. I recognized the mismatch before treating
   the generated pattern as valid and replaced it with typed `useReducer`,
   `useTransition`, and controlled form state. The user experience remained
   optimistic while the implementation became truthful to the installed
   runtime.
3. **I rewrote duplicated stale-account logic.** The first modal design
   calculated stale leads inside the client component. I moved that formula
   into the shared `findStaleLeads` business function and made the server page
   pass the exact result into the modal. The interface and test suite now use
   one rule instead of two formulas that could silently diverge.
4. **I rewrote date cloning at the data boundary.** I replaced direct
   `Date`-object reuse with explicit `.getTime()` reconstruction. This prevents
   returned records from leaking mutable references back into the in-process
   store and makes the defensive copy unambiguous under strict TypeScript.
5. **I deleted deployment output that concealed the real application.** During
   release verification, a catch-all `vercel.json` rewrite produced a
   superficially “Ready” deployment with no usable Next.js routes. I inspected
   the deployment evidence, removed that rewrite, restored the missing package
   manifest, selected the Next.js framework preset, and cleared the incorrect
   `public` output directory. I then rebuilt, tested, and redeployed instead of
   describing the 404 as an unexplained hosting problem.

This review trail shows the sequence I followed: observe the concrete failure,
locate the violated system boundary, delete or rewrite the responsible output,
and verify the correction through compilation, tests, or the production
deployment itself.

## Trade-offs and cut corners

- The data store is process-local and resets when the server restarts. This is
  the specified mock architecture, not durable persistence.
- The 300 ms delay is intentionally synthetic and exists to expose loading UX.
- Random write failure demonstrates resilience but is not a substitute for
  deterministic integration tests of each failure surface.
- Authentication, ownership, deletion, and background automation are excluded
  by scope.
- A native stage select prioritizes accessibility and reliability over a
  bespoke listbox implementation within the assignment timebox.

## What I would do next with more time

For a production system serving paid corporate teams, I would:

- replace process memory with a transactional persistent datastore;
- enforce a unique index on normalized email;
- add database transactions and idempotency keys to bulk operations;
- introduce authentication, organization boundaries, and role-based access;
- record immutable audit events for identity and stage changes;
- add deterministic integration coverage for each failure path;
- instrument latency, rejected writes, retries, and optimistic rollback rates;
- validate modal focus containment and keyboard behavior with browser-level
  accessibility tests;
- deploy the application and add the live production URL to this document.
