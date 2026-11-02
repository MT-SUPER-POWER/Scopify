"use client";

import { HomeGreeting } from "./_components/HomeGreeting";
import { useHome } from "../_components/HomeProvider";
import { QueryBoundary } from "@/components/shared/QueryBoundary";

export default function HomeGreetingSlot() {
  const { greeting } = useHome();
  return (
    <QueryBoundary resetKey="home:greeting" title={greeting} compact>
      <HomeGreeting />
    </QueryBoundary>
  );
}
