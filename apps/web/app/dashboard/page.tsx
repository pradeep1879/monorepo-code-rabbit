"use client";

import React from "react";

import { GitBranch, GitPullRequest, Activity, Sparkles } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, BarChart, CartesianGrid, YAxis, Legend, Bar } from "recharts";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";


import { Spinner } from "@/components/ui/spinner";
import { useDashboardStats, useMonthlyActivity } from "@/hooks/dashbordHooks/useDashboard";
import ContributionGraph from "@/module/dashboard/components/contributionGraph";


const MainPage = () => {
  const { data: stats, isLoading }  = useDashboardStats();
  console.log("Stats",stats)

  const { data: monthlyActivity, isLoading: isLoadingActivity} = useMonthlyActivity();

  const cards = [
    {
      title: "Repositories",
      value: stats?.totalRepo || 0,
      description: "Connected repositories",
      icon: GitBranch,
    },
    {
      title: "Pull Requests",
      value: stats?.totalPrs || 0,
      description: "Created pull requests",
      icon: GitPullRequest,
    },
    {
      title: "Code Reviews",
      value: stats?.totalReviews || 0,
      description: "Generated AI reviews",
      icon: Sparkles,
    },
    {
      title: "Commits",
      value: stats?.totalCommits || 0,
      description: "Total GitHub contributions",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        <p className="text-muted-foreground">
          Overview of your coding activity and AI reviews
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>

              <div className="rounded-xl bg-primary/10 p-2">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>

            <CardContent>
              {isLoading || isLoadingActivity ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold tracking-tight">
                    {card.value}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Activity Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
          </CardHeader>

          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-2xl border bg-muted/40 p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Month Activity
                    </p>

                    <h2 className="mt-1 text-4xl font-bold">
                      {monthlyActivity?.[monthlyActivity.length - 1]?.commits ||
                        0}
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-primary/10 p-4">
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="h-75 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyActivity}>
                      <defs>
                        <linearGradient
                          id="colorCommits"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="currentColor"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="currentColor"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <XAxis dataKey="name" tickLine={false} axisLine={false} />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="commits"
                        stroke="currentColor"
                        fillOpacity={1}
                        fill="url(#colorCommits)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Most Active Area</p>

              <h3 className="mt-2 font-semibold">Repository Reviews</h3>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">AI Suggestions</p>

              <h3 className="mt-2 font-semibold">Improving code quality</h3>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Performance</p>

              <h3 className="mt-2 font-semibold">Excellent consistency</h3>
            </div>
          </CardContent>
        </Card>
      </div>
        <ContributionGraph/>
        <div className="grid ga-4 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Monthly breakdown of commits, PRs, and reviews (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {
                isLoadingActivity ? (
                  <div className="h-80 w-full felx items-center justify-center">
                    <Spinner/>
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width={"100%"} height={"100%"}>
                      <BarChart data={monthlyActivity || []}>
                        <CartesianGrid/>
                        <XAxis dataKey="name"/>
                        <YAxis />
                        <Tooltip
                          contentStyle={{backgroundColor: 'var(--background)', borderColor: 'var(--border)'}}
                          itemStyle={{color: 'var(--foreground)'}}
                          />
                          <Legend/>
                          <Bar dataKey="commits" name="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                          <Bar dataKey="prs" name="Pull Requests" fill="#8b5cf6" radius={[4, 4, 0, 0]}/>
                          <Bar dataKey="reviews" name="AI Reveiws" fill="#10b981" radius={[4, 4, 0, 0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              }
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default MainPage;
