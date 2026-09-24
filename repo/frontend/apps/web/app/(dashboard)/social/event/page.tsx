import { Suspense } from "react";
import { SocialEventPage } from "@/components/social/SocialEventPage";

export default function Page() {
  return (
    <Suspense>
      <SocialEventPage />
    </Suspense>
  );
}
