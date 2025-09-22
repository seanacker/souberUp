import { Slider } from "@rneui/themed";
import { Text, View } from "react-native";

export interface SliderProps {
    setUsageGoal: (usageGoal: number) => void;
    usageGoal: number;
}

export const UsageSlider = ({ setUsageGoal, usageGoal }: SliderProps) => {
    return (
        <>
        <Slider 
            onValueChange={setUsageGoal} 
            value={usageGoal} 
            minimumValue={0}
            maximumValue={14} 
            step={1} 
            allowTouchTrack={true}
            trackStyle={{ height: 5, backgroundColor: 'transparent' }}
            thumbStyle={{ height: 20, width: 20, backgroundColor: 'transparent' }}
            />
        <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`0h`}</Text>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`2h`}</Text>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`4h`}</Text>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`6h`}</Text>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`8h`}</Text>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`10h`}</Text>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`12h`}</Text>
            <Text style={{height: 20, fontSize: 12, color: 'gray', textAlign: 'left'}}>{`14h`}</Text>
        </View>
        </>
    )
}