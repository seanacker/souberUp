import {View, Text, ActivityIndicator, Button} from 'react-native';

import {UsageGoalCard} from './usage-goal-card/UsageGoalCard';
import {UsageProgressCard} from './usage-progress-card/UsageProgressCard';
import {useState, useEffect, useCallback} from 'react';
import {getUsageGoalQuery} from './api/getUsageGoal';
import {setUsageGoalMutation} from './api/setUsageGoal';
import {useGQLQuery, useGQLMutation} from './hooks/useGQLCLient';
import {getUsageSinceMonday} from './usage-progress-card/getUsageStats';
import {ensureUsageAccess, watchUsageAccess} from './utils/permissions';

export default function Index() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usageGoal, setUsageGoal] = useState(0);
  const [storedUsageGoal, setStoredUsageGoal] = useState(0);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const fetchUsageGoal = useGQLQuery<{data: {getUsageGoal: {usageGoal: number}}}>(getUsageGoalQuery);
  const saveUsageGoal = useGQLMutation<{data: {setUsageGoal: {success: boolean}}}>(setUsageGoalMutation);

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      const ok = await ensureUsageAccess();
      if (ok) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        unsubscribe = watchUsageAccess(() => setHasAccess(true));
      }
    })();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setStatus('loading');
    fetchUsageGoal()
      .then(response => {
        setUsageGoal(response.data.getUsageGoal.usageGoal);
        setStoredUsageGoal(response.data.getUsageGoal.usageGoal);
        setStatus('success');
      })
      .catch(error => {
        console.error(error);
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ok;
    const checkUsageAccess = async () => {
      ok = await ensureUsageAccess();
      if (!ok) {
        watchUsageAccess(async () => {
          getUsageSinceMonday().then(response => {
            setUsageStats(response);
          });
        });
      } else {
        getUsageSinceMonday().then(response => {
          setUsageStats(response);
        });
      }
    };
    checkUsageAccess();
  }, []);

  const handleSaveUsageGoal = useCallback(() => {
    setStatus('loading');
    saveUsageGoal(usageGoal.toString())
      .then(response => {
        if (response.data.setUsageGoal.success) {
          setStoredUsageGoal(usageGoal);
        }
        setStatus('success');
      })
      .catch(error => {
        console.error(error);
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usageGoal]);

  if (hasAccess === null) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={{flex: 1, padding: 24, gap: 12, justifyContent: 'center'}}>
        <Text style={{fontSize: 18, fontWeight: '600'}}>Enable “Usage access”</Text>
        <Text>Please enable “Usage access” for this app, then come back. We’ll continue automatically.</Text>
        <Button
          title='I enabled it — recheck'
          onPress={async () => {
            const ok = await ensureUsageAccess();
            if (ok) setHasAccess(true);
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: 10,
      }}
    >
      <UsageGoalCard
        usageGoal={usageGoal}
        setUsageGoal={setUsageGoal}
        onSaveUsageGoal={handleSaveUsageGoal}
      />
      <UsageProgressCard usageGoalInHours={storedUsageGoal} usageStats={usageStats}/>
    </View>
  );
}
