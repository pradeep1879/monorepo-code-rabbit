"use client";

import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  BookOpen,
  GitBranchIcon,
  LayoutDashboard,
  Settings,
  CreditCard,
  Star,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";

import { useTheme } from "next-themes";

import { signOut, useSession } from "@repo/auth/client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const AppSideBar = () => {
  const pathname = usePathname();

  const { data: session } = useSession();

  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);



  const user = session?.user;

  const userName = user?.name || "Loading...";
  const userEmail = user?.email || "";

  const userInitials =
    userName !== "Loading..."
      ? userName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";

  const navigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Repository",
      url: "/dashboard/repository",
      icon: GitBranchIcon,
    },
    {
      title: "Reviews",
      url: "/dashboard/reviews",
      icon: Star,
    },
    {
      title: "Subscription",
      url: "/dashboard/subscription",
      icon: CreditCard,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>

          <div className="flex flex-col">
            <span className="font-semibold">Code Review</span>
            <span className="text-xs text-muted-foreground">
              Dashboard Panel
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    className={`
                      h-12 rounded-xl transition-all duration-200
                      hover:bg-muted/70
                      data-[active=true]:bg-primary
                      data-[active=true]:text-primary-foreground
                      data-[active=true]:shadow-md
                    `}
                  >
                    <Link
                      href={item.url}
                      className="flex w-full items-center gap-3 px-2"
                    >
                      <div
                        className={`
                    flex h-9 w-9 items-center justify-center rounded-lg
                    bg-muted
                    transition-colors
                    ${
                      isActive(item.url)
                        ? "bg-primary-foreground/20"
                        : "group-hover:bg-background"
                    }
                  `}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {item.title === "Dashboard" && "Overview & analytics"}

                          {item.title === "Repository" && "Manage repositories"}

                          {item.title === "Reviews" && "Code review requests"}

                          {item.title === "Subscription" &&
                            "Billing & invoices"}

                          {item.title === "Settings" && "Preferences & profile"}
                        </span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border bg-muted/40 p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback className="font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userName}</p>

                <p className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )
              ) : (
                <div className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            className="h-11 w-full justify-start gap-3 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950"
            onClick={async () => {
              await signOut();
              redirect('/login')
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSideBar;
