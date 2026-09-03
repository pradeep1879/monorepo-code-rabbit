import React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import AppSideBar from "@/DashboardUI/dashboardui/AppSideBar";
import { TopNavbar } from "@/DashboardUI/dashboardui/TopNavbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="fixed inset-0 flex h-svh min-h-0 min-w-0 overflow-hidden">
      <AppSideBar />
      <SidebarInset className="relative h-full min-h-0 min-w-0 flex-1 basis-0 overflow-hidden">
        <TopNavbar />
        <main className="absolute inset-x-0 bottom-0 top-16 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
