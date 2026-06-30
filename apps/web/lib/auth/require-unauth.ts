import { auth } from "@repo/auth/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation";

export const requireUnAuth = async () => {
  let session;

  try {
    session = await auth.api.getSession({
      headers: await headers()
    });
  } catch {
    return;
  }

  if(session){
    redirect("/");
  }
}