import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopNavbar() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-30 flex h-18
     items-center gap-2 border-b bg-background/95 px-4 backdrop-blur 
     supports-backdrop-filter:bg-background/80 md:left-(--sidebar-current-width)"
    >
      <SidebarTrigger className="-ml-1" />
    </header>
  );
}
