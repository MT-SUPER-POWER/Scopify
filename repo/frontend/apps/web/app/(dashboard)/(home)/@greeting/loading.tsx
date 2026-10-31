"use client";

import { useHome } from "../_components/HomeProvider";
import { HomeSectionPending } from "../_components/HomeSectionPending";

export default function Loading() {
  const { greeting } = useHome();
  return <HomeSectionPending kind="greeting" title={greeting} />;
}
