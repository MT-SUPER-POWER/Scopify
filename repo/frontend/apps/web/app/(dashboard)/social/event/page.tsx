"use client";

import { useSearchParams } from "next/navigation";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { SocialEventDetail } from "./_components/SocialEventDetail";

export default function Page() {
  const params = useSearchParams(),
    { account } = useSocialAccount();
  const target = { id: params.get("id") ?? "", uid: params.get("uid") ?? "" };
  return <SocialEventDetail key={account + ":" + target.id} target={target} />;
}
