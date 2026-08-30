import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { resolveBannerDestination } from "@/lib/home/resolveBannerDestination";

const carouselSource = readFileSync(
  fileURLToPath(new URL("../components/home/FeaturedActivitiesCarousel.tsx", import.meta.url)),
  "utf8",
);
const bannerCardSource = readFileSync(
  fileURLToPath(new URL("../components/home/ActivityBannerCard.tsx", import.meta.url)),
  "utf8",
);

test("maps an Orpheus album banner to the local album page", () => {
  expect(
    resolveBannerDestination({
      targetId: 388961122,
      targetType: 10,
      url: "orpheus://album/388961122",
    }),
  ).toEqual({ href: "/album?id=388961122", isExternal: false });
});

test("maps an Orpheus song banner to the local song detail page", () => {
  expect(
    resolveBannerDestination({
      targetId: 3412293326,
      targetType: 1,
      url: "orpheus://song/3412293326",
    }),
  ).toEqual({ href: "/comment?SongId=3412293326", isExternal: false });
});

test("keeps an activity banner as an external link", () => {
  expect(
    resolveBannerDestination({
      targetId: 0,
      targetType: 3000,
      url: "https://y.music.163.com/g/yida/act/daben?page=example",
    }),
  ).toEqual({
    href: "https://y.music.163.com/g/yida/act/daben?page=example",
    isExternal: true,
  });
});

test("Featured Activities carousel presents center card prominently with focal scale and side navigation", () => {
  expect(carouselSource).toContain("isCenter");
  expect(carouselSource).toContain("var(--banner-width)");
  expect(carouselSource).toContain("scale-[1.05]");
  expect(carouselSource).toContain(
    "onClickSide={isLeft ? goToPrevious : isRight ? goToNext : undefined}",
  );
  expect(bannerCardSource).toContain("aspect-[2.4/1]");
  expect(bannerCardSource).toContain("onClickSide");
});
