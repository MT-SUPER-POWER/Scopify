import { Suspense } from "react";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";
import { cn } from "@/lib/utils";
import { socialPageClass, socialProfilePageClass } from "@/components/social/socialClasses";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <div className={cn(socialPageClass, socialProfilePageClass)}>{children}</div>
    </Suspense>
  );
}
