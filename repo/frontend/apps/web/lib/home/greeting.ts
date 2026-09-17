export function getHomeGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 5 || hour >= 22) return "home.greeting.night";
  if (hour < 10) return "home.greeting.morning";
  if (hour < 17) return "home.greeting.afternoon";
  return "home.greeting.evening";
}
