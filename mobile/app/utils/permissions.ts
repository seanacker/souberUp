import {AppState} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import {checkForPermission} from '@justdice/react-native-usage-stats';

export function watchUsageAccess(onGranted: () => void) {
  let granted = false;
  const sub = AppState.addEventListener('change', async (s) => {
    if (s === 'active') {
      const ok = await checkForPermission();
      if (ok && !granted) { granted = true; onGranted(); }
    }
  });
  return () => sub.remove();
}

export async function ensureUsageAccess(): Promise<boolean> {
  const granted = await checkForPermission();
  if (granted) return true;

  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.USAGE_ACCESS_SETTINGS
  );

  return false;
}