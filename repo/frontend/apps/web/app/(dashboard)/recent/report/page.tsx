import { Suspense } from "react";
import { ListeningReportView } from "@/components/listeningReport/ListeningReportView";

export default function RecentListeningReportPage() {
  return (
    <Suspense>
      <ListeningReportView />
    </Suspense>
  );
}
