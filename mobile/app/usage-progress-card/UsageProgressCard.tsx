import { View, Text } from "react-native"
import { ProgressBar } from "./ProgressBar";
import { UsageStats } from "./getUsageStats";
import { Skeleton } from "@rneui/base";

type UsageProgressCardProps = {
    usageGoalInHours?: number;
    usageStats?: UsageStats;
}

export const UsageProgressCard = ({usageGoalInHours, usageStats}: UsageProgressCardProps) => {
    if (!usageGoalInHours || !usageStats) return (<Skeleton width={100} height={100} />);
    const usageProgress = (usageStats.totalMs ?? 0) / (usageGoalInHours * 60 * 60 * 1000);
    return (
        <View       
            style={{
            width: '100%',
            padding: 10,
            backgroundColor: 'white',
            borderRadius: 10,
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <Text style={{fontSize: 16, fontWeight: 'bold', width: '100%', textAlign: 'center', marginTop: 5}}>
                Time Used This Week
            </Text>
            <Text style={{fontSize: 20, width: '100%', textAlign: 'right', marginTop: 5}}>
                {usageGoalInHours}h
            </Text>
            <ProgressBar percentage={usageProgress} />
        </View>
    )
}