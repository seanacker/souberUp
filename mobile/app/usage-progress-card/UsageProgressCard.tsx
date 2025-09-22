import { useState } from "react";
import { View, Text } from "react-native"
import { ProgressBar } from "./ProgressBar";

type UsageProgressCardProps = {
    usageProgress: number;
    usageGoal: number;
}

export const UsageProgressCard = ({usageProgress, usageGoal}: UsageProgressCardProps) => {
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
                {usageGoal}h
            </Text>
            <ProgressBar percentage={usageProgress / usageGoal * 100} />
        </View>
    )
}