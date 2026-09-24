import { Suspense } from "react";
import { SocialPage } from "@/components/social/SocialPage";

export default function Page() {
  return (
    <Suspense>
      <SocialPage />
    </Suspense>
  );
}
