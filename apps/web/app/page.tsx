import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";

import { prisma } from "@repo/db";
import { createUser } from "./actions/user";
import { requireAuth } from "@/lib/auth/require-auth";
import { redirect } from "next/navigation";


type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default async function Home() {

  await requireAuth()
  return (
    redirect("/dashboard")
  );
}
