import { auth } from "@repo/auth/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if(!session){
    redirect("/login");
  }
}