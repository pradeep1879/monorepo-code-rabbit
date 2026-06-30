import { auth } from "@repo/auth/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation";

export const requireAuth = async () => {
  let session;

  try {
    session = await auth.api.getSession({
      headers: await headers()
    });
  } catch {
    redirect("/login");
  }

  if(!session){
    redirect("/login");
  }
}