"use client";

import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { SocialStream } from "./_components/SocialStream";

export default function Page() {
  const { account } = useSocialAccount();
  return <SocialStream key={account} />;
}
