import { Suspense } from "react";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";
import s from "@/components/social/Social.module.css";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <div className={s.page + " " + s.profilePage}>{children}</div>
    </Suspense>
  );
}
