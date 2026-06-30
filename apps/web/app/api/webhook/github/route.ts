import { NextResponse, NextRequest } from "next/server";

export async function POST(req:NextRequest) {
  try {
    await req.json();
    const event = req.headers.get("x-github-event");

    if(event === "ping"){
      return NextResponse.json({message: "pong"}, {status: 200})
    }

    // TODO: handle later
    return NextResponse.json({message: "Event processes"}, {status:200});

  } catch (error) {
    console.log("Error while processing webhook", error)
  }
}