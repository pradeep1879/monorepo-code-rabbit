import React from "react";
import { AppShell } from "@/DashboardUI/dashboardui/AppShell";
import { requireAuth } from "@/lib/auth/require-auth";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth();
  return <AppShell>{children}</AppShell>;
};

export default DashboardLayout;
