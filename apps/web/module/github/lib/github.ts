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


export const getRepoFileContents = async(
    token:string,
    owner:string,
    repo:string,
    path: string = ""
):Promise<{path:string, content:string}[]> => {
  const octokit = new Octokit({auth:token});
  const {data} = await octokit.rest.repos.getContent({
    owner,
    repo,
    path
  })


  if(!Array.isArray(data)){
    //It's a file
    if(data.type === "file" && data.content){
      return [{
        path: data.path,
        content: Buffer.from(data.content, "base64").toString("utf8")
      }]
    }

    return [];
  }

  let files: {path:string, content: string}[] = [];

  for(const item of data){
    if (item.type === "file") {

  // Skip unnecessary files FIRST
        if (
          item.path.match(
            /\.(png|jpg|jpeg|svg|gif|ico|pdf|zip|tar|gz|map|lock)$/i
          ) ||
          item.path.startsWith("dist/") ||
          item.path.includes("node_modules") ||
          item.path.includes(".next") ||
          item.path.includes("build/")
        ) {
          continue;
        }

        const { data: fileData } =
          await octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path,
          });

        if (
          !Array.isArray(fileData) &&
          fileData.type === "file" &&
          fileData.content
        ) {
          files.push({
            path: item.path,
            content: Buffer.from(
              fileData.content,
              "base64"
            ).toString("utf8"),
          });
        }
      }
    else if (item.type === "dir") {
      const subFiles = await getRepoFileContents(
        token,
        owner,
        repo,
        item.path
      );

      files = files.concat(subFiles);
    }
  }

  return files
}


export const getPullRequestDiff = async (
  token: string,
  owner: string,
  repo: string,
  prNumber: number
) => {
  const octokit = new Octokit({
    auth: token,
  });

  // Fetch PR metadata
  const { data: pr } =
    await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

  // Fetch diff
  const diffResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner,
        repo,
        pull_number: prNumber,

        headers: {
          accept:
            "application/vnd.github.v3.diff",
        },
      }
    );

  const diff = diffResponse.data as unknown as string;
    return {
        diff,
        title: pr.title,
        description: pr.body || "",
      };  
};


export const postReviewComment = async (
  token:string,
  owner:string,
  repo:string, 
  prNumber:number, 
  review:string
) => {
  const octokit = new Octokit({auth:token});

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `## AI Code Review\n\n${review}\n\n---\n*Powered by CodeRabbit`
  })
}