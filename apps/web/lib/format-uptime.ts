export function formatUptime(launchTime: Date | string | undefined | null): string {
  if (!launchTime) return "0m";
  const launchDate = new Date(launchTime);
  const diffMs = Date.now() - launchDate.getTime();
  if (diffMs <= 0) return "0m";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes}m`);

  return parts.join(" ");
}
