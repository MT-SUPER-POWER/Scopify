import { expect, test } from "bun:test";

import { getSubscribedRadioIds, isSubscribedRadio } from "@/hooks/radio/useRadioData";

test("keeps subscribed radio IDs usable after query-cache persistence", () => {
  const ids = getSubscribedRadioIds({
    code: 200,
    data: {
      djRadios: [
        { id: 1231333508, name: "Podcast" },
        { id: 456, name: "Another podcast" },
      ],
    },
  });
  const restoredIds = JSON.parse(JSON.stringify(ids)) as string[];

  expect(isSubscribedRadio(restoredIds, "1231333508")).toBeTrue();
  expect(isSubscribedRadio({}, "1231333508")).toBeFalse();
});
