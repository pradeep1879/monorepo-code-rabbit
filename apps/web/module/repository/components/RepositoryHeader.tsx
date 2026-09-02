import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function RepositoryHeader({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <header className="flex flex-col gap-5 border-b pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage and view all your GitHub repositories
        </p>
      </div>
      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search repositories..."
          className="h-10 pl-9 pr-12"
          aria-label="Search repositories"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
    </header>
  );
}
