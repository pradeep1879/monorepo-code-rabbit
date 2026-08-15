export function SubscriptionLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="h-40 animate-pulse rounded-2xl bg-muted" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-125 animate-pulse rounded-2xl bg-muted" />
        <div className="h-125 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
