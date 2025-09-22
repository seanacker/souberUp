import { View } from "react-native";

import {UsageGoalCard} from "./usage-goal-card/UsageGoalCard";
import { UsageProgressCard } from "./usage-progress-card/UsageProgressCard";
import { useState, useEffect, useCallback } from "react";
import { getUsageGoalQuery } from "./api/getUsageGoal";
import { setUsageGoalMutation } from "./api/setUsageGoal";
import { useGQLQuery, useGQLMutation } from "./hooks/useGQLCLient";

export default function Index() {
  const [usageGoal, setUsageGoal] = useState(0);
  const [storedUsageGoal, setStoredUsageGoal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const fetchUsageGoal = useGQLQuery<{data: {getUsageGoal: {usageGoal: number}}}>(getUsageGoalQuery);
  const saveUsageGoal = useGQLMutation<{data: {setUsageGoal: {success: boolean}}}>(setUsageGoalMutation);


  useEffect(() => {
    setStatus('loading');
    fetchUsageGoal().then((response) => {
      console.log("response", response.data.getUsageGoal.usageGoal);
      setUsageGoal(response.data.getUsageGoal.usageGoal);
      setStoredUsageGoal(response.data.getUsageGoal.usageGoal);
      setStatus('success');
    }).catch((error) => {
      console.error(error);
      setStatus('error');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveUsageGoal = useCallback(() => {
    setStatus('loading');
    saveUsageGoal(usageGoal.toString()).then((response) => {
      if(response.data.setUsageGoal.success) {
        console.log("success", response.data.setUsageGoal.success, usageGoal);
        setStoredUsageGoal(usageGoal);
      }
      setStatus('success');
    }).catch((error) => {
      console.error(error);
      setStatus('error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usageGoal])

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: '100%',
        padding: 10,
      }}
    >
        <UsageGoalCard usageGoal={usageGoal} setUsageGoal={setUsageGoal} onSaveUsageGoal={handleSaveUsageGoal} />
        <UsageProgressCard usageProgress={5} usageGoal={storedUsageGoal} />
    </View>
  );
}
