"use client";

import { useSearchParams } from "next/navigation";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { ProfileContent } from "./_components/ProfileContent";

export default function ProfilePage() {
  const { uid: self, account } = useSocialAccount();
  const params = useSearchParams();
  const uid = params.get("userId") || self;
  return <ProfileContent key={account + ":" + uid} uid={/^\d+$/.test(uid) ? uid : ""} />;
}
