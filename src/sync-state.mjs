export function syncState({
  online = true,
  lastSuccess = 0,
  error = "",
  now = Date.now(),
}) {
  if (!online) return "offline";
  if (error || (lastSuccess && now - lastSuccess > 15000)) return "stale";
  return lastSuccess ? "fresh" : "loading";
}
