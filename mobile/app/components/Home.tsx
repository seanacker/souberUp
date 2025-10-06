import { useState, useEffect, useCallback } from "react";
import { View, ActivityIndicator, Button, Text } from "react-native";
import { getMe } from "../api/queries/getMe";
import { UPSERT_USER_MUTATION } from "../api/mutations/upsertUser";
import { UsageGoalCard } from "../usage-goal-card/UsageGoalCard";
import { UsageProgressCard } from "../usage-progress-card/UsageProgressCard";
import { ensureUsageAccess, watchUsageAccess } from "../utils/permissions";
import { useGql } from "../hooks/useGql";
import { getUsageSinceMonday } from "../usage-progress-card/getUsageStats";
import { useAuth } from "../auth/AuthContext";

export const Home = () => {
  const {signOut} = useAuth()
  const {call} = useGql();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usageGoalMinutes, setUsageGoalMinutes] = useState(0);
  const [storedUsageGoalMinutes, setStoredUsageGoalMinutes] = useState(0);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
    call<{me: {id: string, name: string, usageGoalMinutes: number}}>(getMe)
      .then(response => {
        console.log("got response", response)
        setStoredUsageGoalMinutes(response.me.usageGoalMinutes);
        
        setUsageGoalMinutes(response.me.usageGoalMinutes)
        console.log("set usage goal to", usageGoalMinutes)
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

  
  const onLogout = async () => {
      await signOut();
  };

  const handleSaveUsageGoal = useCallback(() => {
    setStatus('loading');
    call<{updateUser: {usageGoalMinutes: number}}>(UPSERT_USER_MUTATION, {data: {usageGoalMinutes}})
      .then(response => {
        if (response.updateUser.usageGoalMinutes) {
          setStoredUsageGoalMinutes(response.updateUser.usageGoalMinutes);
        }
        setStatus('success');
      })
      .catch(error => {
        console.error(error);
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usageGoalMinutes]);

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
      <Text>Home</Text>
      <Button title="logout" onPress={onLogout}/>
      <UsageGoalCard
        usageGoalMinutes={usageGoalMinutes}
        setUsageGoalMinutes={setUsageGoalMinutes}
        onSaveUsageGoal={handleSaveUsageGoal}
      />
      <UsageProgressCard usageGoalMinutes={storedUsageGoalMinutes} usageStats={usageStats}/>
    </View>
  );
}