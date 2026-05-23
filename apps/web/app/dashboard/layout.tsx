import React from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

import { Separator } from '@/components/ui/separator';
import AppSideBar from '@/features/dashboardui/AppSideBar';
import { requireAuth } from '@/lib/auth/require-auth';


const DashboardLayout = async ({children}: {children: React.ReactNode}) => {
  await requireAuth();
  return (
    <SidebarProvider>
      <AppSideBar/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1"/>
          <Separator orientation="vertical" className="mx-2 h-4"/>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardLayout
