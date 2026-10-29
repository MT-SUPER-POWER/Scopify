import { Suspense } from "react";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";
import { SocialProfilePage } from "@/components/profile/SocialProfilePage";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <SocialProfilePage />
    </Suspense>
  );
}
