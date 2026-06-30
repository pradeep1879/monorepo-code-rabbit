"use server"
import { auth } from "@repo/auth/server"
import { prisma } from "@repo/db";
import { headers } from "next/headers"
import { Octokit } from "octokit"
import { ContributionCalendar, ContributionResponse } from "@repo/types"

export const getGithubAccesstoken = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account?.accessToken) {
    throw new Error(
      "No GitHub access token found"
    );
  }

  return account.accessToken;
};


export const getRepositories = async (page: number = 1, perPage: number = 10) => {
  const token = await getGithubAccesstoken();
  const octokit = new Octokit({
    auth: token
  });

  // get all repositories

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    direction: "desc",
    visibility: "all",
    per_page:  perPage,
    page: page,
  });

console.log("getRepositories data",data);
  return data
}


export const fetchUserContribution = async (
  token: string,
  username: string
): Promise<ContributionCalendar | null> => {
  const octokit = new Octokit({
    auth: token,
  });

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;
  try {
    const response =
      await octokit.graphql<ContributionResponse>(
        query,
        {
          username,
        }
      );

    return response.user.contributionsCollection.contributionCalendar;
  } catch (error) {
    console.error(
      "GitHub Contribution Fetch Error:",
      error
    );

    return null;
  }
};

export const createWebhook = async (owner: string, repo: string) => {
  try {
    const token = await getGithubAccesstoken();

    const octokit = new Octokit({
      auth: token,
    });
      console.log("BETTER_AUTH_URL =", process.env.BETTER_AUTH_URL);

      const webHookUrl = `${process.env.BETTER_AUTH_URL}/api/webhook/github`;

      console.log("Webhook URL =", webHookUrl);



    const { data } = await octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webHookUrl,
        content_type: "json",
      },
      events: ["pull_request"],
    });

    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};




export const deleteWebhook = async (owner:string, repo:string) =>{
 const token = await getGithubAccesstoken();
  const octokit = new Octokit({
    auth: token
  });

  const webHookUrl = `${process.env.BETTER_AUTH_URL}/api/webhook/github`

 try {
   const {data:hooks} = await octokit.rest.repos.listWebhooks({
    owner,
    repo
  })

  const hookToDelete = hooks.find(hook => hook.config.url === webHookUrl);
  if(hookToDelete){
    await octokit.rest.repos.deleteWebhook({
      owner,
      repo,
      hook_id: hookToDelete.id
    })
    return true
  }
 } catch {
  return false
 }
}