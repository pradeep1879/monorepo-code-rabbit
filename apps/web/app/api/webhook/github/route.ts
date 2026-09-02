import { reviewPullRequest } from "@/module/ai/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Webhook working",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = req.headers.get("x-github-event");

    if (event === "ping") {
      return NextResponse.json({
        message: "pong",
      });
    }

    if (event === "pull_request") {
        const action = body.action;

        const repo =
          body.repository.full_name;

        const prNumber = body.number;

        const [owner, repoName] =
          repo.split("/");

        if (
          action === "opened" ||
          action === "synchronize"
        ) {
          await reviewPullRequest(
            owner,
            repoName,
            prNumber,
            body.pull_request?.title,
            body.pull_request?.html_url,
          );

          console.log(
            `Review queued for ${owner}/${repoName} #${prNumber}`
          );
        }
      }

    return NextResponse.json({
      message: "Event processed",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
