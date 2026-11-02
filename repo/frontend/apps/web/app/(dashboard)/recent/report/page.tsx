import { Suspense } from "react";
import { ListeningReportView } from "./_components/ListeningReportView";

export default function RecentListeningReportPage() {
  return (
    <Suspense>
      <ListeningReportView />
    </Suspense>
  );
}
