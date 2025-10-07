import { Platform } from 'react-native';
import { queryUsageStats } from '@justdice/react-native-usage-stats';

function startOfThisWeekMonday(now = new Date()): Date {
  // JS getDay(): Sun=0, Mon=1, ..., Sat=6
  const d = new Date(now);
  const day = d.getDay();
  const diff = (day + 6) % 7; // 0 if Mon, 1 if Tue, ... 6 if Sun
  // normalize to midnight first (avoids DST weirdness when subtracting days)
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d; // local tz (e.g., Europe/Berlin on your device)
}

type AppUsage = {
  packageName: string;
  totalTimeInForeground?: number;
};

export type UsageStats = {
  from: Date;
  to: Date;
  entries: { packageName: string; ms: number }[];
  totalMs: number;
};

export async function getUsageSinceMonday(): Promise<UsageStats>{
  console.log("trying to get usage since monday")
  if (Platform.OS !== 'android') throw new Error('Android only');

  const end = Date.now();
  const monday0 = startOfThisWeekMonday().getTime();
  const dailyOrPackages: Record<string, AppUsage> | AppUsage[] = await queryUsageStats(0, monday0, end);

  let entries: { packageName: string; ms: number }[] = [];
  if (Array.isArray(dailyOrPackages)) {
    entries = dailyOrPackages.map((u: any) => ({
      packageName: u.packageName ?? 'unknown',
      ms: Number(u.totalTimeInForeground ?? 0),
    }));
  } else if (dailyOrPackages && typeof dailyOrPackages === 'object') {
    entries = Object.keys(dailyOrPackages).map((pkg) => ({
      packageName: pkg,
      ms: Number((dailyOrPackages as any)[pkg]?.totalTimeInForeground ?? 0),
    }));
  }

  const totalMs = entries.reduce((a, e) => a + e.ms, 0);
  console.log("got usage access ", totalMs)
  return { from: new Date(monday0), to: new Date(end), entries, totalMs };
}
