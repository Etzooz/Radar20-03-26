/** NYSE market hours detection + formatting */

export function isNYSEOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  return minutes >= 570 && minutes < 960; // 9:30 AM – 4:00 PM ET
}

export function getTimeUntilOpen(): string {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const minutes = et.getHours() * 60 + et.getMinutes();

  let minsUntil: number;
  if (day === 6) {
    minsUntil = (2 * 24 * 60) - minutes + 570; // Monday 9:30
  } else if (day === 0) {
    minsUntil = (1 * 24 * 60) - minutes + 570;
  } else if (minutes >= 960) {
    // After close, next day 9:30
    minsUntil = (24 * 60) - minutes + 570;
    if (day === 5) minsUntil += 2 * 24 * 60; // Friday → Monday
  } else if (minutes < 570) {
    minsUntil = 570 - minutes;
  } else {
    return "Open now";
  }

  const h = Math.floor(minsUntil / 60);
  const m = minsUntil % 60;
  return `${h}h ${m}m`;
}

/** Assets affected by NYSE hours */
export function isMarketHoursAsset(variant: string): boolean {
  return variant === "sp500";
}
