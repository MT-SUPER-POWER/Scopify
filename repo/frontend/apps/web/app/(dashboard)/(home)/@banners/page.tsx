"use client";

import { FeaturedActivitiesCarousel } from "./_components/FeaturedActivitiesCarousel";
import { QueryBoundary } from "@/components/shared/QueryBoundary";

export default function HomeBannersSlot() {
  return (
    <QueryBoundary resetKey="home:banners" compact>
      <FeaturedActivitiesCarousel />
    </QueryBoundary>
  );
}
