const METRIC_SKELETON_IDS: readonly string[] = [
  "metric-new",
  "metric-contacted",
  "metric-qualified",
  "metric-won",
  "metric-lost",
  "metric-velocity",
];

const ROW_SKELETON_IDS: readonly string[] = [
  "row-one",
  "row-two",
  "row-three",
  "row-four",
  "row-five",
  "row-six",
  "row-seven",
];

export default function LeadsLoading(): React.ReactElement {
  return (
    <main
      aria-busy="true"
      aria-labelledby="leads-loading-title"
      className="min-h-screen bg-slate-50"
    >
      <div className="sr-only" role="status">
        <h1 id="leads-loading-title">Loading lead workspace</h1>
        <p>Preparing pipeline metrics and lead records.</p>
      </div>

      <div
        aria-hidden="true"
        className="mx-auto flex w-full max-w-[96rem] animate-pulse flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      >
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-28 rounded-full bg-slate-200" />
            <div className="h-10 w-64 max-w-full rounded-xl bg-slate-300" />
            <div className="h-4 w-96 max-w-full rounded-full bg-slate-200" />
          </div>
          <div className="flex gap-3">
            <div className="h-11 w-48 rounded-xl bg-slate-200" />
            <div className="h-11 w-28 rounded-xl bg-slate-300" />
          </div>
        </header>

        <section>
          <div className="mb-4 space-y-2">
            <div className="h-3 w-24 rounded-full bg-slate-200" />
            <div className="h-6 w-40 rounded-lg bg-slate-300" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {METRIC_SKELETON_IDS.map((id) => (
              <div
                key={id}
                className="h-32 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-3 w-20 rounded-full bg-slate-200" />
                <div className="mt-5 h-9 w-12 rounded-lg bg-slate-300" />
                <div className="mt-2 h-3 w-16 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 space-y-2">
            <div className="h-5 w-40 rounded-lg bg-slate-300" />
            <div className="h-3 w-72 max-w-full rounded-full bg-slate-200" />
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_8rem]">
            <div className="h-11 rounded-xl bg-slate-200" />
            <div className="h-11 rounded-xl bg-slate-200" />
            <div className="h-11 rounded-xl bg-slate-300" />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="h-6 w-36 rounded-lg bg-slate-300" />
            <div className="mt-2 h-3 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_1.4fr_1fr_0.8fr_4rem] gap-6 border-b border-slate-200 bg-slate-50 px-6 py-3">
              {["head-1", "head-2", "head-3", "head-4", "head-5", "head-6"].map(
                (id) => (
                  <div key={id} className="h-3 rounded-full bg-slate-200" />
                ),
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {ROW_SKELETON_IDS.map((id) => (
                <div
                  key={id}
                  className="grid min-w-[64rem] grid-cols-[1.2fr_1fr_1.4fr_1fr_0.8fr_4rem] items-center gap-6 px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-4 w-28 rounded-full bg-slate-300" />
                  </div>
                  <div className="h-4 w-32 rounded-full bg-slate-200" />
                  <div className="h-4 w-44 rounded-full bg-slate-200" />
                  <div className="h-8 w-32 rounded-full bg-slate-200" />
                  <div className="h-4 w-24 rounded-full bg-slate-200" />
                  <div className="h-8 w-12 rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
