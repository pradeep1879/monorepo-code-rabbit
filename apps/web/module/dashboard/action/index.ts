"use server";

import {
  fetchUserContribution,
  getGithubAccesstoken,
} from "@/module/github/lib/github";
import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Octokit } from "octokit";
import { prisma } from "@repo/db";
import { backfillMissingReviewFindings } from "@/module/review/lib/persist-findings";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session");

  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const getContributionStats = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const token = await getGithubAccesstoken();

    const octokit = new Octokit({
      auth: token,
    });

    const { data: user } = await octokit.rest.users.getAuthenticated();

    const calendar = await fetchUserContribution(token, user.login);

    if (!calendar) {
      return [];
    }

    const contributions = calendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: Math.min(4, Math.floor(day.contributionCount / 3)),
      })),
    );

    return contributions;
  } catch (error) {
    console.error("Contribution Stats Error:", error);
  }
};

export const getDashboardStats = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    console.log(session, "session from get dashboard stats");
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    await backfillMissingReviewFindings(session.user.id);
    const token = await getGithubAccesstoken();
    const octokit = new Octokit({
      auth: token,
    });

    const { data: user } = await octokit.rest.users.getAuthenticated();

    const [
      calendar,
      prsResponse,
      totalRepo,
      totalReviews,
      totalFindings,
      resolvedFindings,
      severityGroups,
    ] = await Promise.all([
      fetchUserContribution(token, user.login),
      octokit.rest.search.issuesAndPullRequests({
        q: `author:${user.login} type:pr`,
        per_page: 1,
      }),
      prisma.repository.count({ where: { userId: session.user.id } }),
      prisma.review.count({
        where: { repository: { userId: session.user.id } },
      }),
      prisma.reviewFinding.count({
        where: { review: { repository: { userId: session.user.id } } },
      }),
      prisma.reviewFinding.count({
        where: {
          status: "resolved",
          review: { repository: { userId: session.user.id } },
        },
      }),
      prisma.reviewFinding.groupBy({
        by: ["severity"],
        where: { review: { repository: { userId: session.user.id } } },
        _count: { _all: true },
      }),
    ]);

    const totalCommits = calendar?.totalContributions || 0;

    const totalPrs = prsResponse.data.total_count || 0;

    const findingSeverities = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    } as Record<string, number>;
    severityGroups.forEach((group) => {
      findingSeverities[group.severity] = group._count._all;
    });

    return {
      totalCommits,
      totalPrs,
      totalReviews,
      totalRepo,
      totalFindings,
      resolvedFindings,
      findingSeverities,
    };
  } catch (error) {
    console.error("Dashbord Stats Error:", error);

    return {
      totalCommits: 0,
      totalPrs: 0,
      totalReviews: 0,
      totalRepo: 0,
      totalFindings: 0,
      resolvedFindings: 0,
      findingSeverities: {},
    };
  }
};

export const getMonthlyActivity = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const token = await getGithubAccesstoken();

    const octokit = new Octokit({
      auth: token,
    });

    const { data: user } = await octokit.rest.users.getAuthenticated();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyData: Record<
      string,
      {
        commits: number;
        prs: number;
        reviews: number;
      }
    > = {};

    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const monthKey = monthNames[date.getMonth()]!;

      monthlyData[monthKey] = {
        commits: 0,
        prs: 0,
        reviews: 0,
      };
    }

    const sixMonthsAgo = new Date();

    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [calendar, prsResponse] = await Promise.all([
      fetchUserContribution(token, user.login),

      octokit.rest.search.issuesAndPullRequests({
        q: `author:${user.login} type:pr created:>${
          sixMonthsAgo.toISOString().split("T")[0]
        }`,
        per_page: 100,
      }),
    ]);

    if (!calendar) {
      return [];
    }

    // commits
    calendar.weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        const date = new Date(day.date);

        const monthKey = monthNames[date.getMonth()]!;

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].commits += day.contributionCount;
        }
      });
    });

    const reviews = await prisma.review.findMany({
      where: {
        repository: { userId: session.user.id },
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true },
    });
    reviews.forEach((review) => {
      const monthKey = monthNames[review.createdAt.getMonth()]!;
      if (monthlyData[monthKey]) monthlyData[monthKey].reviews += 1;
    });

    // PRs
    prsResponse.data.items.forEach((pr: { created_at: string }) => {
      const date = new Date(pr.created_at);

      const monthKey = monthNames[date.getMonth()]!;

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].prs += 1;
      }
    });

    return Object.keys(monthlyData).map((name) => ({
      name,
      ...monthlyData[name],
    }));
  } catch (error) {
    console.error("Monthly Activity Error:", error);

    return [];
  }
};
