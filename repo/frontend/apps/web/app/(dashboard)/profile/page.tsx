import { Suspense } from "react";
import { SocialProfilePage } from "@/components/profile/SocialProfilePage";

export default function ProfilePage() {
  return (
    <Suspense>
      <SocialProfilePage />
    </Suspense>
  );
}
