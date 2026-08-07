import type { DailyRecommendationRequest } from "@/types/playlist";

const DAILY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getDailyCacheDate(now: Date) {
  return now.toISOString().slice(0, 10);
}

/**
 * Produces the route date and the cache key for a daily-recommendation request.
 * A route without `dailyDate` represents today's recommendations.
 */
export function resolveDailyRecommendationRequest(
  requestedDailyDate: null | string,
  now = new Date(),
): DailyRecommendationRequest {
  const selectedDailyDate =
    requestedDailyDate && DAILY_DATE_PATTERN.test(requestedDailyDate) ? requestedDailyDate : null;
  const cacheDate = selectedDailyDate ?? getDailyCacheDate(now);

  return {
    cacheDate,
    dailyDate: selectedDailyDate,
  };
}
